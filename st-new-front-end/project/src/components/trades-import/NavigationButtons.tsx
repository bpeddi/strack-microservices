import { ChevronLeft, ChevronRight } from 'lucide-react';

const NavigationButtons = ({ onBack, onNext }: { 
    onBack: () => void;
    onNext: () => void;
  }) => (
    <div className="flex justify-between mt-8">
      <button
        onClick={onBack}
        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        <ChevronLeft size={16} className="inline mr-2" /> Back
      </button>
      <button
        onClick={onNext}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Next <ChevronRight size={16} className="inline ml-2" />
      </button>
    </div>
  );

  export default NavigationButtons;