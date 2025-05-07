import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ImportWorkflow } from '../components/trades-import/ImportWorkflow';
import ManageTrades from '../components/ManageTrades';
import { Upload, PackagePlus } from 'lucide-react';

const TradesPage: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'manage'>('import');

  const [uploadResult, setUploadResult] = useState<{
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  } | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);


  const handleUploadComplete = (result: {
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; message: string }>;
  }) => {
    setRefreshCount(prev => prev + 1);
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
          <Upload className="h-5 w-5" />
          <span>Import Trades</span>
        </button>

        <button
          onClick={() => setActiveTab('manage')}
          className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${activeTab === 'manage'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <PackagePlus className="h-5 w-5" />
          <span>Manage Trades</span>
        </button>
      </nav>
      {activeTab === 'import' ? (
          <ImportWorkflow
            token={token}
            onComplete={handleUploadComplete}
            onSwitchToManage={() => setActiveTab('manage')}
          />
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