import { useState } from 'react';

const FileUploadStep = ({ onFileUpload, onNext }: {
  onFileUpload: (file: File) => void;
  onNext: () => void;
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [hasOptionTrades, setHasOptionTrades] = useState(false);


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) {
      onFileUpload(e.dataTransfer.files[0]);
      onNext();
    }
  };

  return (
    <div
      className={`file-upload rounded-lg p-1 text-left border-2 ${dragActive ? 'bg-blue-50 border-blue-900' : 'bg-gray-20 border-gray-100'} transition-colors duration-200 max-w-2xl mx-auto`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className='space-y-6'>
        {/* Checkbox Section */}
        <div className="flex items-start justify-left mb-6">
          <div className="flex items-left hover:bg-gray-100 px-1 py-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              id="optionTradesCheckbox"
              checked={hasOptionTrades}
              onChange={(e) => setHasOptionTrades(e.target.checked)}
              className="form-checkbox h-5 w-5 text-indigo-300 rounded-md border-2 border-gray-300 focus:ring-indigo-500"
            />
            <label
              htmlFor="optionTradesCheckbox"
              className="ml-3 text-sm font-medium text-gray-700 select-none"
            >
              My file contains option trades
            </label>
          </div>
        </div>

        {/* Information Text */}
        <div className="space-y-4 text-left">
          <p className="text-gray-700 leading-relaxed">
            When importing Option Trades, ensure symbols follow the OCC (Options Clearing Corporation) format.<br />
            <span className="block mt-2 font-mono bg-gray-100 p-2 rounded-md">
              Example: FB190503C190 → FB May 03 2019 190 Call
            </span>
            <a
              href="https://help.yahoo.com/kb/option-symbol-sln13884.html"
              className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn how to read option symbols
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </p>

          <div className="mt-6 space-y-3">
            <p className="text-gray-600 text-lg font-medium">
              Drag and drop your trade file here
            </p>
            <p className="text-gray-500 text-sm">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>

          <div className="mt-4 text-gray-600 text-sm text-left space-y-1">
            <p className="font-medium text-gray-700">Required columns:</p>
            <ul className="list-disc list-inside pl-2">
              <li>Action</li>
              <li>Trade Date</li>
              <li>Symbol</li>
              <li>Quantity</li>
              <li>Price</li>
              <li>Commission</li>
            </ul>
          </div>
        </div>

        {/* Upload Button */}
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-block cursor-pointer bg-blue-500 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700transition-colors duration-200 hover:shadow-md"
        >
          Browse Files
        </label>
      </div>
    </div>
  );
};

export default FileUploadStep;