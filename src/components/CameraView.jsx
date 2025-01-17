import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useFaceRecognition } from '../contexts/FaceRecognitionContext';

const CameraView = ({ selectedPass, onBack }) => {
  const { isLoading: isModelLoading, error: modelError, referenceDescriptor } = useFaceRecognition();
  const videoRef = useRef();
  const canvasRef = useRef();
  const detectionRef = useRef();
  const [loadingStatus, setLoadingStatus] = useState('Starting camera...');
  const [error, setError] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  // Show loading or error from context
  useEffect(() => {
    if (modelError) {
      setError(`Model loading error: ${modelError}`);
    }
    if (isModelLoading) {
      setLoadingStatus('Initializing face recognition...');
    }
  }, [isModelLoading, modelError]);

  const handleMatch = async (distance) => {
    if (matchFound) return;

    const matchData = {
      name: 'Colton Spyker',
      pass: selectedPass,
      time: new Date().toLocaleTimeString(),
      confidence: ((1 - distance) * 100).toFixed(1)
    };

    setMatchFound(true);
    setMatchInfo(matchData);
    console.log('✅ Hall Pass Logged:', matchData);

    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    setTimeout(() => {
      onBack();
    }, 3000);
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !referenceDescriptor || matchFound) {
      return;
    }

    try {
      const detections = await faceapi.detectAllFaces(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!canvasRef.current || matchFound) return;

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);

      detections.forEach(detection => {
        const distance = faceapi.euclideanDistance(detection.descriptor, referenceDescriptor);
        const isMatch = distance < 0.6;

        const box = detection.detection.box;
        context.strokeStyle = isMatch ? '#00ff00' : '#ff0000';
        context.lineWidth = 3;
        context.strokeRect(box.x, box.y, box.width, box.height);

        if (isMatch && !matchFound) {
          context.font = '24px Arial';
          context.fillStyle = '#00ff00';
          context.fillText('Colton Spyker', box.x, box.y - 10);
          handleMatch(distance);
        }
      });

      if (!matchFound) {
        detectionRef.current = requestAnimationFrame(detectFaces);
      }
    } catch (err) {
      console.error('Detection error:', err);
      if (!matchFound) {
        detectionRef.current = requestAnimationFrame(detectFaces);
      }
    }
  };

  // Start camera and detection when models are loaded
  useEffect(() => {
    if (!isModelLoading && !modelError && referenceDescriptor) {
      const startVideo = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play();
              if (canvasRef.current) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                detectFaces();
              }
            };
          }
        } catch (err) {
          console.error('Camera error:', err);
          setError(`Camera error: ${err.message}`);
        }
      };

      startVideo();
    }

    return () => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isModelLoading, modelError, referenceDescriptor]);

  // Same return/render code as before...
  return (
    <div className="relative h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 text-white text-xl">
        Selected Pass: <span className="font-bold text-blue-400">{selectedPass}</span>
      </div>
      
      {!matchFound ? (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="rounded-lg"
            style={{ width: '640px', height: '480px' }}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0"
            style={{ width: '640px', height: '480px' }}
          />
        </div>
      ) : (
        <div className="bg-green-800 rounded-lg p-8 text-white text-center animate-fade-in">
          <div className="text-4xl mb-4">✅ Pass Granted!</div>
          <div className="text-2xl">
            <div className="mb-2">{matchInfo.name}</div>
            <div className="mb-2">→ {matchInfo.pass}</div>
            <div className="mb-2">{matchInfo.time}</div>
          </div>
          <div className="text-gray-300 mt-4">
            Returning to home screen...
          </div>
        </div>
      )}

      <div className="mt-4 text-white text-xl">
        {loadingStatus}
      </div>
      {error && (
        <div className="mt-2 text-red-500 text-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default CameraView;