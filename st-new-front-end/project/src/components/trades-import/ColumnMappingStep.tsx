import { useEffect } from 'react';

import { Trade } from '../../types'; // Assuming you have a types file
import NavigationButtons from './NavigationButtons';

const ColumnMappingStep = ({ columns, mappings, onMappingChange, onBack, onNext }: { 
  columns: string[];
  mappings: Record<keyof Trade, string>;
  onMappingChange: (mappings: Record<keyof Trade, string>) => void;
  onBack: () => void;
  onNext: () => void;
}) => {
  
// Use useEffect to automatically map columns on component mount
useEffect(() => {
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
    commission: ['commission', 'commission fees', 'fees', 'commission fees ($)'],
    netAmount: ['netAmount', 'net amount', 'total', 'amount', 'amount ($)', 'net']
  };
  
  // For each field in our Trade interface
  fieldsToMap.forEach(field => {
    // If the field is already mapped, skip it
    if (autoMappings[field]) return;
    
    // Check each column name
    for (const col of columns) {
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
}, [columns, mappings, onMappingChange]);

return (
  <div>
    <h2 className="text-xl font-semibold text-gray-800 mb-4">Map Columns</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.keys(mappings).map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
            {field}
          </label>
          <select
            value={mappings[field as keyof Trade]}
            onChange={(e) => onMappingChange({ ...mappings, [field]: e.target.value })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select column</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
    <NavigationButtons onBack={onBack} onNext={onNext} />
  </div>
);
};

  export default ColumnMappingStep;