package com.simplytrack.strack_trade_service.controller;

import com.simplytrack.strack_trade_service.repository.TradeRepository;
// import com.simplytrack.strack_trade_service.config.JwtTokenUtil;
import com.simplytrack.strack_trade_service.entity.Trade;

import org.apache.hc.core5.http.HttpStatus;
import org.springframework.dao.DataAccessException;
// import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import lombok.extern.slf4j.Slf4j;


import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Supplier;
import java.util.logging.Logger;

@Slf4j
@RestController
@RequestMapping("/api/trades")
public class TradeController {

    // @Autowired
    // private JwtTokenUtil jwtTokenUtil;

    private final TradeRepository tradeRepository;
    Logger logger = Logger.getLogger(getClass().getName());

    public TradeController(TradeRepository tradeRepository) {
        this.tradeRepository = tradeRepository;
    }



    @PostMapping
    public ResponseEntity<Trade> createTrade(@RequestBody Trade tradeRequest, Authentication authentication) {
        String userId = authentication.getName();
        System.out.println("I am in create trade");
        // String userId2 = jwtTokenUtil.getUsernameFromToken()

        tradeRequest.setUserId(userId);
        Trade savedTrade = tradeRepository.save(tradeRequest);
        return ResponseEntity.ok(savedTrade);
    }

    private Long convertToLong(Object obj) {
        if (obj == null) return null;
        try {
            if (obj instanceof String) {
                return Long.parseLong((String) obj);
            } else if (obj instanceof Number) {
                return ((Number) obj).longValue();
            }
        } catch (NumberFormatException e) {
            return null;
        }
        return null;
    }
    @PostMapping("/delete")
    public ResponseEntity<?> deleteTrade(@RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            Object tradeIdObj = request.get("id");
            Long tradeId = convertToLong(tradeIdObj);
            logger.info((String) tradeIdObj);
            logger.info((String) userId);
            
            try {
                if (tradeIdObj instanceof String ) {
                    tradeId = Long.parseLong((String) tradeIdObj);
                } else if (tradeIdObj instanceof Number ) {
                    tradeId = ((Number) tradeIdObj).longValue();
                }
            } catch (NumberFormatException e) {
                log.warn("Invalid trade ID format: {}", tradeIdObj);
                return ResponseEntity.badRequest().body("Invalid trade ID format");
            }

            // Validate input
            if (tradeId == null ) {
                return ResponseEntity.badRequest().body("Trade ID is required");
            }

            // Check existence and ownership
            Optional<Trade> tradeOptional = tradeRepository.findByIdAndUserId(tradeId, userId);
            if (tradeOptional.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            // The ownership check is technically redundant since findByTradeIdAndUserId
            // already verified it
            // But kept for explicit security check
            Trade trade = tradeOptional.get();
            if (!trade.getUserId().equals(userId)) {
                return ResponseEntity.status(HttpStatus.SC_FORBIDDEN).build();
            }

            // Perform deletion with error handling
            try {
                int deletedCount = tradeRepository.deleteByIdAndUserId(tradeId, userId);

                if (deletedCount == 0) {
                    // This shouldn't happen since we just verified the trade exists
                    return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                            .body("Failed to delete trade");
                }

                return ResponseEntity.ok().body(
                        Map.of(
                                "status", "success",
                                "message", "Trade deleted successfully",
                                "tradeId", tradeId));

            } catch (DataAccessException e) {
                log.error("Database error while deleting trade {}: {}", tradeId, e.getMessage());
                return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                        .body("Database error occurred");
            }

        } catch (Exception e) {
            log.error("Unexpected error in deleteTrade: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SC_INTERNAL_SERVER_ERROR)
                    .body("An unexpected error occurred");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrade(
        @PathVariable Long id,
        @RequestBody Trade updatedTrade,
        Authentication authentication
    ) {
        String userId = authentication.getName();
        
        // 1. Find existing trade
        Optional<Trade> existingTrade = tradeRepository.findByIdAndUserId(id, userId);
        
        if (existingTrade.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        // 2. Update fields
        Trade trade = existingTrade.get();
        trade.setSymbol(updatedTrade.getSymbol());
        trade.setQuantity(updatedTrade.getQuantity());
        trade.setPrice(updatedTrade.getPrice());
        trade.setCommission(updatedTrade.getCommission());
        trade.setAction(updatedTrade.getAction());
        trade.setTradeDate(updatedTrade.getTradeDate());
        
        // 3. Recalculate net amount if needed
        trade.setNetAmount(
            trade.getPrice().multiply(BigDecimal.valueOf(trade.getQuantity()))
                .subtract(trade.getCommission())
        );
        
        // 4. Save updated trade
        Trade savedTrade = tradeRepository.save(trade);
        
        return ResponseEntity.ok(savedTrade);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<Trade>> createBatchTrades(@RequestBody List<Trade> trades,
            Authentication authentication) {
        String userId = authentication.getName();
    
        trades.forEach(trade -> {
            // Set user ID
            trade.setUserId(userId);
            
            // Handle null values for price and commission
            BigDecimal price = trade.getPrice() != null ? trade.getPrice() : BigDecimal.ZERO;
            BigDecimal commission = trade.getCommission() != null ? trade.getCommission() : BigDecimal.ZERO;
            
            // Calculate netAmount if not already set
            if (trade.getNetAmount() == null) {
                BigDecimal quantity = BigDecimal.valueOf(trade.getQuantity());
                BigDecimal grossAmount = price.multiply(quantity);
                BigDecimal netAmount = grossAmount.subtract(commission);
                trade.setNetAmount(netAmount);
            }
        });
        
        for (int i = 0; i < trades.size() && i < 2; i++) {
            Trade trade = trades.get(i);
            logger.info(() -> "Trade: " + trade.toString());
            logger.info(() -> "Trade Date: " + trade.getTradeDate());
        }
    
        List<Trade> savedTrades = tradeRepository.saveAll(trades);
        return ResponseEntity.ok(savedTrades);
    }

    @GetMapping
    public ResponseEntity<List<Trade>> getTradesByUser(Authentication authentication) {
        String userId = authentication.getName();
        List<Trade> trades = tradeRepository.findByUserId(userId);
        return ResponseEntity.ok(trades);
    }
}