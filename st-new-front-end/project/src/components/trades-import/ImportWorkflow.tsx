

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Check, Copy, AlertTriangle } from 'lucide-react';
import { Trade } from '../../types'; // Assuming you have a types file
import FileUploadStep from './FileUploadStep';
import DataPreview from './DataPreview';
import ColumnMappingStep from './ColumnMappingStep';
import { convertToDate } from './ConvertToDate';
import { fixTradeAction } from './fixTradeAction';

// Define the possible trade action types
enum TradeAction {
    BUY = "BUY",
    SELL = "SELL",
    BUYTOCOVER = "BUYTOCOVER",
    SELLSHORT = "SELLSHORT",
    INVALID = "INVALID"
}

interface ImportWorkflowProps {
    token: string | null;
    onComplete: (result: {
        successCount: number;
        errorCount: number;
        errors: Array<{ row: number; message: string }>;
    }) => void;
    onSwitchToManage: () => void;
}

export const ImportWorkflow = ({ token, onComplete, onSwitchToManage }: ImportWorkflowProps) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [fileData, setFileData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [parsedTrades, setParsedTrades] = useState<Omit<Trade, 'id'>[]>([]);
    const [uploadSuccess, setUploadSuccess] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const [mappings, setMappings] = useState<Record<keyof Trade, string>>({
        action: '',
        tradeDate: '',
        symbol: '',
        quantity: '',
        price: '',
        commission: '',
        netAmount: ''
    });
    const [jsonOutput, setJsonOutput] = useState<string>('');

    const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);
    const steps = ['Upload File', 'Map Columns', 'Preview Data', 'Import & Review'];

    /**
     * Trims string values in a data array
     * @param data The data array to process
     * @returns A new array with trimmed string values
     */
    const trimDataValues = (data: any[][]) => {
        return data.map(row => {
            if (!Array.isArray(row)) return row;

            return row.map(cell => {
                // Only trim string values
                if (typeof cell === 'string') {
                    return cell.trim();
                }
                return cell;
            });
        });
    };

    const handleFileUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // Parse data with dates as Date objects
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: null,
                blankrows: true,
                raw: false,
                cellDates: true, // Convert Excel dates to Date objects
            });

            // console.log('json data', jsonData)
            // Convert Date objects to formatted strings (MM/DD/YYYY)
            const processedData = jsonData.map(row =>
                row.map(cell => {
                    if (cell instanceof Date) {
                        const month = String(cell.getMonth() + 1).padStart(2, '0');
                        const day = String(cell.getDate()).padStart(2, '0');
                        const year = cell.getFullYear();
                        return `${month}/${day}/${year}`;
                    }
                    return cell;
                })
            );
            // console.log('processed data', processedData)

            // Trim all string values
            const trimmedData = trimDataValues(processedData as any[][]);

            // Rest of your processing logic remains the same
            if (trimmedData.length === 0) {
                setErrors([{ row: 0, message: 'File is empty' }]);
                return;
            }

            // console.log('trimmedData data', processedData)

            let headerRowIndex = 0;
            for (let i = 0; i < trimmedData.length; i++) {
                const row = trimmedData[i] as any[];
                if (row && row.some(cell => cell !== null && cell !== '')) {
                    headerRowIndex = i;
                    break;
                }
            }

            const headerRow = trimmedData[headerRowIndex] as string[];
            const trimmedHeaders = headerRow.map(header =>
                typeof header === 'string' ? header.trim() : header
            );

            // console.log('headerRow data', headerRow)

            const dataRows = trimmedData.slice(headerRowIndex + 1).filter(row => {
                const typedRow = row as any[];
                return typedRow && typedRow.some(cell => cell !== null && cell !== '');
            });
            // console.log('dataRows data', dataRows)
            setColumns(trimmedHeaders);
            setFileData(dataRows);
            setCurrentStep(1);
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const validateAndTransform = () => {
        const newErrors: Array<{ row: number; message: string }> = [];
        const requiredFields = ['action', 'tradeDate', 'symbol', 'quantity'] as Array<keyof Trade>;
        const numericFields = ['quantity', 'price', 'commission', 'netAmount'] as Array<keyof Trade>;

        // First create the transformed array
        const transformed = fileData.map((row, index) => {
            const trade: Partial<Trade> = {};
            let hasError = false;

            // console.log('validating row:', row);
            // console.log('using mappings:', mappings);

            try {
                // First pass: Extract all mapped values
                Object.entries(mappings).forEach(([key, column]) => {
                    if (!column) return; // Skip unmapped columns (will check required fields later)

                    const colIndex = columns.indexOf(column);
                    if (colIndex === -1) {
                        throw new Error(`Column ${column} not found in headers`);
                    }

                    const value = row[colIndex];
                    const fieldKey = key as keyof Trade;

                    // Only process non-empty values
                    if (value !== undefined && value !== null && value !== '') {
                        // Special handling for action field
                        if (fieldKey === 'action') {
                            trade[fieldKey] = fixTradeAction(value.toString());
                        }
                        // Handle numeric fields
                        else if (numericFields.includes(fieldKey)) {
                            const numValue = parseFloat(value.toString().replace(/,/g, ''));
                            if (isNaN(numValue)) {
                                throw new Error(`Invalid numeric value for ${key}: ${value}`);
                            }
                            trade[fieldKey] = numValue;
                        }
                        // Handle date fields - ensure we use the updated format for LocalDateTime
                        else if (fieldKey === 'tradeDate') {
                            try {
                                // Use the updated parseDate function that returns ISO format with time
                                trade[fieldKey] = parseDate(value.toString());
                            } catch (e) {
                                throw new Error(`Invalid date format for tradeDate: ${value}`);
                            }
                        }
                        // Handle all other fields
                        else {
                            trade[fieldKey] = value.toString();
                        }
                    }
                });

                // Second pass: Check required fields
                for (const field of requiredFields) {
                    if (trade[field] === undefined) {
                        const mappedColumn = mappings[field];
                        if (!mappedColumn) {
                            throw new Error(`Required field ${field} is not mapped to any column`);
                        } else {
                            throw new Error(`Missing value for required field ${field} in column ${mappedColumn}`);
                        }
                    }
                }

                // Special validation: Set defaults for nullable numeric fields
                // This ensures we don't send null values for price or commission
                if (trade.price === undefined) {
                    trade.price = 0;
                }

                if (trade.commission === undefined) {
                    trade.commission = 0;
                }

                // If netAmount is not provided, calculate it
                // This is optional since your backend does this calculation too
                if (trade.netAmount === undefined && trade.price !== undefined && trade.quantity !== undefined) {
                    trade.netAmount = Number(trade.price) * Number(trade.quantity) - (trade.commission || 0);
                }

            } catch (error) {
                console.log("Validation error:", (error as Error).message);
                newErrors.push({ row: index + 1, message: (error as Error).message });
                hasError = true;
            }

            return hasError ? null : trade as Trade;
        }).filter(Boolean); // Filter out null entries

        // Set errors and filtered valid data
        setErrors(newErrors);
        setJsonOutput(JSON.stringify(transformed, null, 2));
        console.log('Valid trades:', transformed);
        return transformed;
    };

    // Updated parseDate function to return ISO 8601 format with time component
    const parseDate = (dateStr: string): string => {
        // Handle common date formats
        const cleaned = dateStr.trim();

        // Try to parse with Date object first
        let date = new Date(cleaned);

        // If invalid, try other formats
        if (isNaN(date.getTime())) {
            // Handle MM/DD/YY format
            const match = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/.exec(cleaned);
            if (match) {
                // Assuming 21st century for 2-digit years
                const year = 2000 + parseInt(match[3], 10);
                const month = parseInt(match[1], 10) - 1; // JS months are 0-indexed
                const day = parseInt(match[2], 10);
                date = new Date(year, month, day);
            }
        }

        if (isNaN(date.getTime())) {
            throw new Error(`Cannot parse date: ${dateStr}`);
        }

        // Return in ISO 8601 format with time component for Java's LocalDateTime
        // Format: YYYY-MM-DDT00:00:00
        return date.toISOString().split('.')[0]; // Remove milliseconds
    };


    // const toPostgresDateString = (value: unknown): string => {
    //     // Handle null/undefined
    //     if (value === null || value === undefined) {
    //         return new Date().toISOString().slice(0, 19);
    //     }

    //     let date: Date;

    //     if (value instanceof Date) {
    //         date = value;
    //     } else if (typeof value === 'string') {
    //         // Try different date formats
    //         const trimmedValue = value.trim();

    //         // ISO format with time (2023-08-18T10:15:00 or 2023-08-18T10:15:00Z)
    //         if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z)?$/.test(trimmedValue)) {
    //             date = new Date(trimmedValue.endsWith('Z') ? trimmedValue : trimmedValue + 'Z');
    //         }
    //         // ISO format without time (2023-08-18)
    //         else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
    //             date = new Date(trimmedValue + 'T00:00:00Z');
    //         }
    //         // Excel serial date number (e.g., 44197)
    //         else if (/^\d+$/.test(trimmedValue)) {
    //             // Excel date serial number (days since 1900-01-01)
    //             const excelDate = parseInt(trimmedValue, 10);
    //             date = new Date((excelDate - 25569) * 86400 * 1000); // Convert to JS timestamp
    //         }
    //         // Fallback for other string formats
    //         else {
    //             date = new Date(trimmedValue);
    //         }
    //     } else if (typeof value === 'number') {
    //         // Handle numeric timestamps
    //         date = new Date(value);
    //     } else {
    //         // Fallback for other types
    //         date = new Date();
    //     }

    //     // Validate the date
    //     if (isNaN(date.getTime())) {
    //         console.warn(`Invalid date value: ${value}. Using current date as fallback.`);
    //         return new Date().toISOString().slice(0, 19);
    //     }
    //     console.log('date in toPostgresDateString:', date);
    //     // Return in consistent ISO format without milliseconds
    //     return date.toISOString().slice(0, 19).replace('Z', '');
    // };


    // function parseDate(excelDateStr: string): string | null {
    //     const date = convertToDate(excelDateStr, true); // Enable debug logging
    //     console.log('parsed date1:', date);
    //     if (date) {
    //         return toPostgresDateString(date);
    //     }
    //     return null;
    // }

 
    const handleSubmitTrades = async () => {
        // Check if we have trades to submit
        if (parsedTrades.length === 0) {
            setError('No valid trades to import');
            return;
        }

        console.log('Submitting trades:', parsedTrades);

        try {
            setIsUploading(true);
            setError('');

            // Make API call to submit trades
            const response = await axios.post('http://localhost:8081/api/trades/batch', parsedTrades, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Success case
            const result = {
                successCount: parsedTrades.length,
                errorCount: 0,
                errors: []
            };

            setUploadSuccess('Trades uploaded successfully!');

            // Pass results to parent
            onComplete(result);

        } catch (err: any) {
            // Handle API errors
            let errorMessage = 'Failed to upload trades. Please try again.';
            let errorResult = {
                successCount: 0,
                errorCount: parsedTrades.length,
                errors: parsedTrades.map((_, index) => ({
                    row: index + 1,
                    message: 'Server error occurred'
                }))
            };

            // If the API returns specific validation errors, use those
            if (err.response?.data?.errors) {
                errorResult.errors = err.response.data.errors;
                errorMessage = 'Some trades failed validation. Please check the errors below.';
            } else if (err.response?.data?.message) {
                // If there's a general message from the server
                errorMessage = err.response.data.message;
            }

            setError(errorMessage);
            onComplete(errorResult);

        } finally {
            setIsUploading(false);
        }
    };
  

    // Update handleNext function
    const handleNext = () => {
        if (currentStep === 1) {
            const validData = validateAndTransform();
            if (errors.length > 0) {
                console.log("There errors , I am returning ")
                return;
            }
            // console.log("There are no errors , I am setParsedTrades ")
            setParsedTrades(validData as Omit<Trade, 'id'>[]);
            setCurrentStep(2);
            return;
        }

        if (currentStep === 2) {
            setCurrentStep(3);
            handleSubmitTrades();
            return;
        }

        if (currentStep === 3) {
            setCurrentStep(4);
        }
    };


    const handleBack = () => {
        if (currentStep === 3) {
            // If we're on the final review step, go back to preview
            setCurrentStep(2);
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Trade Import Workflow</h1>

                {/* Progress Steps */}
                <div className="flex justify-between mb-12 relative">
                    {steps.map((step, index) => (
                        <div key={step} className="step-indicator flex-1">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 
                    ${index < currentStep ? 'bg-green-500 text-white' :
                                        index === currentStep ? 'bg-blue-500 text-white' :
                                            'bg-gray-200 text-gray-500'}`}>
                                    {index < currentStep ? <Check size={20} /> : index + 1}
                                </div>
                                <span className={`text-sm font-medium ${index <= currentStep ? 'text-gray-700' : 'text-gray-500'
                                    }`}>
                                    {step}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                {currentStep === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <FileUploadStep onFileUpload={handleFileUpload} onNext={handleNext} />
                    </div>
                )}

                {currentStep === 1 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <ColumnMappingStep
                            columns={columns}
                            mappings={mappings}
                            onMappingChange={setMappings}
                            onBack={handleBack}
                            onNext={handleNext}
                        />
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        {
                            parsedTrades.length > 0 && (
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <DataPreview data={parsedTrades} />
                                </div>
                            )}
                        <div className="flex justify-between mt-8">
                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    <ChevronLeft size={16} className="inline mr-2" /> Back
                                </button>

                            </div>
                            <div className="flex justify-between mt-8">
                                <button
                                    onClick={handleNext}
                                    className={`px-4 py-2 ${isUploading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                                        } text-white rounded-md`}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>Processing... <span className="animate-pulse">⋯</span></>
                                    ) : (
                                        'Complete Import'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {currentStep === 3 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center text-red-600 mb-1">
                                    <AlertTriangle size={16} className="mr-2" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {uploadSuccess && (
                            <div className="mb-6">
                                <div className="flex items-center text-green-600 mb-2">
                                    <Check size={20} className="mr-2" />
                                    <h3 className="text-lg font-semibold">{uploadSuccess}</h3>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm">
                                        Successful imports: {parsedTrades.length }
                                    </p>
                                    {errors.length > 0 && (
                                        <>
                                            <p className="text-sm text-red-600">
                                            Errors occurred in {errors.length} lines. The following lines are rejected. 
                                            </p>
                                            <div className="text-sm bg-red-50 p-3 rounded-md">
                                                {errors.map((error, index) => (
                                                    <div key={index} className="flex items-start">
                                                        <span className="mr-2">•</span>
                                                        <span>Row {error.row}: {error.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <button
                                onClick={handleBack}  // Changed from resetting to step 0
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <ChevronLeft size={16} className="inline mr-2" /> Back
                            </button>
                            <div className="flex gap-4">
                                <button
                                    onClick={onSwitchToManage}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                                >
                                    Manage Trades
                                </button>

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};