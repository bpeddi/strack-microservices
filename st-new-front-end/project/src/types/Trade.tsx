
//symbol	quantity	price	tradeDate	commission	action	netAmount
//Action	Symbol	Description	Type	Quantity	Price ($)	Commission ($)	Fees ($)	Accrued Interest ($)	Amount ($)


interface Trade {
    id: number;
    tradeDate: string;
    action: string;
    symbol: string;
    quantity: number;
    price: number;
    commission: number;
    netAmount: number;
  }

  export default Trade;