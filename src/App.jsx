import React, { useState } from 'react';
import CameraView from './components/CameraView';
import { FaceRecognitionProvider } from './contexts/FaceRecognitionContext';

const App = () => {
  const [currentView, setCurrentView] = useState('passes');
  const [selectedPass, setSelectedPass] = useState(null);

  const passes = [
    { id: 1, text: 'Bathroom', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 2, text: 'Nurse', color: 'bg-red-500 hover:bg-red-600' },
    { id: 3, text: 'Locker', color: 'bg-green-500 hover:bg-green-600' },
    { id: 4, text: 'Office', color: 'bg-purple-500 hover:bg-purple-600' }
  ];

  const handlePassClick = (passType) => {
    setSelectedPass(passType);
    setCurrentView('camera');
  };

  const handleBack = () => {
    setCurrentView('passes');
    setSelectedPass(null);
  };

  return (
    <FaceRecognitionProvider>
      <div className="h-screen w-screen bg-gray-100">
        {currentView === 'passes' ? (
          <div className="h-full w-full p-8">
            <div className="h-full w-full grid grid-cols-2 gap-8">
              {passes.map((pass) => (
                <button
                  key={pass.id}
                  onClick={() => handlePassClick(pass.text)}
                  className={`${pass.color} text-white text-4xl font-bold rounded-xl 
                    shadow-lg transition-transform duration-150 ease-in-out
                    transform hover:scale-105 active:scale-95
                    flex items-center justify-center`}
                >
                  {pass.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <CameraView 
            selectedPass={selectedPass}
            onBack={handleBack}
          />
        )}
      </div>
    </FaceRecognitionProvider>
  );
};

export default App;