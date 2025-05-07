// src/components/ManageTrades.tsx
import React, { useRef, useState, useEffect } from 'react';

import axios from 'axios';
import { Trade } from '../types';
import { HelpCircle, X, ChevronUp, ChevronDown } from 'lucide-react';
import { convertToDate } from './trades-import/ConvertToDate';
interface ManageTradesProps {
  token: string | null;
  isAuthenticated: boolean;
  refreshCount: boolean;
}

const ManageTrades: React.FC<ManageTradesProps> = ({ token, isAuthenticated, refreshCount }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // Keep all other state variables related to management:

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Trade | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // New state variables for improvements
  const [tradesPerPage, setTradesPerPage] = useState<number>(10);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  // Sort state variables
  const [sortField, setSortField] = useState<keyof Trade>('tradeDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Newest first by default
  const [newTradeData, setNewTradeData] = useState<Partial<Trade>>({
    action: 'BUY',
    symbol: '',
    quantity: 0,
    price: 0,
    commission: 0,
    netAmount: 0,
    tradeDate: new Date().toISOString().split('T')[0]
  });
// Add this inside your component
const inputRef = useRef<HTMLInputElement>(null);
const allIds = trades.map(trade => trade.id);

// Check if all items are selected
const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
// Check if some (but not all) items are selected
const isSomeSelected = !isAllSelected && selectedIds.length > 0;

  // useEffect(() => {
  //   if (isAuthenticated && token) {
  //     fetchTrades();
  //     console.log("fetching trades")
  //   }
  //   if (inputRef.current) {
  //     inputRef.current.indeterminate = isSomeSelected;
  //   }
  // }, [refreshCount]);

  // Separate useEffect for fetching trades
useEffect(() => {
  if (isAuthenticated && token) {
    fetchTrades();
    console.log("fetching trades");
  }
}, [refreshCount]); // Only runs when refreshCount changes

// Separate useEffect for checkbox state
useEffect(() => {
  if (inputRef.current) {
    inputRef.current.indeterminate = isSomeSelected;
  }
}, [isSomeSelected]); // Runs only when selection state changes

// Separate useEffect for initial auth check (if needed)
useEffect(() => {
  if (isAuthenticated && token) {
    fetchTrades();
  }
}, [isAuthenticated, token]); // Optional: fetch on auth changes

//isSomeSelected
  const toggleSelectAll = () => {
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds([...allIds]);
    }
  };



  const fetchTrades = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Trade[]>(`http://localhost:8081/api/trades`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTrades(response.data);
      setCurrentPage(1);
      setError('');
    } catch (err: any) {
      setError('Failed to fetch trades');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages: number = Math.ceil(filteredTrades.length / tradesPerPage);

  // Sort trades based on current sort field and direction
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    if (sortField === 'tradeDate') {
      const dateA = new Date(a[sortField]).getTime();
      const dateB = new Date(b[sortField]).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortField === 'price' || sortField === 'quantity' || sortField === 'commission' || sortField === 'netAmount') {
      return sortDirection === 'asc'
        ? (a[sortField] as number) - (b[sortField] as number)
        : (b[sortField] as number) - (a[sortField] as number);
    } else {
      const valueA = String(a[sortField]).toLowerCase();
      const valueB = String(b[sortField]).toLowerCase();
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
  });

  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * tradesPerPage,
    currentPage * tradesPerPage
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    try {
      // First delete from the backend
      await Promise.all(
        trades
          .filter(trade => selectedIds.includes(trade.id))
          .map(async trade => {
            await axios.post('http://localhost:8081/api/trades/delete',
              { "id": trade.id },  // Corrected parameter name to match backend
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              }
            );
          })
      );

      // Then update the frontend state
      setTrades(trades.filter(trade => !selectedIds.includes(trade.id)));
      setSelectedIds([]);

    } catch (error) {
      console.error("Error deleting trades:", error);
      // Optionally show error to user
    }
  };

  const refreshTable = () => {
    fetchTrades()
  };

  const startEdit = (trade: Trade) => {
    setEditingId(trade.id);
    setEditFormData(trade); // Store the ENTIRE trade object
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const saveEdit = async (id: number) => {
    if (!editFormData) return;

    try {
      // Optimistically update UI with the FULL trade data
      setTrades(ts => ts.map(t => t.id === id ? editFormData : t));
      setEditingId(null);

      // Send the ENTIRE trade object to backend
      await axios.put(`http://localhost:8081/api/trades/${id}`, editFormData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

    } catch (err) {
      console.error('Failed to save trade', err);
      fetchTrades(); // Re-fetch original data on error
    } finally {
      setEditFormData(null);
    }
  };

  // New function to add a trade
  const addNewTrade = async () => {
    try {
      // Calculate netAmount if not provided
      if (!newTradeData.netAmount && newTradeData.quantity && newTradeData.price) {
        newTradeData.netAmount =
          (newTradeData.action?.toLowerCase() === 'buy' ? -1 : 1) *
          (newTradeData.quantity * newTradeData.price) -
          (newTradeData.commission || 0);
      }
            const newDate = convertToDate(newTradeData.tradeDate, true);
            if (newDate) { 
                  newTradeData.tradeDate = newDate.toISOString().slice(0, 19).replace('Z', '');
            } else {
                  console.warn(`Invalid date value: ${newDate}. Using current date as fallback.`);
                  newTradeData.tradeDate = new Date().toISOString().slice(0, 19);
            }

      const response = await axios.post(
        'http://localhost:8081/api/trades',
        newTradeData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Add the new trade to local state
      setTrades(prev => [...prev, response.data]);

      // Reset form and close it
      setNewTradeData({
        action: 'BUY',
        symbol: '',
        quantity: 0,
        price: 0,
        commission: 0,
        netAmount: 0,
        tradeDate: new Date().toISOString().split('T')[0]
      });
      setShowAddForm(false);

    } catch (err) {
      console.error('Failed to add new trade', err);
    }
  };

  // Handle input change for add form
  const handleAddFormChange = (field: string, value: string | number) => {
    setNewTradeData(prev => ({ ...prev, [field]: value }));
  };

  // Function to handle sorting
  const handleSort = (field: keyof Trade) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it as sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-gray-50 shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Trades</h2>

      {isLoading ? (
        <div className="text-center py-4">
          <p>Loading trades...</p>
        </div>
      ) : trades.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No trades found. Import some trades to get started.</p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200">

          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-lg border border-gray-100 transition-all hover:shadow-xl">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg mr-3 text-lg">📋</span>
                Trade Instructions
              </h2>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="text-sm leading-relaxed">
                In this window you can <strong className="text-blue-700">add a new trade</strong>,{' '}
                <strong className="text-blue-700">edit existing trades</strong>,{' '}
                <strong className="text-blue-700">remove trades</strong>, and{' '}
                <strong className="text-blue-700">export transactions</strong> to Excel/CSV formats.
              </p>

              <p className="text-sm leading-relaxed">
                Filter trades by <span className="text-purple-700 font-medium">Symbol</span>,{' '}
                <span className="text-purple-700 font-medium">Account</span>,{' '}
                <span className="text-purple-700 font-medium">Options</span>, or{' '}
                <span className="text-purple-700 font-medium">Stocks</span> using the advanced filtering system.
              </p>

              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Capacity Note</p>
                <p className="text-sm text-gray-700">
                  Simply Track supports up to <strong className="text-green-700">50,000 trades</strong> with
                  lightning-fast loading and efficient management capabilities.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4 mt-6">
            <h2 className="text-lg font-bold text-gray-800">Trade Table</h2>
            <div className="space-x-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Add Trade
              </button>
              <button
                onClick={deleteSelected}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Delete Selected
              </button>
              <button
                onClick={refreshTable}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div>
              <input
                type="text"
                placeholder="Search by symbol or action..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // reset to first page on new search
                }}
                className="border border-gray-300 rounded-md px-4 py-2 w-full sm:w-64"
              />
            </div>

            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-600">Trades per page:</span>
              <select
                value={tradesPerPage}
                onChange={(e) => {
                  setTradesPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page when changing page size
                }}
                className="border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <table className="min-w-full table-auto text-sm border-collapse">
            <thead className=" bg-blue-100/80 text-blue-800">
              <tr>
          
                <th className="p-2 text-left">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={inputRef} // Needed for indeterminate state
                  onChange={toggleSelectAll}
                  className="cursor-pointer form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                />
              </th>


                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('action')}
                >
                  <div className="flex items-center">
                    Action
                    {sortField === 'action' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('tradeDate')}
                >
                  <div className="flex items-center">
                    Trade Date
                    {sortField === 'tradeDate' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center">
                    Symbol
                    {sortField === 'symbol' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Quantity
                    {sortField === 'quantity' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Price
                    {sortField === 'price' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('commission')}
                >
                  <div className="flex items-center">
                    Commission
                    {sortField === 'commission' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th
                  className="p-2 text-left cursor-pointer hover:bg-blue-200"
                  onClick={() => handleSort('netAmount')}
                >
                  <div className="flex items-center">
                    Cost Basis
                    {sortField === 'netAmount' && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
                <th className="p-2 text-left">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTrades.map((trade) => {
                return (
                  <tr key={trade.id} className="hover:bg-gray-50">

                    {editingId === trade.id ? (
                      <>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(trade.id)}
                            onChange={() => toggleSelect(trade.id)}
                          />
                        </td>
                        <td>
                          <select
                            value={editFormData.action || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, action: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          >
                            <option value="BUY">BUY</option>
                            <option value="SELL">SELL</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="date"
                            value={new Date(editFormData.tradeDate).toISOString().split('T')[0]}
                            onChange={e => setEditFormData(fd => ({ ...fd, tradeDate: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td>
                          <input
                            value={editFormData.symbol || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, symbol: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editFormData.quantity?.toString() || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, quantity: +e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.price?.toString() || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, price: +e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.commission?.toString() || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, commission: +e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.netAmount?.toString() || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, netAmount: +e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 w-full"
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center space-x-1">
                            <button onClick={() => saveEdit(trade.id)} className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-sm">
                              Save
                            </button>
                            <button onClick={() => cancelEdit()} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-sm">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>

                    ) : (
                      <>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(trade.id)}
                            onChange={() => toggleSelect(trade.id)}
                          />
                        </td>
                        <td className="p-2 capitalize">
                          <span className={
                            trade.action.toLowerCase() === 'buy'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }>
                            {trade.action}
                          </span>
                        </td>
                        <td className="p-2">{new Date(trade.tradeDate).toLocaleString()}</td>
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2">{trade.quantity}</td>
                        <td className="p-2">${trade.price.toFixed(2)}</td>
                        <td className="p-2">${trade.commission.toFixed(2)}</td>
                        <td className="p-2">${trade.netAmount.toFixed(2)}</td>
                        <td className="p-2">
                          <button onClick={() => startEdit(trade)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Trade Modal/Popup */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add New Trade</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                  value={newTradeData.action}
                  onChange={(e) => handleAddFormChange('action', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trade Date</label>
                <input
                  type="date"
                  value={newTradeData.tradeDate?.toString()}
                  onChange={(e) => handleAddFormChange('tradeDate', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symbol</label>
                <input
                  type="text"
                  value={newTradeData.symbol}
                  onChange={(e) => handleAddFormChange('symbol', e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                  placeholder="e.g., AAPL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="number"
                  value={newTradeData.quantity}
                  onChange={(e) => handleAddFormChange('quantity', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTradeData.price}
                  onChange={(e) => handleAddFormChange('price', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTradeData.commission}
                  onChange={(e) => handleAddFormChange('commission', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost Basis (Optional - calculated if left empty)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newTradeData.netAmount}
                  onChange={(e) => handleAddFormChange('netAmount', Number(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 w-full"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewTrade}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Trade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageTrades;