package com.simplytrack.strack_trade_service.repository;
import com.simplytrack.strack_trade_service.entity.Trade;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TradeRepository extends JpaRepository<Trade, Long> {
    List<Trade> findByUserId(String userId);
}