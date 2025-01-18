const { contextBridge } = require('electron');
const fs = require('fs/promises');
const path = require('path');

// Function to read faces directory
async function getFaceFiles() {
  try {
    // In development, look in the public folder
    const facesPath = path.join(__dirname, '../../public/faces');
    
    console.log('Looking for faces in:', facesPath);
    
    // Check if directory exists
    try {
      await fs.access(facesPath);
    } catch (err) {
      console.error('Directory does not exist:', facesPath);
      throw err;
    }
    
    const files = await fs.readdir(facesPath);
    const jpgFiles = files.filter(file => file.toLowerCase().endsWith('.jpg'));
    console.log('Found face files:', jpgFiles);
    return jpgFiles;
  } catch (error) {
    console.error('Error reading faces directory:', error);
    return [];
  }
}

// Expose the function to the renderer process
contextBridge.exposeInMainWorld('api', {
  getFaceFiles: () => getFaceFiles()
});