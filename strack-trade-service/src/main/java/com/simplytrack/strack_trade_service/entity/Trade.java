package com.simplytrack.strack_trade_service.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.simplytrack.strack_trade_service.types.ActionType;
import com.simplytrack.strack_trade_service.types.TradeType;


@Entity
@Table(name = "trades")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "trade_type", discriminatorType = DiscriminatorType.STRING)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "trade_type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = StockTrade.class, name = "STOCK"),
    @JsonSubTypes.Type(value = OptionTrade.class, name = "OPTION")
})



public abstract class Trade {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String userId;
    @Column(nullable = false)
    private String portfolioName;
    private String symbol;
    private BigDecimal quantity;
    private BigDecimal price;
    private LocalDateTime tradeDate;
    private BigDecimal commission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType action;

    private BigDecimal netAmount;
    private  BigDecimal fee;
    @Enumerated(EnumType.STRING)
    @Column(name="trade_type", insertable=false, updatable=false)
    private TradeType tradeType;

        /** how many shares/qty are still unmatched */
    // @Column(nullable = false, columnDefinition = "DECIMAL(38,2) DEFAULT 0.00")
    private BigDecimal matchedQtyLeft ;

    public Trade() {
        this.matchedQtyLeft = this.quantity; // Initialize with original quantity
    }


    public BigDecimal getMatchedQtyLeft() {
        return this.matchedQtyLeft;
    }

    public void setMatchedQtyLeft(BigDecimal matchedQtyLeft) {
        this.matchedQtyLeft = matchedQtyLeft;
    }


    public TradeType getTradeType() {
        return this.tradeType;
    }

    public void setTradeType(TradeType tradeType) {
        this.tradeType = tradeType;
    }


    public String getPortfolioName() {
        return this.portfolioName;
    }

    public void setPortfolioName(String portfolioName) {
        this.portfolioName = portfolioName;
    }

    public BigDecimal getFee() {
        return this.fee;
    }

    public void setFee(BigDecimal fee) {
        this.fee = fee;
    }

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return this.userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSymbol() {
        return this.symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public BigDecimal getQuantity() {
        return this.quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getPrice() {
        return this.price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDateTime getTradeDate() {
        return this.tradeDate;
    }

    public void setTradeDate(LocalDateTime tradeDate) {
        this.tradeDate = tradeDate;
    }

    public BigDecimal getCommission() {
        return this.commission;
    }

    public void setCommission(BigDecimal commission) {
        this.commission = commission;
    }

    public ActionType getAction() {
        return this.action;
    }

    public void setAction(ActionType action) {
        this.action = action;
    }

    public BigDecimal getNetAmount() {
        return this.netAmount;
    }

    public void setNetAmount(BigDecimal netAmount) {
        this.netAmount = netAmount;
    }

    @Override
    public String toString() {
        return "{" +
            " id='" + getId() + "'" +
            ", userId='" + getUserId() + "'" +
            ", symbol='" + getSymbol() + "'" +
            ", quantity='" + getQuantity() + "'" +
            ", price='" + getPrice() + "'" +
            ", tradeDate='" + getTradeDate() + "'" +
            ", commission='" + getCommission() + "'" +
            ", action='" + getAction() + "'" +
            ", netAmount='" + getNetAmount() + "'" +
            "}";
    }

    // Getters and Setters
}