

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Check, Copy, AlertTriangle } from 'lucide-react';
import { Trade } from '../../types/Trade'; // Assuming you have a types file
import FileUploadStep from './FileUploadStep';
import DataPreview from './DataPreview';
import ColumnMappingStep from './ColumnMappingStep';
import { convertToDate } from './ConvertToDate';
import { fixTradeAction } from './fixTradeAction';
import { IsThisOptionTrade } from './parseOptionSymbol';
import { parseOptionSymbol } from './parseOptionSymbol';
import { logger } from '../logger';

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
    const [saveprogress, setSaveprogress] = useState(0); // 0 to 100
    const [isIndeterminate, setIsIndeterminate] = useState(false); // fallback animation
    const [portname, setPortname] = useState('');
    // const [error, setError] = useState('');

    const [mappings, setMappings] = useState<Record<keyof Trade, string>>({
        action: '',
        tradeDate: '',
        symbol: '',
        quantity: '',
        price: '',
        commission: '',
        netAmount: '',
        fee: '',
    });
    const [jsonOutput, setJsonOutput] = useState<string>('');

    const [errors, setErrors] = useState<Array<{ row: number; message: string }>>([]);

    const [uploadResult, setUploadResult] = useState<{
        successCount: number;
        errorCount: number;
        errors: Array<{ row: number; message: string }>;
    } | null>(null);

    const [refreshCount, setRefreshCount] = useState(0);

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

    const handlePortNameUpdate = (name:string) => {
        console.log("I am setting portname in Parent = ", name)
        setPortname(name); // Update Component1's state
      };

    const handleFileUpload = useCallback((file: File) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                // Check if workbook has sheets
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('No sheets found in the Excel file.');
                }

                const worksheet = workbook.Sheets[workbook.SheetNames[0]];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    header: 1,
                    defval: null,
                    blankrows: true,
                    raw: false,
                    cellDates: true,
                });

                const trimmedData = trimDataValues(jsonData as any[][]);

                if (trimmedData.length === 0) {
                    setErrors([{ row: 0, message: 'File is empty' }]);
                    return;
                }
                let headerRowIndex = -1;
                for (let i = 0; i < trimmedData.length; i++) {
                    const row = trimmedData[i] as any[];
                    const nonBlankCount = row.reduce((cnt, cell) => {
                      return cnt + ((cell !== null && cell !== '') ? 1 : 0);
                    }, 0);
                    if (nonBlankCount >= 5) {
                      headerRowIndex = i;
                      break;
                    }
                  }
                  if (headerRowIndex < 0) {
                    throw new Error('Could not locate a header row with at least 5 columns.');
                  }

                // let headerRowIndex = 0;

                // for (let i = 0; i < trimmedData.length; i++) {
                //     const row = trimmedData[i] as any[];
                //     if (row && row.some(cell => cell !== null && cell !== '')) {
                //         headerRowIndex = i;
                //         break;
                //     }
                // }

                const trimmedHeaders = (trimmedData[headerRowIndex] as any[]).map(h => h?.toString().trim() ?? '');
                // const trimmedHeaders = headerRow.map(header =>
                //     typeof header === 'string' ? header.trim() : header
                // );

                const dataRows = trimmedData.slice(headerRowIndex + 1).filter(row => {
                    const typedRow = row as any[];
                    return typedRow && typedRow.some(cell => cell !== null && cell !== '');
                });

                trimmedHeaders.push("Ignore");

                setColumns(trimmedHeaders);
                setFileData(dataRows);
                setCurrentStep(1);
                logger.debug("dataRows = ", dataRows)
                logger.debug("trimmedHeaders = ", trimmedHeaders)
            } catch (error: any) {
                console.error('Error parsing file:', error);
                setErrors([{ row: 0, message: 'Invalid file format. Please upload a valid Excel or CSV file.' }]);
            }
        };

        reader.readAsArrayBuffer(file);
    }, []);


    const validateAndTransform = (): Trade[] => {
        const newErrors: Array<{ row: number; message: string }> = [];
        const requiredFields = ['action', 'tradeDate', 'symbol', 'quantity'] as Array<keyof Trade>;
        const numericFields = ['quantity', 'price', 'commission', 'fee', 'netAmount'] as Array<keyof Trade>;

        const transformed = fileData.map((row, index) => {
            const trade: Partial<Trade> = {};
            let hasError = false;

            try {
                // Map & parse each column
                for (const [rawKey, column] of Object.entries(mappings) as [keyof Trade, string][]) {
                    if (!column) continue;
                    const colIndex = columns.indexOf(column);
                    if (colIndex === -1) throw new Error(`Column \"${column}\" not found.`);

                    const rawValue = row[colIndex];
                    if (rawValue == null || rawValue === '') continue;
                    const str = rawValue.toString().trim();

                    switch (rawKey) {
                        case 'action':
                            trade.action = fixTradeAction(str);
                            break;

                        case 'symbol':
                            // parse symbol and set trade_type
                            try {
                                if (str.length < 6) {
                                    trade.symbol = str;
                                    trade.trade_type = 'STOCK';
                                } else {
                                    const optSymbol = str.replace(/^[^A-Za-z]*/, '').toUpperCase();
                                    const optionDetails = parseOptionSymbol(optSymbol);
                                    trade.symbol = optionDetails.usymbol;
                                    // trade.optionDetails = optionDetails;
                                    trade.trade_type = 'OPTION';
                                    trade.usymbol = optSymbol;
                                    trade.expirationDate = convertToDate(optionDetails.expirationDate, false)
                                        .toISOString().slice(0, 19).replace('Z', '');
                                    trade.optionType = optionDetails.optionType;
                                }
                            } catch (err) {
                                throw new Error(`Invalid symbol for ${rawKey}: ${str} : ${(err as Error).message}`);
                            }
                            break;

                        case 'tradeDate':
                            { const parsedDate = convertToDate(str, false);
                            if (!parsedDate) throw new Error(`Invalid date for tradeDate: ${str}`);
                            trade.tradeDate = parsedDate.toISOString().slice(0, 19).replace('Z', '');
                            break; }

                        default:
                            // numeric or direct mapping
                            if (numericFields.includes(rawKey)) {
                                let num = parseFloat(str.replace(/,/g, ''));
                                if (isNaN(num)) throw new Error(`Invalid number for ${rawKey}: ${str}`);
                                // Convert negatives to positives
                                num = Math.abs(num);
                                trade[rawKey] = num;
                            } else {
                                trade[rawKey] = str;
                            }
                    }
                }

                // Required fields check
                for (const field of requiredFields) {
                    if (trade[field] === undefined) {
                        const col = mappings[field];
                        throw new Error(`Missing required field \"${field}\"${col ? ` mapped from \"${col}\"` : ''}.`);
                    }
                }

                // Defaults
                trade.price = trade.price ?? 0;
                trade.commission = trade.commission ?? 0;
                trade.fee = trade.fee ?? 0;

                // Option multiplier
                const multiplier = trade.trade_type === 'OPTION' ? 100 : 1;
                trade.quantity = (trade.quantity ?? 0) * multiplier;

                // Recalculate commission & fee if netAmount provided
                if (trade.netAmount !== undefined) {
                    const calcCommission = trade.netAmount - (trade.quantity! * trade.price!);
                    trade.commission = calcCommission;
                    trade.fee = 0;
                } else {
                    // Calculate netAmount if missing
                    trade.netAmount = (trade.quantity! * trade.price!) - (trade.commission! + trade.fee!);
                }

                trade.portfolioName = portname;

            } catch (err) {
                newErrors.push({ row: index + 1, message: (err as Error).message });
                hasError = true;
            }

            return hasError ? null : (trade as Trade);
        }).filter(Boolean) as Trade[];

        setErrors(newErrors);
        setJsonOutput(JSON.stringify(transformed, null, 2));
        logger.debug('Transformed trades:', transformed);
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

    const handleSubmitTrades = async () => {
        // Check if we have trades to submit

        if (parsedTrades.length === 0) {
            setErrors([{ row: 0, message: 'No valid trades to import' }]);
            return;
        }

        logger.debug('Submitting trades:', parsedTrades);
        setSaveprogress(0)
        try {
            setIsUploading(true);

            for (let i = 0; i <= 90; i += 10) {
                await new Promise(res => setTimeout(res, 100));
                setSaveprogress(i);
            }


            // Make API call to submit trades
            // const response = await axios.post('http://localhost:8081/api/trades/batch', parsedTrades, {
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${token}`
            //     }
            // });

            const response = await axios.post(
                'http://localhost:8081/api/trades/batch',
                parsedTrades,
                {
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                            setIsIndeterminate(false);
                            setSaveprogress(percent);
                        } else {
                            // No total — switch to indeterminate mode
                            setIsIndeterminate(true);
                        }
                    }
                }
            );
            console.log('response = ', response)

            for (let i = 0; i <= 90; i += 10) {
                await new Promise(res => setTimeout(res, 100));
                setSaveprogress(i);
            }

            // Success case
            const result = {
                successCount: parsedTrades.length,
                errorCount: 0,
                errors: []
            };

            setUploadSuccess('Trades uploaded successfully!');

            // Pass results to parent
            onComplete(result);
            setUploadResult(result)

        } catch (err: any) {
            // Handle API errors
            console.log('Error submitting trades:', err);
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
            console.log('errormassage', errorMessage)
            console.log('errors', errors)
            console.log('errorResult', errorResult)
            setErrors([{ row: 0, message: errorMessage }]);
            onComplete(errorResult);
            setUploadResult(errorResult)


        } finally {
            setIsUploading(false);
            setSaveprogress(0)
        }
    };


    // Update handleNext function
    const handleNext = () => {
        if (currentStep === 1) {
            const validData = validateAndTransform();
            if (validData.length > 0) {
                setParsedTrades(validData as Omit<Trade, 'id'>[]);
                setCurrentStep(2);
            } else {
                logger.debug(" Write code to show error")
                // setErrors
                // logger.debug("error",error)
            }
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
        if (currentStep === 1) {
            setErrors(([]))
        }
        if (currentStep === 3) {
            // If we're on the final review step, go back to preview
            setCurrentStep(2);
            setErrors(([]))
        } else {
            setCurrentStep(prev => Math.max(prev - 1, 0));
        }
    };
    const handleDownloadErrorsCSV = () => {
        if (errors.length === 0) return;
      
        const headers = ['Row', 'Message'];
        const rows = errors.map(err => [err.row, `"${err.message.replace(/"/g, '""')}"`]);
      
        const csvContent =
          headers.join(',') + '\n' + rows.map(row => row.join(',')).join('\n');
      
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
      
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'import_errors.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                {isUploading && (
                    <div className="w-3/5 bg-gray-200 rounded h-3 overflow-hidden">
                        {isIndeterminate ? (
                            // Indeterminate animation (looping shimmer)
                            <div className="h-3 bg-blue-500 animate-[slide_1.2s_linear_infinite] w-1/3"></div>
                        ) : (
                            // Determinate progress bar
                            <div
                                className="bg-blue-500 h-3 rounded"
                                style={{ width: `${saveprogress}%`, transition: 'width 0.3s ease-in-out' }}
                            ></div>
                        )}
                    </div>
                )}

                {/* {isUploading && (
                <div className="w-3/5 bg-gray-200 rounded h-3 overflow-hidden">
                    <div className="bg-blue-500 h-3 animate-pulse"></div>
                </div>
                )} */}

                {/* Step Content */}
                {currentStep === 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        {errors.length > 0 && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center text-red-600 mb-2">
                                    <AlertTriangle size={16} className="mr-2" />
                                    <span className="font-semibold">
                                        Import Error: No trades were found in this file, or your column mapping may be incorrect.
                                        Please ensure you’ve selected the following required columns:Action,Trade Date,Symbol,Quantity,Price.
                                        Click the Back button to review your file and try again.
                                    </span>
                                </div>
                                <ul className="list-disc pl-6 text-red-700 text-sm space-y-1">
                                    {errors.map((error, index) => (
                                        <li key={index}>
                                            Row {error.row}: {error.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <FileUploadStep 
                        onFileUpload={handleFileUpload}
                        handlePortNameUpdate = {handlePortNameUpdate} 
                        onNext={handleNext} 
                        />
                    </div>

                )}

                {(currentStep === 1) && (

                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">

                        {errors.length > 0 ? (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center text-red-600 mb-2">
                                    <AlertTriangle size={16} className="mr-2" />
                                    <span className="font-semibold">
                                        Import Error: No trades were found in this file, or your column mapping may be incorrect.
                                        Please ensure you’ve selected the following required columns:Action,Trade Date,Symbol,Quantity,Price.
                                        Click the Back button to review your file and try again.
                                    </span>
                                    <span className="font-semibold"> </span>
                                </div>
                                <ul className="list-disc pl-6 text-red-700 text-sm space-y-1">
                                    {errors.map((error, index) => (
                                        <li key={index}>
                                            Row in step 1 {error.row}: {error.message}
                                        </li>
                                    ))}
                                </ul>


                                <div className="mt-4">
                                    <button
                                        onClick={handleBack}
                                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        Back
                                    </button>
                                </div>
                            </div>

                        ) : (

                            <ColumnMappingStep
                                columns={columns}
                                mappings={mappings}
                                onMappingChange={setMappings}
                                onBack={handleBack}
                                onNext={handleNext}
                            />
                        )}
                    </div>
                )}

                {(currentStep === 2) && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        {(errors.length > 0 && parsedTrades.length <= 0) && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center text-red-600 mb-2">
                                    <AlertTriangle size={16} className="mr-2" />
                                    <span className="font-semibold">Import Errors : There are no trades in this file , Click on Back button</span>
                                </div>
                                <ul className="list-disc pl-6 text-red-700 text-sm space-y-1">
                                    {errors.map((error, index) => (
                                        <li key={index}>
                                            Row in Step 2 {error.row}: {error.message}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
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
                                    className="px-4 py-2 border bg-gray-500 text-white rounded hover:bg-gray-600"
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
                    {(uploadResult?.errorCount > 0 ) && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                <div className="flex items-center text-red-600 mb-2">
                                    <AlertTriangle size={16} className="mr-2" />
                                    <span className="font-semibold">upload error</span>
                                </div>
                                                                    <div className="max-h-64 overflow-y-auto pr-2">
                                        <ul className="list-disc pl-6 text-red-700 text-sm space-y-1">
                                            {uploadResult.errors.map((error, index) => (
                                                <li key={index}>
                                                    Row {error.row}: {error.message}
                                                </li>
                                            ))}
                                        </ul>
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
                                        Successful imports: {parsedTrades.length}
                                    </p>
                                    {errors.length > 0 && (
                                        <>
                                            <p className="text-sm text-red-600 mb-2">
                                                Errors occurred in {errors.length} lines. The following lines are rejected.
                                                Your trade import was successful. However, we detected issues in the following lines.
                                                You can either ignore these errors or, if they seem incorrect, validate your data and reimport the file.
                                            </p>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    onClick={handleDownloadErrorsCSV}
                                                    className="text-sm text-blue-600 hover:underline"
                                                >
                                                    Download Errors as CSV
                                                </button>
                                            </div>
                                            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center text-red-600 mb-2">
                                                    <AlertTriangle size={16} className="mr-2" />
                                                    <span className="font-semibold">Import Errors</span>
                                                </div>

                                                <div className="max-h-64 overflow-y-auto pr-2">
                                                    <ul className="list-disc pl-6 text-red-700 text-sm space-y-1">
                                                        {errors.map((error, index) => (
                                                            <li key={index}>
                                                                Row {error.row}: {error.message}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
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