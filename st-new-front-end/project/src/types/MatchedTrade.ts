
//symbol	quantity	price	tradeDate	commission	action	netAmount
//Action	Symbol	Description	Type	Quantity	Price ($)	Commission ($)	Fees ($)	Accrued Interest ($)	Amount ($)

interface MatchedTrade {
  id: number;
  matchTimestamp?: string;
  matchedPrice: number;
  matchedQuantity: number;
  dateAcquired : string;
  dateSold: string;
  action: string;
  symbol: string;
  proceeds: number;
  costBasis: number;
  stGainOrLoss: number;
  ltGainOrLoss: number;
  netAmount?: number;
  optionType?: 'CALL' | 'PUT';
}

export default MatchedTrade;
