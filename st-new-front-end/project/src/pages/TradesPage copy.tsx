// src/pages/TradesPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import ImportTrades from '../components/ImportTrades';
import ManageTrades from '../components/ManageTrades';
import { Upload , PackagePlus  } from 'lucide-react';

const TradesPage: React.FC = () => {
  const { user, isAuthenticated, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('import');
  const [refreshCount, setRefreshCount] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);

  const handleUploadSuccess = (result: {
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  }) => {
    setRefreshCount(prev => prev + 1);
    setUploadResult(result);
  };

  const switchToManage = () => {
    setActiveTab('manage');
    setUploadResult(null); // Clear previous results
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <nav className="flex space-x-4 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${activeTab === 'import'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <Upload className="h-5 w-5" /> {/* Changed to Upload for "Import" */}
          <span>Import Trades</span>
        </button>

        <button
          onClick={() => switchToManage()}
          className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${activeTab === 'manage'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <PackagePlus className="h-5 w-5" /> {/* Using Table for "Manage" */}
          <span>Manage Trades</span>
        </button>
      </nav>

      {activeTab === 'import' ? (
        <div className="space-y-6">
          <ImportTrades
            onUploadSuccess={handleUploadSuccess}
            token={token}
          />

          {uploadResult && (
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Upload Summary
                </h3>
                <p className={`text-sm ${uploadResult.errorCount > 0 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                  Successfully imported {uploadResult.successCount} trades
                  {uploadResult.errorCount > 0 &&
                    ` with ${uploadResult.errorCount} errors`}
                </p>
              </div>

              {uploadResult.errorCount > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-red-600 mb-2">
                    Error Details:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          Row {error.row + 1}: {error.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setUploadResult(null)}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Upload Another File
                </button>
                <button
                  onClick={switchToManage}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Manage Trades →
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ManageTrades
          refreshCount={refreshCount}
          token={token}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
};

export default TradesPage;