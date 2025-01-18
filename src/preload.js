const { contextBridge } = require('electron');
const fs = require('fs/promises');
const path = require('path');

// Function to read faces directory
async function getFaceFiles() {
  try {
    const facesPath = path.join(__dirname, '../../public/faces');
    console.log('Looking for faces in:', facesPath);
    
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

// Function to save student image
async function saveStudentImage(blob, filename) {
  try {
    const facesPath = path.join(__dirname, '../../public/faces');
    
    // Ensure faces directory exists
    try {
      await fs.access(facesPath);
    } catch {
      await fs.mkdir(facesPath, { recursive: true });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const filePath = path.join(facesPath, filename);
    await fs.writeFile(filePath, buffer);
    
    console.log('Saved student image:', filename);
    return true;
  } catch (error) {
    console.error('Error saving student image:', error);
    throw error;
  }
}

// Expose functions to renderer process
contextBridge.exposeInMainWorld('api', {
  getFaceFiles: () => getFaceFiles(),
  saveStudentImage: (blob, filename) => saveStudentImage(blob, filename)
});