import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as faceapi from 'face-api.js';

const FaceRecognitionContext = createContext(null);

export const FaceRecognitionProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referenceProfiles, setReferenceProfiles] = useState([]);

  const loadFaceProfiles = useCallback(async () => {
    try {
      console.log('Loading face profiles...');
      
      // Get list of face images
      const faceFiles = await window.api.getFaceFiles();
      console.log('Found face files:', faceFiles);

      if (faceFiles.length === 0) {
        throw new Error('No face images found in faces directory');
      }

      // Process all reference images in parallel
      const profiles = await Promise.all(faceFiles.map(async (filename) => {
        try {
          console.log(`Processing ${filename}...`);
          const img = await faceapi.fetchImage(`/faces/${filename}`);
          const detection = await faceapi.detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            // Convert filename (first_last.jpg) to name (First Last)
            const name = filename
              .replace('.jpg', '')
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return {
              name,
              descriptor: detection.descriptor
            };
          } else {
            console.warn(`No face detected in ${filename}`);
            return null;
          }
        } catch (err) {
          console.error(`Error processing ${filename}:`, err);
          return null;
        }
      }));

      // Filter out any failed processing attempts
      const validProfiles = profiles.filter(profile => profile !== null);

      if (validProfiles.length === 0) {
        throw new Error('No valid face profiles could be created');
      }

      setReferenceProfiles(validProfiles);
      console.log(`Successfully loaded ${validProfiles.length} face profiles`);
      setError(null);

    } catch (error) {
      console.error('Error loading faces:', error);
      setError(error.message);
    }
  }, []);

  // Initial load of models and faces
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        console.log('Preloading face detection models...');
        
        // Load all models in parallel
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        console.log('Models loaded successfully');

        // Load initial face profiles
        await loadFaceProfiles();

      } catch (error) {
        console.error('Error during initialization:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [loadFaceProfiles]);

  return (
    <FaceRecognitionContext.Provider value={{ 
      isLoading, 
      error, 
      referenceProfiles,
      reloadFaces: loadFaceProfiles 
    }}>
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