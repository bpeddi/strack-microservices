package com.simplytrack.strack_trade_service.repository;
import com.simplytrack.strack_trade_service.DTO.MatchedTradeDTO;
import com.simplytrack.strack_trade_service.entity.MatchedTrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;


public interface MatchedTradeRepository extends JpaRepository<MatchedTrade, Long> {
    
    @Query("SELECT m FROM MatchedTrade m WHERE m.matchTimestamp BETWEEN :start AND :end")
    List<MatchedTrade> findByDateRange(@Param("start") LocalDateTime start, 
                                      @Param("end") LocalDateTime end);

        // Add these new delete methods
// Repository Layer
    @Modifying(flushAutomatically = true, clearAutomatically = true)  // Add both flags
    @Query("DELETE FROM StockMatch m WHERE m.buyTrade.userId = :userId OR m.sellTrade.userId = :userId")
    void deleteStockMatchesByUser(@Param("userId") String userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)  // Add both flags
    @Query("DELETE FROM OptionMatch m WHERE m.buyTrade.userId = :userId OR m.sellTrade.userId = :userId")
    void deleteOptionMatchesByUser(@Param("userId") String userId);

    @Query("SELECT " +
           "m.id, " +
           "m.buyTrade.id, " +
           "m.sellTrade.id, " +
           "m.matchTimestamp, " +
           "m.matchedPrice, " +
           "m.matchedQuantity, " +
           "m.dateAcquired, " +
           "m.dateSold, " +
           "m.proceeds, " +
           "m.costBasis, " +
           "m.stGainOrLoss, " +
           "m.ltGainOrLoss " +
           "FROM MatchedTrade m " +
           "WHERE m.buyTrade.userId = :userId OR m.sellTrade.userId = :userId")
    List<MatchedTradeDTO> findMatchedTradesByUser(@Param("userId") String userId);

        //    "TYPE(m)) " +  // Gets the discriminator value
    //     @Query("SELECT NEW com.simplytrack.strack_trade_service.dto.MatchedTradeDTO(" +
    //        "m.id, " +
    //        "m.buyTrade.id, " +
    //        "m.sellTrade.id, " +
    //        "m.matchTimestamp, " +
    //        "m.matchedPrice, " +
    //        "m.matchedQuantity, " +
    //        "m.dateAcquired, " +
    //        "m.dateSold, " +
    //        "m.proceeds, " +
    //        "m.costBasis, " +
    //        "m.stGainOrLoss, " +
    //        "m.ltGainOrLoss, " +
    //        "FROM MatchedTrade m " +
    //        "WHERE m.buyTrade.userId = :userId OR m.sellTrade.userId = :userId")
    // List<MatchedTradeDTO> findMatchedTradesByUser(@Param("userId") String userId);
}