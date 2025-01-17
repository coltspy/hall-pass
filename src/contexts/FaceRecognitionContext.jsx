import React, { createContext, useContext, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognitionContext = createContext(null);

export const FaceRecognitionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referenceDescriptor, setReferenceDescriptor] = useState(null);

  useEffect(() => {
    const loadModelsAndReference = async () => {
      try {
        console.log('Preloading face detection models...');
        
        // Load all models in parallel
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log('Models loaded successfully');

        // Load and process reference image
        console.log('Processing reference image...');
        const img = await faceapi.fetchImage('/faces/colton_spyker.jpg');
        const detection = await faceapi.detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          throw new Error('No face found in reference image');
        }

        setReferenceDescriptor(detection.descriptor);
        console.log('Reference face descriptor created and stored');
        setIsLoading(false);

      } catch (error) {
        console.error('Error during preload:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    loadModelsAndReference();
  }, []);

  return (
    <FaceRecognitionContext.Provider value={{ isLoading, error, referenceDescriptor }}>
      {children}
    </FaceRecognitionContext.Provider>
  );
};

export const useFaceRecognition = () => {
  const context = useContext(FaceRecognitionContext);
  if (context === null) {
    throw new Error('useFaceRecognition must be used within a FaceRecognitionProvider');
  }
  return context;
};