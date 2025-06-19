package com.simplytrack.strack_trade_service.entity;
import java.math.BigDecimal;

import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

@Entity
@DiscriminatorValue("OPTION")
public class OptionMatch extends MatchedTrade {
    // Option-specific match fields
    private BigDecimal optionPremium;
    private String contractId;
    


    public BigDecimal getOptionPremium() {
        return this.optionPremium;
    }

    public void setOptionPremium(BigDecimal optionPremium) {
        this.optionPremium = optionPremium;
    }

    public String getContractId() {
        return this.contractId;
    }

    public void setContractId(String contractId) {
        this.contractId = contractId;
    }

}