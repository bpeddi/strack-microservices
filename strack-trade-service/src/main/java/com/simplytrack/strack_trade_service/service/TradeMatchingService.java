package com.simplytrack.strack_trade_service.service;

import java.util.stream.Collectors;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

import org.springframework.stereotype.Service;

import com.simplytrack.strack_trade_service.repository.MatchedTradeRepository;
import com.simplytrack.strack_trade_service.repository.TradeRepository;
import com.simplytrack.strack_trade_service.entity.MatchedTrade;
import com.simplytrack.strack_trade_service.entity.OptionMatch;
import com.simplytrack.strack_trade_service.entity.StockMatch;
import com.simplytrack.strack_trade_service.entity.Trade;
import com.simplytrack.strack_trade_service.types.ActionType;
import com.simplytrack.strack_trade_service.types.TradeType;
import org.springframework.security.core.Authentication;

// import jakarta.transaction.Transactional;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TradeMatchingService {

    private final TradeRepository tradeRepo;
    private final MatchedTradeRepository matchRepo;

    public TradeMatchingService(TradeRepository tradeRepo,
            MatchedTradeRepository matchRepo) {
        this.tradeRepo = tradeRepo;
        this.matchRepo = matchRepo;
    }

    /**
     * Finds all unmatched trades, groups them by portfolio & tradeType,
     * matches buys↔sells (FIFO) and shorts↔covers, persists & returns matches.
     */
    @Transactional
    public List<MatchedTrade> matchAll() {
        // 1) load all trades
        List<Trade> all = tradeRepo.findAll();
        // List<Trade> all = tradeRepo.findByMatchedQtyLeftGreaterThan(new
        // BigDecimal("0"));
        // System.out.println("*********Matched traders input *********");
        // all.forEach(System.out::println);
        // 2) group by portfolio + +Symbol + tradeType
        Map<String, Map<String, Map<TradeType, List<Trade>>>> byPortfolioSymbolType = all.stream()
                .collect(Collectors.groupingBy(
                        Trade::getPortfolioName, // Group by portfolio
                        Collectors.groupingBy(
                                Trade::getSymbol, // Then by symbol
                                Collectors.groupingBy(Trade::getTradeType) // Then by tradeType
                        )));

        List<MatchedTrade> results = new ArrayList<>();

        // Loop through portfolios
        for (var portfolioEntry : byPortfolioSymbolType.entrySet()) {
            String portfolio = portfolioEntry.getKey();
            // System.out.println("Portfolio = " + portfolio);
            Map<String, Map<TradeType, List<Trade>>> symbolMap = portfolioEntry.getValue();

            // Loop through symbols in the portfolio
            for (var symbolEntry : symbolMap.entrySet()) {
                String symbol = symbolEntry.getKey();
                // System.out.println("symbol = " + symbol);
                Map<TradeType, List<Trade>> typeMap = symbolEntry.getValue();

                // Loop through trade types (STOCK/OPTION) in the symbol
                for (var typeEntry : typeMap.entrySet()) {
                    TradeType tType = typeEntry.getKey();
                    List<Trade> trades = typeEntry.getValue();

                    // Split into queues (BUY/SELL/SHORT/COVER) as before
                    Queue<Trade> buys = new PriorityQueue<>(Comparator.comparing(Trade::getTradeDate));
                    Queue<Trade> sells = new PriorityQueue<>(Comparator.comparing(Trade::getTradeDate));
                    Queue<Trade> shorts = new PriorityQueue<>(Comparator.comparing(Trade::getTradeDate));
                    Queue<Trade> covers = new PriorityQueue<>(Comparator.comparing(Trade::getTradeDate));

                    for (Trade t : trades) {
                        switch (t.getAction()) {
                            case BUY:
                                buys.add(t);
                                break;
                            case SELL:
                                sells.add(t);
                                break;
                            case SHORT:
                                shorts.add(t);
                                break;
                            case COVER:
                                covers.add(t);
                                break;
                        }
                    }

                    // Match BUY↔SELL and SHORT↔COVER for the same symbol
                    results.addAll(matchQueues(buys, sells, tType));
                    results.addAll(matchQueues(shorts, covers, tType));
                }
            }
        }
        // System.out.println("*********Matched traders *********");
        results.forEach(System.out::println);
        // save all matches
        return matchRepo.saveAll(results);
    }

    private List<MatchedTrade> matchQueues(Queue<Trade> open, Queue<Trade> counter, TradeType type) {
        List<MatchedTrade> matches = new ArrayList<>();

        while (!open.isEmpty() && !counter.isEmpty()) {
            Trade tOpen = open.peek();
            Trade tCounter = counter.peek();
            BigDecimal qtyToMatch = tOpen.getMatchedQtyLeft().min(tCounter.getMatchedQtyLeft());
            // Math.min(tOpen.getQuantity(), tCounter.getQuantity());

            MatchedTrade mt = (type == TradeType.STOCK)
                    ? new StockMatch()
                    : new OptionMatch();

            mt.setBuyTrade(
                    tOpen.getAction() == ActionType.BUY || tOpen.getAction() == ActionType.COVER ? tOpen : tCounter);
            mt.setSellTrade(
                    tOpen.getAction() == ActionType.SELL || tOpen.getAction() == ActionType.SHORT ? tOpen : tCounter);
            mt.setMatchedQuantity(qtyToMatch);
            mt.setMatchedPrice(tCounter.getPrice());
            mt.setMatchTimestamp(LocalDateTime.now());

            // set data acquired and data sold
            mt.setDateAcquired(tOpen.getTradeDate());
            mt.setDateSold(tCounter.getTradeDate());

            // Calculate Proceeds

            // Calculate commission portions (proportional to matched quantity)
            BigDecimal buyCommissionPortion = calculateCommissionPortion(tOpen, qtyToMatch);
            BigDecimal sellCommissionPortion = calculateCommissionPortion(tCounter, qtyToMatch);

            // Proceeds = (sell price * qty) - sell commission portion
            BigDecimal proceeds = tCounter.getPrice()
                    .multiply(qtyToMatch)
                    .subtract(sellCommissionPortion);

            // Cost basis = (buy price * qty) - buy commission portion
            BigDecimal costBasis = tOpen.getPrice()
                    .multiply(qtyToMatch)
                    .subtract(buyCommissionPortion);

            mt.setProceeds(proceeds);
            mt.setCostBasis(costBasis);

            // Calculate holding period days
            LocalDate acquiredDate = mt.getDateAcquired().toLocalDate();
            LocalDate soldDate = mt.getDateSold().toLocalDate();
            long daysHeld = ChronoUnit.DAYS.between(acquiredDate, soldDate);

            // Determine ST/LT gains
            BigDecimal gainLoss = proceeds.subtract(costBasis);

            if (daysHeld < 365) {
                mt.setStGainOrLoss(gainLoss);
                mt.setLtGainOrLoss(BigDecimal.ZERO);
            } else {
                mt.setStGainOrLoss(BigDecimal.ZERO);
                mt.setLtGainOrLoss(gainLoss);
            }

            matches.add(mt);

            // decrement quantities and pop if fully matched
            adjustTradeAfterMatch(tOpen, qtyToMatch);
            adjustTradeAfterMatch(tCounter, qtyToMatch);

            // if either is now fully matched, pop it off the queue
            if (tOpen.getMatchedQtyLeft().compareTo(BigDecimal.ZERO) == 0)
                open.remove();
            if (tCounter.getMatchedQtyLeft().compareTo(BigDecimal.ZERO) == 0)
                counter.remove();
        }
        // System.out.println("*********Each Matched traders *********");
        matches.forEach(System.out::println);
        return matches;
    }

    // Helper method to calculate commission portion for a trade
    private BigDecimal calculateCommissionPortion(Trade trade, BigDecimal matchedQty) {
        if (trade.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO; // Avoid division by zero
        }
        // Portion = (matchedQty / originalQty) * commission
        return trade.getCommission()
                .multiply(matchedQty)
                .divide(trade.getQuantity(), 2, RoundingMode.HALF_UP); // Scale=2, rounding=HALF_UP
    }

    private void adjustTradeAfterMatch(Trade t, BigDecimal matched) {
        BigDecimal remaining = t.getMatchedQtyLeft().subtract(matched);
        t.setMatchedQtyLeft(new BigDecimal("0").max(remaining));
        // tOpen.getQuantity().min(tCounter.getQuantity());
        // persist the updated trade so later matches only see the new matchedQtyLeft
        // System.out.println("*********tradeRepo start *********");
        tradeRepo.save(t);
        // System.out.println("*********tradeRepo end *********");
    }

    @Transactional // Make sure this is Spring's annotation
    public void resetMatchTrades(Authentication authentication) {
        String userId = authentication.getName();
        matchRepo.deleteStockMatchesByUser(userId);
        matchRepo.deleteOptionMatchesByUser(userId);
    }

    //@Transactional // Make sure this is Spring's annotation
    public void resetMatchQuantityLeft(Authentication authentication) {
        String userId = authentication.getName();
        List<Trade> trades = tradeRepo.findByUserId(userId);
        trades.forEach(trade -> {
            trade.setMatchedQtyLeft(trade.getQuantity());
            tradeRepo.save(trade);
        });
    }
}
// private void adjustQueue(Queue<Trade> q, BigDecimal matched) {
// Trade t = q.peek();
// t.setQuantity(t.getQuantity().subtract(matched));
// if (t.getQuantity() == new BigDecimal("0")) {
// q.remove();
// }
// }