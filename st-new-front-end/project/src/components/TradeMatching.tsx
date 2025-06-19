// src/components/TradeMatching.tsx
// This component provides a full-featured interface for managing user stock trades
// including fetching, filtering, sorting, pagination, selection, editing, deleting, and adding trades.

import React, { useRef, useState, useEffect } from 'react';
import axios from 'axios'; // HTTP client for API calls
import { MatchedTrade } from '../types/MatchedTrade';
import { HelpCircle, X, Download, ChevronUp, ChevronDown } from 'lucide-react'; // Icon components
import { convertToDate } from './trades-import/ConvertToDate'; // Utility to parse/convert date strings
import { logger } from './logger';

interface TradeMatchingProps {
  token: string | null;            // JWT or authentication token for API calls
  isAuthenticated: boolean;        // Flag indicating if user is logged in          // Signal to re-fetch trades when toggled
}

const TradeMatching: React.FC<TradeMatchingProps> = ({ token, isAuthenticated }) => {
  // Main state hooks
  const [selectedMethod, setSelectedMethod] = useState("FIFO");
  const [trades, setTrades] = useState<MatchedTrade[]>([]);   
  const [numberOfTrades, setNumberOfTrades] = useState(0);            // Array of all trades fetched
  const [isLoading, setIsLoading] = useState(true);            // Loading flag for initial data fetch
  const [error, setError] = useState('');                      // Error message for fetch failures

  // User interaction state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);  // IDs of trades selected by user (for bulk actions)
  const [editingId, setEditingId] = useState<number | null>(null);// ID of the trade currently in edit mode
  const [editFormData, setEditFormData] = useState<Trade | null>(null);// Holds edited field values

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);            // Current page in pagination
  const [searchTerm, setSearchTerm] = useState('');             // Text filter for symbol/action
  const [tradesPerPage, setTradesPerPage] = useState<number>(10);// Number of rows per page

  // UI state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);// Toggle to show/hide "Add New Trade" form

  // Sorting state
  const [sortField, setSortField] = useState<keyof Trade>('tradeDate'); // Which field to sort on
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc'); // Sort order

  // Avoid delete double click 
  const [isDeleting, setIsDeleting] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

  // State for new trade form
  const [newTradeData, setNewTradeData] = useState<Partial<Trade>>({
    action: 'BUY',
    symbol: '',
    quantity: 0,
    price: 0,
    commission: 0,
    netAmount: 0,
    tradeDate: new Date().toISOString().split('T')[0]
  });

  const [progress, setProgress] = useState(0); // 0 to 100

  // Ref for "select all" checkbox (for indeterminate state)
  const inputRef = useRef<HTMLInputElement>(null);



  /**
   * Filter trades by symbol or action based on searchTerm (case-insensitive)
   */
  const filteredTrades = trades.filter(trade =>
    trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages: number = Math.ceil(filteredTrades.length / tradesPerPage);
  // // Derived state: all trade IDs
  // const allIds = trades.map(trade => trade.id);
  // // Are all rows selected?
  // const isAllSelected = allIds.length > 0 && allIds.every(id => selectedIds.includes(id));
  // // Are some (but not all) rows selected?
  // const isSomeSelected = !isAllSelected && selectedIds.length > 0;


  // Derived state: IDs of the currently filtered trades
  const filteredIds = filteredTrades.map(trade => trade.id);
  // Are all filtered rows selected?
  const isAllSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
  // Are some (but not all) filtered rows selected?
  const isSomeSelected = !isAllSelected && selectedIds.length > 0;



  // Separate useEffect for fetching trades
  /**
 * Effect: Fetch trades when authentication state changes or refreshCount toggles
 */
  useEffect(() => {
    if (isAuthenticated && token) {
      fetchTradeCount();
      logger.debug("fetching trades");
    }
  }, [numberOfTrades,isAuthenticated, token]); // Only runs when refreshCount changes

  /**
   * Effect: Update indeterminate state of "select all" checkbox
   */
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]); // Runs only when selection state changes

  // Separate useEffect for initial auth check (if needed)
  // useEffect(() => {
  //   if (isAuthenticated && token) {
  //     fetchMatchedTrades();
  //   }
  // }, [isAuthenticated, token]); // Optional: fetch on auth changes

  /**
 * Toggle selection of a single row by ID
 */
  // const toggleSelectAll = () => {
  //   if (selectedIds.length === allIds.length) {
  //     setSelectedIds([]);
  //   } else {
  //     setSelectedIds([...allIds]);
  //   }
  // };


  const toggleSelectAll = () => {
    if (selectedIds.length === filteredIds.length) {
      // uncheck all filtered
      setSelectedIds([]);
    } else {
      // check only the filtered ones
      setSelectedIds([...filteredIds]);
    }
  };

    const fetchTradeCount = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:8081/api/trades/tradeCount`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setNumberOfTrades(response.data);
        setCurrentPage(1);
        setError('');
        logger.debug("trades fetched", response.data)
      } catch (err: any) {
        setError('Failed to fetch trade count');
         setNumberOfTrades(0);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    /**
   * Fetch all trades from backend API, update state, handle errors
   */
  const fetchMatchedTrades = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get<Trade[]>(`http://localhost:8081/api/trades/matchedTrades`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTrades(response.data);
      setCurrentPage(1);
      setError('');
      logger.debug("trades fetched", response.data)
    } catch (err: any) {
      setError('Failed to fetch trades');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch all trades from backend API, update state, handle errors
   */
  const handleStartMatching = async () => {
    console.log(`Starting trade matching with method: ${selectedMethod}`);
    try {
      setIsLoading(true);
 
      const response = await axios.post(
        'http://localhost:8081/api/trades/match',
        {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },

        }
      );


      setTrades(response.data);
      setCurrentPage(1);
      setError('');
      logger.debug("trades fetched", response.data)
    } catch (err: any) {
      setError('Failed to fetch trades');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };


  // Sort trades based on current sort field and direction
  /**
 * Sort filtered trades by sortField & sortDirection
 */
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

  // Slice sorted trades for current page
  const paginatedTrades = sortedTrades.slice(
    (currentPage - 1) * tradesPerPage,
    currentPage * tradesPerPage
  );

  /**
    * Toggle selection of a single row by ID
    */
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (isDeleting) return;
    if (selectedIds.length === 0) {
      alert("No trades selected for deletion.");
      return;
    }

    setIsDeleting(true);
    setProgress(0);

    const tradesToDelete = trades.filter(trade => selectedIds.includes(trade.id));

    for (let i = 0; i < tradesToDelete.length; i++) {
      const trade = tradesToDelete[i];

      await axios.post(
        'http://localhost:8081/api/trades/delete',
        { id: trade.id },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const percentage = Math.round(((i + 1) / tradesToDelete.length) * 100);
      setProgress(percentage);
    }
    setIsDeleting(false);
    setSearchTerm('');
    setCurrentPage(1);
    setProgress(0);
    // Optionally refresh trade data here
    await fetchMatchedTrades();
  };



  // Handler to refresh the table manually
  const refreshTable = () => {
    fetchMatchedTrades()
  };
  /**
    * Enter edit mode for a specific trade row
    */
  const startEdit = (trade: Trade) => {
    setEditingId(trade.id);
    setEditFormData(trade); // Store the ENTIRE trade object
  };
  /**
   * Cancel edit mode, revert form data
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };
  /**
   * Save edited trade: optimistic UI update then backend PUT
   */
  const saveEdit = async (id: number) => {
    if (!editFormData) return;

    try {
      // Optimistically update UI with the FULL trade data
      const dateObj = new Date(editFormData.tradeDate);
      // editFormData.tradeDate = dateObj.toISOString().slice(0, 19).replace('T', ' ').replace('Z', '');
      editFormData.tradeDate = dateObj.toISOString().slice(0, 19).replace('Z', '');
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
      fetchMatchedTrades(); // Re-fetch original data on error
    } finally {
      setEditFormData(null);
    }
  };

  /**
   * Add a new trade: prepare data, call API, update UI
   */
  const addNewTrade = async () => {
    try {
      // Calculate netAmount if not provided
      if (!newTradeData.netAmount && newTradeData.quantity && newTradeData.price) {
        newTradeData.netAmount =
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

  /**
   * Handle input changes in "Add New Trade" form
   */
  const handleAddFormChange = (field: string, value: string | number) => {
    setNewTradeData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Handle click on table headers to sort by that column
   */
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

  const exportToCSV = () => {
    const headers = ['Action', 'Trade Date', 'Symbol', 'Type', 'Quantity', 'Price', 'Commission', 'Cost Basis'];
    const rows = filteredTrades.map((trade) => [
      trade.action,
      trade.tradeDate,
      trade.symbol,
      trade.trade_type,
      trade.quantity,
      trade.price,
      trade.commission,
      trade.netAmount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'trades.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="bg-gray-50 shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Trade Matching</h2>

      { numberOfTrades === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No trades found. Import some trades to get started.</p>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200">

          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-3xl shadow-lg border border-gray-100 transition-all hover:shadow-xl">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg mr-3 text-lg">🧮</span>
                Trade Matching
              </h2>
            </div>
         <div className="space-y-4 text-gray-700 leading-relaxed">
      <p>
        <strong>Trade Matching Window</strong>
      </p>
      <p>
        In this window, you will perform trade matching. <strong>Simply Track</strong> automatically checks every sell/short-covered trade against its corresponding buy/short trade and calculates the profit or loss for each matched pair.
      </p>

      {/* Toggle Header */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="font-semibold text-left text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-300 rounded-lg"
      >
        {showDetails ? "▼ Trade Matching Methods" : "▶ Trade Matching Methods"}
      </button>

      {/* Collapsible Section */}
      {showDetails && (
        <>
          <div className="font-semibold text-gray-800 mt-2">Key Features</div>
          <ul className="list-disc ml-6">
            <li>
              <strong>✔ Wash Sale Detection</strong> – Simply Track identifies wash sales during matching.{" "}
              <a href="#" className="text-blue-600 underline">Learn more about wash sales here</a>.
            </li>
            <li>
              <strong>✔ Error Detection</strong> – The system flags issues, such as sell trades without corresponding buy trades.
            </li>
            <li>
              <strong>✔ Tax Optimization Insights</strong> – After matching, Simply Track suggests tax-efficient strategies by highlighting stocks that could provide tax benefits (e.g., avoiding wash sales).
            </li>
          </ul>

          <p className="mt-4">
            Once matching is complete, you can:{" "}
            <strong>Review updated trades, Run various reports and Optimize tax strategies</strong>
          </p>
        </>
      )}
          <div>
            <label htmlFor="matchingMethod" className="block mb-1 font-medium text-gray-700">Select Method:</label>
            <select
              id="matchingMethod"
              className="w-full sm:w-1/2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
            >
              <option value="FIFO">First In, First Out (FIFO) - Recommended</option>
              <option value="LIFO">Last In, First Out (LIFO)</option>
            </select>
          </div>

          <div className="pt-6">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
              onClick={handleStartMatching}
            >
              Start Matching
            </button>
          </div>

    </div>
          </div>



          <div className="flex justify-between items-center mb-4 mt-6">
            <h2 className="text-lg font-bold text-gray-800">Trade Table</h2>
            {isDeleting && (
              <div className="w-1/2 bg-gray-200 rounded h-3">
                <div
                  className="bg-blue-500 h-3 rounded"
                  style={{ width: `${progress}%`, transition: 'width 0.3s ease-in-out' }}
                ></div>
              </div>
            )}
            <div className="space-x-2">

              <button
                onClick={exportToCSV}
                className="p-3  rounded hover:bg-blue-100 text-blue-600 transition relative group"
              >
                <Download size={18} />
                <span className="absolute left-full ml-2 whitespace-nowrap text-xs text-gray-700 bg-white px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition duration-200 z-10">
                  Export your trades
                </span>
              </button>

              <button
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Add Trade
              </button>

              <button
                onClick={deleteSelected}
                disabled={isDeleting}
                className={`px-3 py-1 rounded text-sm text-white ${isDeleting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {isDeleting ? 'Deleting...' : 'Delete Selected'}
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
            <div className="flex ">
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
            <div className="flex items-center" >
              <p className="text-sm  font-bold  text-blue-600 text-ellipsis mt-1">
                Total trades: {filteredTrades.length}
              </p>
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
            <thead className=" bg-blue-100 text-blue-800">
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
                  onClick={() => handleSort('trade_type')}
                >
                  <div className="flex items-center">
                    Type
                    {sortField === 'trade_type' && (
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
                            value={editFormData.trade_type || ''}
                            onChange={e => setEditFormData(fd => ({ ...fd, trade_type: e.target.value }))}
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
                        {/* <td className="p-2">{new Date(trade.tradeDate).toLocaleString()}</td> */}
                        <td className="p-2">{new Date(trade.tradeDate).toISOString().split('T')[0]}</td>
                        {(trade.trade_type === 'OPTION') ? <td className="p-2 font-medium">{trade.usymbol}</td> : <td className="p-2 font-medium">{trade.symbol}</td>}
                        <td className="p-2 font-medium">{trade.trade_type}</td>
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

export default TradeMatching;