import React, { useState } from 'react';
import CameraView from './components/CameraView';
import AddStudent from './components/AddStudent';
import { FaceRecognitionProvider, useFaceRecognition } from './contexts/FaceRecognitionContext';
import { UserPlus } from 'lucide-react';

const MainApp = () => {
  const [currentView, setCurrentView] = useState('passes');
  const [selectedPass, setSelectedPass] = useState(null);
  const { referenceProfiles, reloadFaces } = useFaceRecognition();

  const passes = [
    { id: 1, text: 'Bathroom', color: 'bg-blue-500 hover:bg-blue-600' },
    { id: 2, text: 'Nurse', color: 'bg-red-500 hover:bg-red-600' },
    { id: 3, text: 'Locker', color: 'bg-green-500 hover:bg-green-600' },
    { id: 4, text: 'Office', color: 'bg-purple-500 hover:bg-purple-600' }
  ];

  const handlePassClick = (passType) => {
    if (referenceProfiles.length === 0) {
      alert('No students registered. Please add students first.');
      return;
    }
    setSelectedPass(passType);
    setCurrentView('camera');
  };

  const handleBack = async () => {
    setCurrentView('passes');
    setSelectedPass(null);
    // Reload faces when returning to main screen
    await reloadFaces();
  };

  return (
    <div className="h-screen w-screen bg-gray-100">
      {currentView === 'passes' && (
        <div className="h-full w-full p-8 relative">
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
          <button
            onClick={() => setCurrentView('addStudent')}
            className="absolute bottom-8 right-8 bg-gray-800 text-white px-6 py-3 rounded-lg
              hover:bg-gray-700 transition-colors duration-150 flex items-center gap-2"
          >
            <UserPlus size={24} />
            Add Student
          </button>
          {referenceProfiles.length === 0 && (
            <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
              No students registered. Please add students.
            </div>
          )}
        </div>
      )}
      
      {currentView === 'camera' && (
        <CameraView 
          selectedPass={selectedPass}
          onBack={handleBack}
        />
      )}

      {currentView === 'addStudent' && (
        <AddStudent onBack={handleBack} />
      )}
    </div>
  );
};

// Wrap the main app with the provider
const App = () => (
  <FaceRecognitionProvider>
    <MainApp />
  </FaceRecognitionProvider>
);

export default App;