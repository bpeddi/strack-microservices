import React from 'react';
import { Trade } from '../../types/indexold'; // Assuming you have a types file

interface DataPreviewProps {
    data: Omit<Trade, 'id'>[];
}

const DataPreview: React.FC<DataPreviewProps> = ({ data }) => {
    // Show only the first 10 rows
    const previewData = data.slice(0, 10);

    // If no data, show a message
    if (!previewData.length) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Preview</h2>
                <p className="text-gray-500">No valid data to preview.</p>
            </div>
        );
    }

    // Get all keys from the first object to use as columns
    const columns = Object.keys(previewData[0]) as Array<keyof Omit<Trade, 'id'>>;

    // Format the cell values for display
    const formatValue = (value: any, column: string) => {
        if (value === undefined || value === null) return '-';

        // Format numbers
        if (column === 'price' || column === 'commission' || column === 'netAmount') {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2
            }).format(value);
        }

        // Format dates
        if (column === 'tradeDate') {
            if (typeof value === 'string') {
                // Handle ISO date strings
                try {
                    const date = new Date(value);
                    return date.toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    });
                } catch (e) {
                    return value;
                }
            }
            return value;
        }

        // // Format dates
        // if (column === 'tradeDate') {
        //   if (typeof value === 'string' && value.includes('T')) {
        //     // Handle ISO date strings
        //     return new Date(value).toLocaleDateString();
        //   }
        //   return value;
        // }

        // Format quantity with sign
        if (column === 'quantity') {
            return value.toLocaleString();
        }

        return value.toString();
    };

    // Readable column headers
    const getColumnHeader = (column: string) => {
        const headers: Record<string, string> = {
            tradeDate: 'Trade Date',
            action: 'Action',
            symbol: 'Symbol',
            quantity: 'Quantity',
            price: 'Price',
            commission: 'Commission',
            netAmount: 'Net Amount'
        };

        return headers[column] || column;
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Preview</h2>
            <p className="text-sm text-gray-500 mb-2">Showing the first {previewData.length} of {data.length} records</p>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.toString()}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {getColumnHeader(column.toString())}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {previewData.map((trade, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                {columns.map((column) => (
                                    <td
                                        key={`${rowIndex}-${column.toString()}`}
                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                    >
                                        {formatValue(trade[column], column.toString())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataPreview;