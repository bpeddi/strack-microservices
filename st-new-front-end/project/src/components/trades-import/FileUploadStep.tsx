import { useState } from 'react';


const FileUploadStep = ({ onFileUpload,handlePortNameUpdate, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const [hasOptionTrades, setHasOptionTrades] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [portfolioName, setPortfolioName] = useState("");
  const [portfolioNameError, setPortfolioNameError] = useState("");

  // Handle drag events for the drop zone
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  // Validate portfolio name and proceed if valid
  const validateAndProceed = (file) => {
    if (!portfolioName.trim()) {
      setPortfolioNameError("Portfolio name is required.");
      return false;
    }
   
    setPortfolioNameError("");
    onFileUpload(file);
    onNext();
    return true;
  };

  const handlePortnameChange = (e:string) => {
    const name = e.target.value;
    handlePortNameUpdate(name); 

  }

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      validateAndProceed(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndProceed(file);
    }
  };

  return (
    <div
      className={`file-upload font-sans rounded-lg p-4 sm:p-6 md:p-8 text-left border-2 ${dragActive ? 'bg-blue-50 border-blue-900' : 'bg-gray-20 border-gray-100'
        } transition-colors duration-200 max-w-5xl mx-auto`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Trade Import Instructions */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm py-6 mt-6 px-6 space-y-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800">
          📥 Importing Your Trade Data into Simply Track
        </h2>
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          Simply Track makes it easy to import Excel or CSV files from any broker.
          For the best experience, we recommend:
        </p>
        <ul className="list-disc list-inside text-base text-gray-700 pl-2">
          <li>
            Downloading your <strong>trade history from the past 13 months</strong>
          </li>
          <li>
            Formatting your file in <strong>Excel</strong> before uploading
          </li>
        </ul>
        <p className="text-base text-gray-700 leading-relaxed">
          During the import process, you'll have the opportunity to{' '}
          <strong>map your file's columns</strong> to Simply Track's fields — ensuring your data is interpreted correctly.
        </p>
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-3 rounded-md text-base">
          ✅ Accurate column mapping ensures a smooth and error-free import process.
        </div>

        <div className="pt-4">
          <button
            onClick={() => setShowImageModal(true)}
            className="text-indigo-600 hover:text-indigo-800 font-medium underline transition-colors"
          >
            📊 View Example of Trade Mapping
          </button>

          {/* Modal */}
          {showImageModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                >
                  ✖
                </button>
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Example of Properly Mapped File
                </h3>
                <img
                  src="/images/import.png"
                  alt="Trade Column Mapping Example"
                  className="w-full max-h-70 rounded border border-gray-300 object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 px-6 mt-6">
        {/* Checkbox Section */}
        <div className="flex items-start mb-4">
          <div className="flex items-center hover:bg-gray-100 px-1 py-2 rounded-lg transition-colors">
            <input
              type="checkbox"
              id="optionTradesCheckbox"
              checked={hasOptionTrades}
              onChange={(e) => setHasOptionTrades(e.target.checked)}
              className="form-checkbox h-5 w-5 text-indigo-500 rounded-md border-gray-300 focus:ring-indigo-500"
            />
            <label
              htmlFor="optionTradesCheckbox"
              className="ml-3 text-base font-medium text-gray-700 select-none"
            >
              My file contains option trades
            </label>
          </div>
        </div>

        {/* Information Text */}
        {hasOptionTrades && (
          <div className="space-y-4 text-left transition-all duration-300 ease-in-out animate-fadeIn">
            <p className="text-base text-gray-700 leading-relaxed">
              When importing Option Trades, ensure symbols follow the OCC (Options Clearing Corporation) format.
              <br />
              <span className="block mt-2 font-mono bg-gray-100 p-2 rounded-md text-sm">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </p>
          </div>
        )}

        {/* Portfolio Name Input - Key validation field */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium text-sm sm:text-base mb-1">
            Portfolio Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Retirement2025"
            value={portfolioName}
            // onChange={handleAccountNameChange}
            onChange={(e) => {
              setPortfolioName(e.target.value);
              if (e.target.value.trim()) {
                setPortfolioNameError("");
              }
              handlePortnameChange(e)
            }}
            className={`w-full px-4 py-2 border ${portfolioNameError ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
          {portfolioNameError && (
            <p className="text-sm text-red-600 mt-1">{portfolioNameError}</p>
          )}
        </div>

        {/* Bottom Info and Upload Section */}
        <div className="space-y-2 text-left">
          <p className="text-base font-medium text-gray-700">
            Required columns: Action, Trade Date, Symbol, Quantity, Price
          </p>
          <div className="mt-4 space-y-1">
            <p className="text-lg font-medium text-gray-700">
              Drag and drop your trade file here
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: .xlsx, .xls, .csv
            </p>
          </div>
        </div>

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          disabled={!portfolioName.trim()}
        />
        <label
          htmlFor={portfolioName.trim() ? "file-upload" : ""}
          className={`inline-block cursor-pointer px-4 sm:px-6 py-2.5 sm:py-3 rounded-md font-medium text-sm sm:text-base transition-colors duration-200 ${portfolioName.trim()
              ? "bg-blue-500 text-white hover:bg-blue-700 hover:shadow-md"
              : "bg-blue-300 text-white cursor-not-allowed"
            }`}
        >
          Browse Files
        </label>
      </div>
    </div>
  );
};

export default FileUploadStep;