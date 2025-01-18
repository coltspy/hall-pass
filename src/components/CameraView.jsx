import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { useFaceRecognition } from '../contexts/FaceRecognitionContext';

const CameraView = ({ selectedPass, onBack }) => {
  const { isLoading: isModelLoading, error: modelError, referenceProfiles } = useFaceRecognition();
  const videoRef = useRef();
  const canvasRef = useRef();
  const detectionRef = useRef();
  const [loadingStatus, setLoadingStatus] = useState('Starting camera...');
  const [error, setError] = useState(null);
  const [matchFound, setMatchFound] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  useEffect(() => {
    if (modelError) {
      setError(`Model loading error: ${modelError}`);
    }
    if (isModelLoading) {
      setLoadingStatus('Initializing face recognition...');
    }
  }, [isModelLoading, modelError]);

  const findBestMatch = (descriptor) => {
    let bestMatch = null;
    let bestDistance = Infinity;

    referenceProfiles.forEach(profile => {
      const distance = faceapi.euclideanDistance(descriptor, profile.descriptor);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestMatch = { ...profile, distance };
      }
    });

    // Only return a match if the distance is below threshold
    return bestMatch && bestMatch.distance < 0.6 ? bestMatch : null;
  };

  const handleMatch = async (matchData) => {
    if (matchFound) return; // Exit early if already matched

    const logData = {
      name: matchData.name,
      pass: selectedPass,
      time: new Date().toLocaleTimeString(),
      confidence: ((1 - matchData.distance) * 100).toFixed(1)
    };

    // Stop the camera and detection immediately
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }

    // Submit to Google Form
    try {
      const formUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSf1dtbkQAxbW-zX8hFjWgGCrkRP3i-VQMoVO6covVorTDstEg/formResponse';
      const params = new URLSearchParams({
        'entry.574170038': logData.name,
        'entry.444032202': logData.pass,
        'entry.1644501966': logData.time,
        'entry.829060897': logData.confidence
      });

      // Send the form data
      await fetch(`${formUrl}?${params.toString()}`, {
        method: 'GET',
        mode: 'no-cors',
      });
      
      console.log('✅ Hall Pass Logged to Google Form:', logData);
    } catch (error) {
      console.error('Error logging to Google Form:', error);
    }

    setMatchInfo(logData);
    setMatchFound(true); // Set this after matchInfo is set

    setTimeout(() => {
      onBack();
    }, 3000);
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !referenceProfiles.length || matchFound) {
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
        const match = findBestMatch(detection.descriptor);
        const box = detection.detection.box;
        
        // Draw box
        context.strokeStyle = match ? '#00ff00' : '#ff0000';
        context.lineWidth = 3;
        context.strokeRect(box.x, box.y, box.width, box.height);

        // Draw name if matched
        if (match) {
          context.font = '24px Arial';
          context.fillStyle = '#00ff00';
          context.fillText(match.name, box.x, box.y - 10);
          handleMatch(match);
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

  useEffect(() => {
    if (!isModelLoading && !modelError && referenceProfiles.length > 0) {
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
  }, [isModelLoading, modelError, referenceProfiles]);

  return (
    <div className="relative h-screen w-screen bg-gray-900 flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 text-white text-xl">
        Selected Pass: <span className="font-bold text-blue-400">{selectedPass}</span>
      </div>
      
      {(!matchFound || !matchInfo) ? (
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
            <div className="mb-2">Confidence: {matchInfo.confidence}%</div>
          </div>
          <div className="text-gray-300 mt-4">
            Returning to home screen...
          </div>
        </div>
      )}

      <div className="mt-4 text-white text-xl">
        {isModelLoading ? loadingStatus : `Ready - ${referenceProfiles.length} students loaded`}
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