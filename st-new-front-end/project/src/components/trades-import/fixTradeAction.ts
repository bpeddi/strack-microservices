// Define the possible trade action types
enum TradeAction {
    BUY = "BUY",
    SELL = "SELL",
    BUYTOCOVER = "BUYTOCOVER",
    SELLSHORT = "SELLSHORT",
    INVALID = "INVALID"
}

/**
 * Standardizes trade action strings into a consistent format
 * @param action The raw trade action string from the Excel file
 * @returns The standardized TradeAction enum value
 */
export function fixTradeAction(action: string): TradeAction {
    try {
        // Handle null or empty input
        if (!action) {
            return TradeAction.INVALID;
        }
        
        // Convert to uppercase and trim for consistent comparison
        const normalizedAction = action.trim().toUpperCase();
        
        // Group all BUY variations
        const buyPatterns = [
            // Standard terms
            "BUY", "BOUGHT", 
            // Options and specific buy types
            "BUY TO OPEN",  "BUY OPEN", "BUY LONG", "OPEN LONG", 
            "BUY MARKET", "BUY LMT", "BUY LIMIT", "BUYL", 
            // Other buy indicators
            "PURCHASE", "ACQUIRE", "ACQUISITION", 
            "REINVESTMENT", "REINVEST",  
            "YOU BOUGHT", "EXERCISE",  "EXERCISED",
            // Broker-specific
            "OPENING PURCHASE", "LONG", "LNG",
            // Other variations
            "ENTRY LONG", "ENTRY BUY", "INITIAL BUY", "BUY IN",
            // Abbreviated formats
            "LONG ENTRY", "LONG INIT", "LONG IN",
            "BUY ORDER", "BUY TXN", "BUY TRANSACTION"
        ];
        
        // Group all BUYTOCOVER variations
        const buytocoverPatterns = [
            // Standard terms
            "BUYTOCOVER", "BUY TO COVER", "BTC", "BC",
            // Action descriptions
            "COVER", "COVER SHORT", "COVERING", "CVR", "CvrShrt", 
            "BUY TO CLOSE", "CLOSE SHORT", "CLOSE SHORT POSITION",
            // Other variations
            "EXIT SHORT", "SHORT COVER", "SHORTCOVER", "COVER POSITION",
            "SHORT EXIT", "SHORT BUY", "BTSC", "BUY SHORT CLOSE",
            "REMOVE SHORT", "REMOVE SHORT POS", "UNSHORT", "REVERSE SHORT",
            "B2C", "SHORT EXIT", "SHORT OUT", "SHORT CLOSE",
  
        ];
        
        // Group all SELL variations
        const sellPatterns = [
            // Standard terms
            "SELL", "SOLD", "S", "SL",
            // Options and specific sell types
            "SELL TO CLOSE", "SELL CLOSE", "SELL LONG", "CLOSE LONG",
            "SELL MARKET", "SELL LMT", "SELL LIMIT", "SELLL", 
            // Other sell indicators
            "DISPOSAL", "DISP", "DISPOSITION", "LIQUIDATE", "LIQUIDATION",
            "YOU SOLD", "REDEMPTION",
            "CLOSING SALE", 
            "WITHDRAW", "WTHDR", 
        ];
        
        // Group all SELLSHORT variations
        const sellshortPatterns = [
            // Standard terms
            "SELLSHORT", "SELL SHORT", "SHORT",
            // Options and specific short types
            "SELL TO OPEN", "SELL OPEN", "OPEN SHORT", "SHORT OPEN",
            "SHORT MARKET", "SHORT LMT", "SHORT LIMIT", 
            // Other short indicators
            "ShtSell", "SHORT SELL", "SHORTING", 
            // Other variations
            "ENTRY SHORT", "SHORT ENTRY", "INITIAL SHORT", "SHORT INIT",
        ];
        
        // Check for partial matches instead of exact matches
        // This will handle cases where the action string contains additional information
        
        // Check for BUY patterns
        for (const pattern of buyPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.BUY;
            }
        }
        
        // Check for BUYTOCOVER patterns
        for (const pattern of buytocoverPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.BUYTOCOVER;
            }
        }
        
        // Check for SELL patterns
        for (const pattern of sellPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.SELL;
            }
        }
        
        // Check for SELLSHORT patterns
        for (const pattern of sellshortPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.SELLSHORT;
            }
        }
        
        // Additional context-based analysis for specific scenarios
        if (normalizedAction.includes("EXERCISE") && normalizedAction.includes("OPTION")) {
            return TradeAction.BUY;
        }
        
        if (normalizedAction.includes("ASSIGN") && normalizedAction.includes("OPTION")) {
            return TradeAction.SELL;
        }
        
        // These are the most general checks - must come last
        if (normalizedAction.includes("DIVIDEND") || 
            (normalizedAction.includes("DIV") && normalizedAction.includes("REINV"))) {
            // Dividend reinvestment is typically a buy
            return TradeAction.BUY;
        }
 
        // Default case
        return TradeAction.INVALID;
        
    } catch (ex) {
        console.error("Error in fixTradeAction:", ex);
        return TradeAction.INVALID;
    }
}