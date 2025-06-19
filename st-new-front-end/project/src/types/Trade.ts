
//symbol	quantity	price	tradeDate	commission	action	netAmount
//Action	Symbol	Description	Type	Quantity	Price ($)	Commission ($)	Fees ($)	Accrued Interest ($)	Amount ($)

interface Trade {
  id: number;
  trade_type : string;
  tradeDate: string;
  action: string;
  symbol: string;
  quantity: number;
  price: number;
  commission: number;
  portfolioName: string;
  netAmount?: number;
  fee?: number;
  usymbol?: string;
  expirationDate?: string;
  optionType?: 'CALL' | 'PUT';
  strikePrice?: number;
}

export default Trade;