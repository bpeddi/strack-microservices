import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { MatchedTrade } from '../types/indexold';

const MatchTradesPage: React.FC = () => {
  const { user } = useAuth();
  const [matchedTrades, setMatchedTrades] = useState<MatchedTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMatchTrades = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:8080/api/matching/customers/${user.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to match trades');
      }

      const result = await response.json();
      setMatchedTrades(result);
    } catch (error) {
      console.error('Error matching trades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Match Trades</h1>
        <button
          onClick={handleMatchTrades}
          disabled={isLoading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Matching...' : 'Match Trades'}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {matchedTrades.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buy Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sell Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit/Loss</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {matchedTrades.map((trade) => (
                <tr key={trade.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{trade.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trade.buyPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${trade.sellPrice.toFixed(2)}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${trade.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${trade.profitLoss.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No matched trades yet. Click the "Match Trades" button to start matching.
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchTradesPage;