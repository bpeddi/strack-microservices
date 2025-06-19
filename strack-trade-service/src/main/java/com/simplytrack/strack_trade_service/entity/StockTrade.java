package com.simplytrack.strack_trade_service.entity;
// import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.*;
import jakarta.persistence.DiscriminatorValue;

@Entity
@DiscriminatorValue("STOCK")
public class StockTrade extends Trade {
    // No additional fields needed if Trade already contains stock-specific fields
}