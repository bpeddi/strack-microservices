package com.simplytrack.strack_trade_service.DTO;


import java.math.BigDecimal;
import java.time.LocalDateTime;

public class MatchedTradeDTO {
    private Long id;
    private Long buyTradeId;
    private Long sellTradeId;
    private LocalDateTime matchTimestamp;
    private BigDecimal matchedPrice;
    private BigDecimal matchedQuantity;
    private LocalDateTime dateAcquired;
    private LocalDateTime dateSold;
    private BigDecimal proceeds;
    private BigDecimal costBasis;
    private BigDecimal stGainOrLoss;
    private BigDecimal ltGainOrLoss;
    private String matchType;

    // Constructor
    public MatchedTradeDTO(
            Long id,
            Long buyTradeId,
            Long sellTradeId,
            LocalDateTime matchTimestamp,
            BigDecimal matchedPrice,
            BigDecimal matchedQuantity,
            LocalDateTime dateAcquired,
            LocalDateTime dateSold,
            BigDecimal proceeds,
            BigDecimal costBasis,
            BigDecimal stGainOrLoss,
            BigDecimal ltGainOrLoss,
            String matchType) {
        this.id = id;
        this.buyTradeId = buyTradeId;
        this.sellTradeId = sellTradeId;
        this.matchTimestamp = matchTimestamp;
        this.matchedPrice = matchedPrice;
        this.matchedQuantity = matchedQuantity;
        this.dateAcquired = dateAcquired;
        this.dateSold = dateSold;
        this.proceeds = proceeds;
        this.costBasis = costBasis;
        this.stGainOrLoss = stGainOrLoss;
        this.ltGainOrLoss = ltGainOrLoss;
        this.matchType = matchType;
    }

    // Getters
    public Long getId() { return id; }
    public Long getBuyTradeId() { return buyTradeId; }
    public Long getSellTradeId() { return sellTradeId; }
    public LocalDateTime getMatchTimestamp() { return matchTimestamp; }
    public BigDecimal getMatchedPrice() { return matchedPrice; }
    public BigDecimal getMatchedQuantity() { return matchedQuantity; }
    public LocalDateTime getDateAcquired() { return dateAcquired; }
    public LocalDateTime getDateSold() { return dateSold; }
    public BigDecimal getProceeds() { return proceeds; }
    public BigDecimal getCostBasis() { return costBasis; }
    public BigDecimal getStGainOrLoss() { return stGainOrLoss; }
    public BigDecimal getLtGainOrLoss() { return ltGainOrLoss; }
    public String getMatchType() { return matchType; }
}