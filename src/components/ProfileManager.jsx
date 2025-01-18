import React, { useState, useRef } from 'react';
import { useFaceRecognition } from '../contexts/FaceRecognitionContext';
import { Camera, UserPlus, Trash2, ArrowLeft } from 'lucide-react';

const ProfileManager = ({ onBack }) => {
  const { referenceProfiles, addProfile, deleteProfile, isLoading } = useFaceRecognition();
  const [isCapturing, setIsCapturing] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef();
  const streamRef = useRef();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCapturing(true);
      setError(null);
    } catch (err) {
      setError('Failed to access camera');
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
    setNewName('');
  };

  const capturePhoto = async () => {
    if (!newName.trim()) {
      setError('Please enter a name first');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'));
      await addProfile(blob, newName.trim());
      
      stopCamera();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await deleteProfile(profileId);
      } catch (err) {
        setError('Failed to delete profile');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <button
        onClick={onBack}
        className="mb-8 flex items-center text-gray-600 hover:text-gray-800"
      >
        <ArrowLeft className="mr-2" /> Back to Passes
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile Management</h1>

        {/* Add New Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Profile</h2>
          
          {!isCapturing ? (
            <div className="flex items-center gap-4">
              <button
                onClick={startCamera}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg
                  hover:bg-blue-600 flex items-center"
              >
                <Camera className="mr-2" /> Start Camera
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="rounded-lg border"
                  style={{ width: '640px', height: '480px' }}
                />
              </div>
              
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name"
                className="border rounded-lg px-4 py-2 w-full"
              />

              <div className="flex gap-4">
                <button
                  onClick={capturePhoto}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg
                    hover:bg-green-600 flex items-center"
                >
                  <UserPlus className="mr-2" /> Add Profile
                </button>
                <button
                  onClick={stopCamera}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg
                    hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}
        </div>

        {/* Existing Profiles Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Existing Profiles</h2>
          
          {isLoading ? (
            <div className="text-gray-500">Loading profiles...</div>
          ) : referenceProfiles.length === 0 ? (
            <div className="text-gray-500">No profiles added yet</div>
          ) : (
            <div className="space-y-4">
              {referenceProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {profile.imageUrl && (
                      <img
                        src={profile.imageUrl}
                        alt={profile.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <span className="font-medium">{profile.name}</span>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(profile.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Delete profile"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileManager;