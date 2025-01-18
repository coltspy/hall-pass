import React, { useState, useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, ArrowLeft } from 'lucide-react';

const AddStudent = ({ onBack }) => {
  const videoRef = useRef();
  const canvasRef = useRef();
  const streamRef = useRef();
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [currentField, setCurrentField] = useState('first'); // 'first' or 'last'
  const [capturedImage, setCapturedImage] = useState(null);

  // Start camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Draw face detection guides
  useEffect(() => {
    const drawGuides = async () => {
      if (!videoRef.current || !canvasRef.current || isCapturing) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');

      // Draw corner guides
      const guideSize = 50;
      const padding = 100;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;

      // Top-left guide
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding + guideSize, padding);
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, padding + guideSize);
      ctx.stroke();

      // Top-right guide
      ctx.beginPath();
      ctx.moveTo(canvas.width - padding, padding);
      ctx.lineTo(canvas.width - padding - guideSize, padding);
      ctx.moveTo(canvas.width - padding, padding);
      ctx.lineTo(canvas.width - padding, padding + guideSize);
      ctx.stroke();

      // Bottom-left guide
      ctx.beginPath();
      ctx.moveTo(padding, canvas.height - padding);
      ctx.lineTo(padding + guideSize, canvas.height - padding);
      ctx.moveTo(padding, canvas.height - padding);
      ctx.lineTo(padding, canvas.height - padding - guideSize);
      ctx.stroke();

      // Bottom-right guide
      ctx.beginPath();
      ctx.moveTo(canvas.width - padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding - guideSize, canvas.height - padding);
      ctx.moveTo(canvas.width - padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding - guideSize);
      ctx.stroke();

      // Request next frame if not capturing
      if (!isCapturing) {
        requestAnimationFrame(drawGuides);
      }
    };

    if (videoRef.current && videoRef.current.readyState === 4) {
      drawGuides();
    } else {
      videoRef.current?.addEventListener('loadedmetadata', drawGuides);
    }

    return () => {
      videoRef.current?.removeEventListener('loadedmetadata', drawGuides);
    };
  }, [isCapturing]);

  const startCountdown = () => {
    setIsCapturing(true);
    setCountdown(3);
    
    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countInterval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // Convert to blob
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    setCapturedImage(URL.createObjectURL(blob));
    setShowKeyboard(true);
  };

  const handleKeyPress = (key) => {
    if (currentField === 'first') {
      setFirstName(prev => key === 'backspace' ? prev.slice(0, -1) : prev + key);
    } else {
      setLastName(prev => key === 'backspace' ? prev.slice(0, -1) : prev + key);
    }
  };

  const handleNext = () => {
    if (currentField === 'first') {
      setCurrentField('last');
    } else {
      saveStudent();
    }
  };

  const saveStudent = async () => {
    if (!capturedImage || !firstName || !lastName) return;

    try {
      // Convert the captured image to a Blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Create filename
      const filename = `${firstName.toLowerCase()}_${lastName.toLowerCase()}.jpg`;

      // Save the file using electron IPC
      await window.api.saveStudentImage(blob, filename);

      // Return to main screen
      onBack();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const renderKeyboard = () => {
    const keys = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    return (
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl w-full">
        <div className="mb-6">
          <input
            type="text"
            value={currentField === 'first' ? firstName : lastName}
            placeholder={currentField === 'first' ? "First Name" : "Last Name"}
            className="w-full p-4 text-2xl rounded text-center"
            readOnly
          />
        </div>
        {keys.map((row, i) => (
          <div key={i} className="flex justify-center gap-3 mb-3">
            {row.map(key => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                className="w-20 h-20 bg-gray-700 text-white rounded-xl text-3xl font-semibold
                  hover:bg-gray-600 active:bg-gray-500 transition-colors"
              >
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => handleKeyPress('backspace')}
            className="flex-1 h-20 bg-red-600 text-white rounded-xl text-2xl font-semibold
              hover:bg-red-500 active:bg-red-400 transition-colors"
          >
            Backspace
          </button>
          <button
            onClick={() => handleKeyPress(' ')}
            className="flex-1 h-20 bg-gray-700 text-white rounded-xl text-2xl font-semibold
              hover:bg-gray-600 active:bg-gray-500 transition-colors"
          >
            Space
          </button>
          <button
            onClick={handleNext}
            className="flex-1 h-20 bg-green-600 text-white rounded-xl text-2xl font-semibold
              hover:bg-green-500 active:bg-green-400 transition-colors"
          >
            {currentField === 'first' ? 'Next' : 'Save'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <button
        onClick={onBack}
        className="mb-8 flex items-center text-white hover:text-gray-300"
      >
        <ArrowLeft className="mr-2" /> Back
      </button>

      <div className="flex flex-col items-center">
        <div className="relative mb-8">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="rounded-lg"
            style={{ width: '640px', height: '480px' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 pointer-events-none"
          />
          
          {countdown && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-9xl font-bold animate-pulse">
                {countdown}
              </div>
            </div>
          )}
        </div>

        {!showKeyboard && !countdown && (
          <button
            onClick={startCountdown}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl
              hover:bg-blue-500 active:bg-blue-400 flex items-center gap-2"
          >
            <Camera size={24} />
            Take Picture
          </button>
        )}

        {showKeyboard && renderKeyboard()}
      </div>
    </div>
  );
};

export default AddStudent;