
import { useEffect, useState } from 'react';

import { Trade } from '../../types/indexold'; // Assuming you have a types file
import NavigationButtons from './NavigationButtons';

const ColumnMappingStep = ({ columns, mappings, onMappingChange, onBack, onNext }: {
  columns: string[];
  mappings: Record<keyof Trade, string>;
  onMappingChange: (mappings: Record<keyof Trade, string>) => void;
  onBack: () => void;
  onNext: () => void;
}) => {

  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);

  // Use useEffect to automatically map columns on component mount
  useEffect(() => {
    try {
      const autoMappings = { ...mappings };
      const fieldsToMap = Object.keys(mappings) as Array<keyof Trade>;

      // Define common variations of field names to match against
      const fieldVariations: Record<keyof Trade, string[]> = {
        id: ['id', 'ID', 'identifier'],
        tradeDate: ['tradeDate', 'trade date', 'date', 'run date', 'runDate'],
        action: ['action', 'type', 'transaction type', 'transactionType', 'buy/sell'],
        symbol: ['symbol', 'ticker', 'security'],
        quantity: ['quantity', 'qty', 'amount', 'shares'],
        price: ['price', 'price ($)', 'price($)', 'trade price'],
        commission: ['commission', 'commission fees', 'commission fees ($)'],
        fee: ['fee', 'fees', 'tax', 'fees ($)'],
        netAmount: ['netAmount', 'net amount', 'total', 'amount', 'amount ($)', 'net' , 'cost' , 'Cost Basis']
      };

      // For each field in our Trade interface
      fieldsToMap.forEach(field => {
        // If the field is already mapped, skip it
        if (autoMappings[field]) return;

        // Check each column name
        for (const col of columns) {
          // if (!col || typeof col !== 'string') continue;
          const colLower = col.toLowerCase().trim();

          // Check if column exactly matches the field name
          if (colLower === field.toLowerCase()) {
            autoMappings[field] = col;
            break;
          }

          // Check variations of field names
          if (fieldVariations[field].some(variation =>
            colLower === variation.toLowerCase() ||
            colLower.includes(variation.toLowerCase())
          )) {
            autoMappings[field] = col;
            break;
          }
        }
      });

      // Update mappings if any automatic matches were found
      if (JSON.stringify(autoMappings) !== JSON.stringify(mappings)) {
        onMappingChange(autoMappings);
      }

    } catch (error: any) {
      // console.error('Error parsing file:', error);
      setErrors([{ row: 0, message: 'Error mapping columns. Please check the column names in your file.' }]);
    }
  }, [columns, mappings, onMappingChange]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Map Columns</h2>

      {errors.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-red-700">
            Your file does not look like a valid trades file. Make sure it has the correct data.
          </p>
          <span className="font-semibold text-red-700">
                                        Import Error: No trades were found in this file.
                                        Please ensure you’ve columns:Action,Trade Date,Symbol,Quantity,Price exists in your file.
                                        Click the Back button to review your file and try again.
            </span>
          <p className="text-sm text-red-600">
            Errors occurred in {errors.length} line(s):
          </p>
          <div className="text-sm bg-red-50 p-3 rounded-md">
            {errors.map((error, index) => (
              <div key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>
                  Row {error.row}: {error.message}
                </span>
              </div>
            ))}
          </div>

          {/* Only show back button if there are errors */}
          <div className="mt-4">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Column mapping UI only shown if no errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.keys(mappings).map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                  {field}
                </label>
                <select
                  value={mappings[field as keyof Trade]}
                  onChange={(e) =>
                    onMappingChange({ ...mappings, [field]: e.target.value })
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select column</option>
                  {columns
                    .filter(
                      (col, index, self) =>
                        col && self.indexOf(col) === index
                    )
                    .map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>

          {/* Show both back and next if no errors */}
          <NavigationButtons onBack={onBack} onNext={onNext} />
        </>
      )}
    </div>
  );

};

export default ColumnMappingStep;