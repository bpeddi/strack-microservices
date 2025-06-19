package com.simplytrack.strack_trade_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Supplier;

import org.springframework.data.repository.query.Param;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.simplytrack.strack_trade_service.DTO.MatchedTradeDTO;


@Entity
@Table(name = "matched_trades")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "match_type", discriminatorType = DiscriminatorType.STRING)
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "match_type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = StockMatch.class, name = "STOCK"),
    @JsonSubTypes.Type(value = OptionMatch.class, name = "OPTION")
})

public abstract class MatchedTrade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

 
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buy_trade_id", nullable = false)
    private Trade buyTrade;

    @ManyToOne
    @JoinColumn(name = "sell_trade_id", nullable = false)
    private Trade sellTrade;

    private LocalDateTime matchTimestamp;
    private BigDecimal matchedPrice;
    private BigDecimal matchedQuantity;
    private LocalDateTime dateAcquired;
    private LocalDateTime dateSold;
    private BigDecimal proceeds;
    private BigDecimal costBasis;
    private BigDecimal stGainOrLoss;
    private BigDecimal ltGainOrLoss;
    
    public LocalDateTime getDateAcquired() {
        return this.dateAcquired;
    }

    public void setDateAcquired(LocalDateTime dateAcquired) {
        this.dateAcquired = dateAcquired;
    }

    public LocalDateTime getDateSold() {
        return this.dateSold;
    }

    public void setDateSold(LocalDateTime dateSold) {
        this.dateSold = dateSold;
    }

    public BigDecimal getProceeds() {
        return this.proceeds;
    }

    public void setProceeds(BigDecimal proceeds) {
        this.proceeds = proceeds;
    }

    public BigDecimal getCostBasis() {
        return this.costBasis;
    }

    public void setCostBasis(BigDecimal costBasis) {
        this.costBasis = costBasis;
    }

    public BigDecimal getStGainOrLoss() {
        return this.stGainOrLoss;
    }

    public void setStGainOrLoss(BigDecimal stGainOrLoss) {
        this.stGainOrLoss = stGainOrLoss;
    }

    public BigDecimal getLtGainOrLoss() {
        return this.ltGainOrLoss;
    }

    public void setLtGainOrLoss(BigDecimal ltGainOrLoss) {
        this.ltGainOrLoss = ltGainOrLoss;
    }


    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Trade getBuyTrade() {
        return this.buyTrade;
    }

    public void setBuyTrade(Trade buyTrade) {
        this.buyTrade = buyTrade;
    }

    public Trade getSellTrade() {
        return this.sellTrade;
    }

    public void setSellTrade(Trade sellTrade) {
        this.sellTrade = sellTrade;
    }

    public LocalDateTime getMatchTimestamp() {
        return this.matchTimestamp;
    }

    public void setMatchTimestamp(LocalDateTime matchTimestamp) {
        this.matchTimestamp = matchTimestamp;
    }

    public BigDecimal getMatchedPrice() {
        return this.matchedPrice;
    }

    public void setMatchedPrice(BigDecimal matchedPrice) {
        this.matchedPrice = matchedPrice;
    }

    public BigDecimal getMatchedQuantity() {
        return this.matchedQuantity;
    }

    public void setMatchedQuantity(BigDecimal matchedQuantity) {
        this.matchedQuantity = matchedQuantity;
    }

    @Override
    public String toString() {
        return "{" +
            " id='" + getId() + "'" +
            ", buyTrade='" + getBuyTrade() + "'" +
            ", sellTrade='" + getSellTrade() + "'" +
            ", matchTimestamp='" + getMatchTimestamp() + "'" +
            ", matchedPrice='" + getMatchedPrice() + "'" +
            ", matchedQuantity='" + getMatchedQuantity() + "'" +
            ", dateAcquired='" + getDateAcquired() + "'" +
            ", dateSold='" + getDateSold() + "'" +
            ", proceeds='" + getProceeds() + "'" +
            ", costBasis='" + getCostBasis() + "'" +
            ", stGainOrLoss='" + getStGainOrLoss() + "'" +
            ", ltGainOrLoss='" + getLtGainOrLoss() + "'" +
            "}";
    }

    // Getters and setters
}