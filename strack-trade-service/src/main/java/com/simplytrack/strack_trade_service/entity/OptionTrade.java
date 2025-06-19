package com.simplytrack.strack_trade_service.entity;


import java.time.LocalDateTime;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("OPTION")
public class OptionTrade extends Trade {
    // Option-specific fields
    private String optionType;
    private LocalDateTime expirationDate;
    private double strikePrice;
    private double sharesPerContract;
    private String usymbol;

    public String getOptionType() {
        return this.optionType;
    }

    public void setOptionType(String optionType) {
        this.optionType = optionType;
    }

    public LocalDateTime getExpirationDate() {
        return this.expirationDate;
    }

    public void setExpirationDate(LocalDateTime expirationDate) {
        this.expirationDate = expirationDate;
    }

    public double getStrikePrice() {
        return this.strikePrice;
    }

    public void setStrikePrice(double strikePrice) {
        this.strikePrice = strikePrice;
    }

    public double getSharesPerContract() {
        return this.sharesPerContract;
    }

    public void setSharesPerContract(double sharesPerContract) {
        this.sharesPerContract = sharesPerContract;
    }

    public String getUsymbol() {
        return this.usymbol;
    }

    public void setUsymbol(String usymbol) {
        this.usymbol = usymbol;
    }


    @Override
    public String toString() {
        return "{" +
            " optionType='" + getOptionType() + "'" +
            ", expirationDate='" + getExpirationDate() + "'" +
            ", strikePrice='" + getStrikePrice() + "'" +
            ", sharesPerContract='" + getSharesPerContract() + "'" +
            ", usymbol='" + getUsymbol() + "'" +
            "}";
    }

    
}