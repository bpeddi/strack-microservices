import { useState } from 'react';

const FileUploadStep = ({ onFileUpload, onNext }: { 
    onFileUpload: (file: File) => void;
    onNext: () => void;
  }) => {
    const [dragActive, setDragActive] = useState(false);
  
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
        className={`file-upload rounded-lg p-8 text-center ${dragActive ? 'bg-blue-50 border-blue-500' : 'bg-gray-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className='flex-auto mt-2 mb-2 '>
        <p className="text-gray-600 mb-4">Drag and drop your trade file here. </p> 
        <p className="text-gray-600 mb-4"> File should include columns: action , tradeDate, symbol, quantity, price, commission</p>
        </div>
        
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])}
          className="hidden"
          id="file-upload"
        />
        <div className='flex-auto mt-4 '>
        <label 
          htmlFor="file-upload"
          className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Browse Files
        </label>
        </div>
      </div>
    );
  };

  export default FileUploadStep;