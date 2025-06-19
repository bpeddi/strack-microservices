package com.simplytrack.strack_trade_service.entity;


import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("STOCK")
public class StockMatch extends MatchedTrade {
    // Stock-specific match fields if needed
}
