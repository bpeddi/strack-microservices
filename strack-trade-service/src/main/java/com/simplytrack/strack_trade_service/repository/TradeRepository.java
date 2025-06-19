package com.simplytrack.strack_trade_service.repository;
import com.simplytrack.strack_trade_service.entity.OptionTrade;
import com.simplytrack.strack_trade_service.entity.StockTrade;
import com.simplytrack.strack_trade_service.entity.Trade;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TradeRepository extends JpaRepository<Trade, Long> {


    List<Trade> findByUserId(String userId);

    // OR if using Spring Data derived query method:
    @Transactional
    int deleteByIdAndUserId(Long id, String userId);
    
    // Optional<Trade>  findByIdAndUserId(Long id, String userId);
    List<Trade> findByUserIdAndSymbol(String userId, String symbol);

    @Query("SELECT t FROM Trade t WHERE t.id = :id AND t.userId = :userId")
    Optional<Trade> findByIdAndUserId(@Param("id") Long id, @Param("userId") String userId);

    @Query("SELECT count(*) FROM Trade t where t.userId = :userId ")
    Long getTradesCount( @Param("userId") String userId);


        // New methods for OptionTrades:
    @Query("SELECT o FROM OptionTrade o WHERE o.userId = :userId")
    List<OptionTrade> findOptionTradesByUserId(@Param("userId") String userId);

    @Query("SELECT o FROM OptionTrade o WHERE o.expirationDate BETWEEN :start AND :end")
    List<OptionTrade> findOptionTradesExpiringBetween(
        @Param("start") LocalDateTime start, 
        @Param("end") LocalDateTime end
    );

    // Example for StockTrades (if needed):
    @Query("SELECT s FROM StockTrade s WHERE s.userId = :userId")
    List<StockTrade> findStockTradesByUserId(@Param("userId") String userId);

    List<Trade> findByMatchedQtyLeftGreaterThan(BigDecimal qty);

}