import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ImportWorkflow } from '../components/trades-import/ImportWorkflow';
import ManageTrades from '../components/ManageTrades';
import TradeMatching from '../components/TradeMatching';
import { Upload, PackagePlus , Shuffle, Link2 } from 'lucide-react';

const TradesPage: React.FC = () => {
  const { token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'import' | 'manage' | 'matching'>('import');

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



    let content;
  
    if (activeTab === 'import') {
      content = (
        <ImportWorkflow
          token={token}
          onComplete={handleUploadComplete}
          onSwitchToManage={() => setActiveTab('manage')}
        />
      );
    } else if (activeTab === 'matching') {
      content = (
        <TradeMatching
          token={token}
          isAuthenticated={isAuthenticated}
        />
      );
    } else {
      content = (
        <ManageTrades
          refreshCount={refreshCount}
          token={token}
          isAuthenticated={isAuthenticated}
        />
      );
    }
  
    return (
      <div className="max-w-6xl mx-auto py-8 px-2 sm:px-6 lg:px-8">
        <nav className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${
              activeTab === 'import'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>Import Trades</span>
          </button>
  
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${
              activeTab === 'manage'
                ? 'border-b-2 border-green-500 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <PackagePlus className="h-5 w-5" />
            <span>Manage Trades</span>
          </button>
  
          <button
            onClick={() => setActiveTab('matching')}
            className={`flex items-center space-x-2 pb-2 px-1 transition-colors ${
              activeTab === 'matching'
                ? 'border-b-2 border-purple-500 text-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Link2 className="h-5 w-5" />
            <span>Trades Matching</span>
          </button>
        </nav>
  
        {content}
      </div>
    );

}
export default TradesPage;