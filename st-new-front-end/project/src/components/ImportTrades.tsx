// src/components/ImportTrades.tsx
import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { Trade } from '../types';
// import { useAuth } from '../context/AuthContext';

interface ImportTradesProps {
    onUploadSuccess: () => void;
    token: string | null;
}

const ImportTrades: React.FC<ImportTradesProps> = ({ onUploadSuccess, token }) => {
    // const { user, isAuthenticated, token } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [parsedTrades, setParsedTrades] = useState<Omit<Trade, 'id'>[]>([]);
    const [AllTrades, setAllTrades] = useState<Omit<Trade, 'id'>[]>([]);

    // Keep all the parseCSV, parseExcel, parseDate, formatTrades functions 
    // exactly as they were in the original code
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

            if (fileExtension === 'csv') {
                parseCSV(selectedFile);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                parseExcel(selectedFile);
            } else {
                setError('Unsupported file format. Please upload a CSV or Excel file.');
                setFile(null);
            }
        }
    };
    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                if (Array.isArray(results.data)) {
                    const formattedTrades = formatTrades(results.data as Record<string, any>[]);
                    setParsedTrades(formattedTrades);
                }
            },
            error: (error) => {
                setError(`Error parsing CSV: ${error.message}`);
            }
        });
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            if (!data) {
                setError('Failed to read file.');
                return;
            }

            try {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);
                const formattedTrades = formatTrades(jsonData);
                setParsedTrades(formattedTrades);
            } catch (err: any) {
                console.error('Error parsing Excel:', err);
                setError('Failed to parse Excel file. Please check the format.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const parseDate = (value: unknown): string => {
        // Handle null/undefined
        if (value === null || value === undefined) {
            return new Date().toISOString().slice(0, 19);
        }

        let date: Date;

        if (value instanceof Date) {
            date = value;
        } else if (typeof value === 'string') {
            // Try different date formats
            const trimmedValue = value.trim();

            // ISO format with time (2023-08-18T10:15:00 or 2023-08-18T10:15:00Z)
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z)?$/.test(trimmedValue)) {
                date = new Date(trimmedValue.endsWith('Z') ? trimmedValue : trimmedValue + 'Z');
            }
            // ISO format without time (2023-08-18)
            else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
                date = new Date(trimmedValue + 'T00:00:00Z');
            }
            // Excel serial date number (e.g., 44197)
            else if (/^\d+$/.test(trimmedValue)) {
                // Excel date serial number (days since 1900-01-01)
                const excelDate = parseInt(trimmedValue, 10);
                date = new Date((excelDate - 25569) * 86400 * 1000); // Convert to JS timestamp
            }
            // Fallback for other string formats
            else {
                date = new Date(trimmedValue);
            }
        } else if (typeof value === 'number') {
            // Handle numeric timestamps
            date = new Date(value);
        } else {
            // Fallback for other types
            date = new Date();
        }

        // Validate the date
        if (isNaN(date.getTime())) {
            console.warn(`Invalid date value: ${value}. Using current date as fallback.`);
            return new Date().toISOString().slice(0, 19);
        }

        // Return in consistent ISO format without milliseconds
        return date.toISOString().slice(0, 19).replace('Z', '');
    };


    const formatTrades = (data: Array<Omit<Trade, 'id'>>): Array<Omit<Trade, 'id'>> =>
        data.map((item) => {
            const normalizedItem: Record<string, unknown> = {};

            // Normalize keys
            Object.keys(item).forEach(key => {
                const lowerKey = key.toLowerCase().trim();
                normalizedItem[lowerKey] = item[key as keyof typeof item];
            });
            // Return trade object without id
            return {
                action: String(normalizedItem.action || normalizedItem.type || '').toLowerCase(),
                tradeDate: parseDate(normalizedItem.tradedate || normalizedItem.date),
                symbol: String(normalizedItem.symbol || normalizedItem.ticker || '').toUpperCase(),
                quantity: Number(normalizedItem.quantity || normalizedItem.shares || 0),
                price: Number(normalizedItem.price || 0),
                commission: Number(normalizedItem.commission || normalizedItem.fee || 0),
                netAmount: Number(normalizedItem.netamount || 0)
            };

        });

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || parsedTrades.length === 0) {
            setError('Please select a valid file with trade data.');
            return;
        }

        try {
            setIsUploading(true);
            setError('');

            // Simulated API response with errors
            const response = await axios.post('http://localhost:8081/api/trades/batch', parsedTrades, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // If your backend returns actual validation errors, use those instead
            const result = {
                successCount: parsedTrades.length,
                errorCount: 0,
                errors: []
            };

            setUploadSuccess('Trades uploaded successfully!');
            setFile(null);
            setParsedTrades([]);

            // Pass results to parent
            onUploadSuccess(result);

        } catch (err: any) {
            const errorResult = {
                successCount: 0,
                errorCount: parsedTrades.length,
                errors: parsedTrades.map((_, index) => ({
                    row: index + 1,
                    message: 'Invalid trade format'
                }))
            };

            onUploadSuccess(errorResult);
            setError('Failed to upload some trades. Please check errors below.');

        } finally {
            setIsUploading(false);
        }
    };



    return (
        <div className="bg-blue-50 shadow-sm rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">Import Trades</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {uploadSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
                    {uploadSuccess}
                </div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Excel or CSV File with Trades
                    </label>
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-100 file:text-blue-700
                hover:file:bg-blue-200"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        File should include columns: action (buy/sell), tradeDate, symbol, quantity, price, commission
                    </p>
                </div>

                {parsedTrades.length > 0 && (
                    <div className="text-sm text-gray-600">
                        Successfully parsed {parsedTrades.length} trades from file. Ready to upload.
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={isUploading || !file || parsedTrades.length === 0}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 disabled:bg-blue-200"
                    >
                        {isUploading ? 'Uploading...' : 'Upload Trades'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ImportTrades;