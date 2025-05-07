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
            "BUY", "BOUGHT", "B", "BOT", 
            // Options and specific buy types
            "BUY TO OPEN", "BTO", "BUY OPEN", "BUY LONG", "OPEN LONG", 
            "BUY MARKET", "BUY LMT", "BUY LIMIT", "BUYL", "BL",
            // Other buy indicators
            "PURCHASE", "ACQUIRE", "ACQUISITION", "ACQ",
            "REINVESTMENT", "REINVEST", "DRIP", 
            "YOU BOUGHT", "EXERCISE", "EXR", "EXERCISED",
            // Single characters
            "O", "B",
            // Broker-specific
            "OPENING PURCHASE", "OP", "LONG", "LNG",
            "DEPOSIT", "DEP", "ADD", "DIVIDEND REINVEST", "DIVR",
            // International/Alternative terms
            "COMPRA", "ACHETER", "KAUFEN", "ACQUIRE",
            // Other variations
            "ENTRY LONG", "ENTRY BUY", "INITIAL BUY", "BUY IN",
            "AVERAGE DOWN", "AVG DOWN", "ADD TO POSITION", "ADD POS",
            "ACCUMULATE", "ACCUM",
            // Abbreviated formats
            "B2O", "LONG ENTRY", "LONG INIT", "LONG IN",
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
            // Single characters with context
            "CS",
            // Abbreviated formats
            "B2C", "SHORT EXIT", "SHORT OUT", "SHORT CLOSE",
            "SHT EXIT", "SHT CLOSE"
        ];
        
        // Group all SELL variations
        const sellPatterns = [
            // Standard terms
            "SELL", "SOLD", "S", "SLD", "SL",
            // Options and specific sell types
            "SELL TO CLOSE", "STC", "SELL CLOSE", "SELL LONG", "CLOSE LONG",
            "SELL MARKET", "SELL LMT", "SELL LIMIT", "SELLL", "SLL",
            // Other sell indicators
            "DISPOSAL", "DISP", "DISPOSITION", "LIQUIDATE", "LIQ", "LIQUIDATION",
            "YOU SOLD", "REDEMPTION", "REDEEM", "RDM", 
            // Single characters
            "C", "X",
            // Broker-specific
            "CLOSING SALE", "CS", "EXIT LONG", "EXIT", "XIT",
            "WITHDRAW", "WTHDR", "WD", "REMOVE", "RMV",
            // International/Alternative terms
            "VENTA", "VENDRE", "VERKAUFEN", "DISPOSE",
            // Other variations
            "TAKE PROFIT", "TP", "STOP LOSS", "SL", "TRAILING STOP", "TS",
            "PARTIAL EXIT", "SCALE OUT", "TRIMMING", "TRIM POS", "REDUCE",
            // Abbreviated formats
            "S2C", "LONG EXIT", "LONG OUT", "LONG CLOSE",
            "LNG EXIT", "LNG CLOSE",
            "SELL ORDER", "SELL TXN", "SELL TRANSACTION"
        ];
        
        // Group all SELLSHORT variations
        const sellshortPatterns = [
            // Standard terms
            "SELLSHORT", "SELL SHORT", "SHORT", "SS", "SHT",
            // Options and specific short types
            "SELL TO OPEN", "STO", "SELL OPEN", "OPEN SHORT", "SHORT OPEN",
            "SHORT MARKET", "SHORT LMT", "SHORT LIMIT", "SHORTL", "SHL",
            // Other short indicators
            "ShtSell", "SHORT SELL", "SHORTING", "SHRT",
            // Single characters with context
            "SO",
            // Broker-specific
            "OPENING SALE", "OS", "BORROW", "BRW", "BORROWED",
            // International/Alternative terms
            "VENTA CORTA", "VENTE À DÉCOUVERT", "LEERVERKAUF",
            // Other variations
            "ENTRY SHORT", "SHORT ENTRY", "INITIAL SHORT", "SHORT INIT",
            "BEARISH POSITION", "BEAR POS", "DOWNSIDE BET", "DOWN BET",
            // Abbreviated formats
            "S2O", "SHORT ENTRY", "SHORT INIT", "SHORT IN",
            "SHT ENTRY", "SHT INIT"
        ];
        
        // Check exact matches first (most reliable)
        if (buyPatterns.includes(normalizedAction)) {
            return TradeAction.BUY;
        }
        
        if (buytocoverPatterns.includes(normalizedAction)) {
            return TradeAction.BUYTOCOVER;
        }
        
        if (sellPatterns.includes(normalizedAction)) {
            return TradeAction.SELL;
        }
        
        if (sellshortPatterns.includes(normalizedAction)) {
            return TradeAction.SELLSHORT;
        }
        
        // Check for specific keyword combinations that uniquely identify action types
        // This is safer than regex and handles compound terms
        const uniqueIdentifiers = [
            { keywords: ["BUY", "TO", "COVER"], action: TradeAction.BUYTOCOVER },
            { keywords: ["BUY", "COVER"], action: TradeAction.BUYTOCOVER },
            { keywords: ["COVER", "SHORT"], action: TradeAction.BUYTOCOVER },
            { keywords: ["CLOSE", "SHORT"], action: TradeAction.BUYTOCOVER },
            
            { keywords: ["SELL", "TO", "OPEN"], action: TradeAction.SELLSHORT },
            { keywords: ["OPENING", "SALE"], action: TradeAction.SELLSHORT },
            { keywords: ["SHORT", "SELL"], action: TradeAction.SELLSHORT },
            { keywords: ["SELL", "SHORT"], action: TradeAction.SELLSHORT },
            
            { keywords: ["SELL", "TO", "CLOSE"], action: TradeAction.SELL },
            { keywords: ["CLOSING", "SALE"], action: TradeAction.SELL },
            { keywords: ["EXIT", "LONG"], action: TradeAction.SELL },
            { keywords: ["CLOSE", "LONG"], action: TradeAction.SELL },
            
            { keywords: ["BUY", "TO", "OPEN"], action: TradeAction.BUY },
            { keywords: ["OPENING", "PURCHASE"], action: TradeAction.BUY },
            { keywords: ["ENTRY", "LONG"], action: TradeAction.BUY },
        ];
        
        for (const { keywords, action } of uniqueIdentifiers) {
            if (keywords.every(keyword => normalizedAction.includes(keyword))) {
                return action;
            }
        }
        
        // Check for partial matches in priority order
        // Start with more specific multi-word patterns
        for (const buytocoverPattern of buytocoverPatterns) {
            if (buytocoverPattern.length > 3 && normalizedAction.includes(buytocoverPattern)) {
                return TradeAction.BUYTOCOVER;
            }
        }
        
        for (const sellshortPattern of sellshortPatterns) {
            if (sellshortPattern.length > 3 && normalizedAction.includes(sellshortPattern)) {
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
        
        // General term checks - these are lower priority
        // Check BUYTOCOVER terms (remaining ones)
        for (const pattern of buytocoverPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.BUYTOCOVER;
            }
        }
        
        // Check SELLSHORT terms (remaining ones)
        for (const pattern of sellshortPatterns) {
            if (normalizedAction.includes(pattern)) {
                return TradeAction.SELLSHORT;
            }
        }
        
        // Lowest priority contains checks
        if (normalizedAction.includes("BOUGHT") || normalizedAction.includes("BUY") || 
            (normalizedAction.includes("LONG") && !normalizedAction.includes("SELL") && !normalizedAction.includes("CLOSE")) || 
            normalizedAction.includes("PURCHASE")) {
            return TradeAction.BUY;
        }
        
        if (normalizedAction.includes("SOLD") || normalizedAction.includes("SELL") || 
            normalizedAction.includes("EXIT") || 
            (normalizedAction.includes("CLOSE") && !normalizedAction.includes("BUY"))) {
            return TradeAction.SELL;
        }
        
        if (normalizedAction.includes("SHORT") && !normalizedAction.includes("BUY") && 
            !normalizedAction.includes("COVER") && !normalizedAction.includes("CLOSE")) {
            return TradeAction.SELLSHORT;
        }
        
        // Numeric pattern handling (with extra checks to avoid false positives)
        if (normalizedAction.match(/^[+]?\d/) && normalizedAction.length < 10) {  
            // Starts with a number or +number and isn't too long (to avoid matching IDs)
            return TradeAction.BUY;
        }
        
        if (normalizedAction.match(/^[-]\d/) && normalizedAction.length < 10) {  
            // Starts with -number and isn't too long (to avoid matching IDs)
            return TradeAction.SELL;
        }
        
        // Default case
        return TradeAction.INVALID;
        
    } catch (ex) {
        console.error("Error in fixTradeAction:", ex);
        return TradeAction.INVALID;
    }
}