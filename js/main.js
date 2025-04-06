import * as uiController from './uiController.js';
import * as canvasManager from './canvasManager.js';
import * as imageProcessor from './imageProcessor.js';

let originalImage = null;
let detectedBoxes = []; // Stores { x, y, width, height }

// --- OpenCV Initialization ---
let cvReady = false;
window.onOpenCvReady = () => {
    console.log('OpenCV.js is ready.');
    cv = window.cv; // Assign to global scope for modules that need it (or pass it)
    imageProcessor.init(cv); // Pass cv object to the processor
    cvReady = true;
    uiController.updateStatus('OpenCV loaded. Ready to upload image.');
    // Optionally enable upload button here if it was initially disabled
};


// --- Event Listeners ---
document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
document.getElementById('detectButton').addEventListener('click', handleDetectSprites);
document.getElementById('downloadButton').addEventListener('click', handleDownloadSpritesheet);

// --- Handlers ---
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        uiController.updateStatus('Please select a valid image file.');
        return;
    }

    uiController.setLoading(true, 'Loading image...');
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            canvasManager.drawImage(img);
            uiController.enableButton('detectButton');
            uiController.disableButton('downloadButton');
            uiController.updateStatus('Image loaded. Click "Detect Sprites".');
            detectedBoxes = []; // Reset boxes on new image
            uiController.setLoading(false);
        };
        img.onerror = () => {
            uiController.updateStatus('Error loading image.');
            uiController.setLoading(false);
        }
        img.src = e.target.result;
    };
    reader.onerror = () => {
        uiController.updateStatus('Error reading file.');
        uiController.setLoading(false);
    }
    reader.readAsDataURL(file);
}

async function handleDetectSprites() {
    if (!originalImage || !cvReady) {
        uiController.updateStatus('Image or OpenCV not ready.');
        return;
    }

    uiController.setLoading(true, 'Detecting sprites...');
    uiController.disableButton('detectButton');
    uiController.disableButton('downloadButton');

    try {
        // Get image data from the canvas where the original image was drawn
        const imageData = canvasManager.getImageData();
        if (!imageData) {
            throw new Error("Could not get image data from canvas.");
        }

        // Perform detection
        detectedBoxes = await imageProcessor.detectSprites(imageData, {}); // Pass params if needed

        // Display results
        canvasManager.drawBoxes(detectedBoxes);
        uiController.updateStatus(`${detectedBoxes.length} potential sprites detected. Adjust boxes if needed, then download.`);
        if (detectedBoxes.length > 0) {
            uiController.enableButton('downloadButton');
        }
    } catch (error) {
        console.error('Error during sprite detection:', error);
        uiController.updateStatus(`Detection failed: ${error.message}`);
    } finally {
        uiController.setLoading(false);
        uiController.enableButton('detectButton'); // Re-enable detection
    }
}

async function handleDownloadSpritesheet() {
    if (!originalImage || detectedBoxes.length === 0) {
        uiController.updateStatus('No sprites to download.');
        return;
    }

    uiController.setLoading(true, 'Generating spritesheet...');
    uiController.disableButton('downloadButton'); // Disable while generating

    try {
        const gridSize = parseInt(document.getElementById('gridSize').value, 10) || 64;
        const padding = parseInt(document.getElementById('padding').value, 10) || 2;

        // Use the *original* image for cropping, not potentially scaled canvas data
        const spritesheetBlob = await imageProcessor.createSpritesheet(originalImage, detectedBoxes, gridSize, padding);

        // Trigger download
        const url = URL.createObjectURL(spritesheetBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'spritesheet.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        uiController.updateStatus('Spritesheet downloaded.');

    } catch (error) {
        console.error('Error generating spritesheet:', error);
        uiController.updateStatus(`Spritesheet generation failed: ${error.message}`);
    } finally {
        uiController.setLoading(false);
        uiController.enableButton('downloadButton'); // Re-enable download
    }
}

// --- Initialization ---
function init() {
    uiController.init();
    canvasManager.init('mainCanvas');
    uiController.updateStatus('Please load OpenCV (loading...) and upload an image.');
    // Initial state: disable buttons until prerequisites are met
    uiController.disableButton('detectButton');
    uiController.disableButton('downloadButton');
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);

// Make detectedBoxes accessible/modifiable by canvasManager if needed for adjustments
export function getDetectedBoxes() {
    return detectedBoxes;
}

export function updateDetectedBox(index, newBox) {
    if (index >= 0 && index < detectedBoxes.length) {
        detectedBoxes[index] = newBox;
        // Optionally redraw boxes immediately after update
        // canvasManager.drawBoxes(detectedBoxes);
    }
}

