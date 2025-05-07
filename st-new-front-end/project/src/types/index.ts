export interface User {
  id: string;
  email: string;
  token: string;
}

export interface Trade {
  id: string;
  action: 'buy' | 'sell';
  date: string;
  symbol: string;
  quantity: number;
  price: number;
  commission: number;
}

export interface MatchedTrade {
  id: string;
  buyTradeId: string;
  sellTradeId: string;
  symbol: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
}