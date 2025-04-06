import * as main from './main.js'; // To access/update detectedBoxes if needed

let canvas = null;
let ctx = null;
let currentImage = null;
let currentBoxes = []; // Keep a local copy for drawing

// Variables for box interaction (dragging, resizing)
let isDragging = false;
let isResizing = false; // Could add resizing handles later
let dragStartX, dragStartY;
let selectedBoxIndex = -1;
let offsetX, offsetY; // Offset within the dragged box

export function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas element not found:', canvasId);
        return;
    }
    ctx = canvas.getContext('2d');

    // Add event listeners for interaction (if implementing box manipulation)
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp); // Stop dragging if mouse leaves
}

export function drawImage(img) {
    currentImage = img;
    // Adjust canvas size to the image size or scale image to fit canvas
    // For simplicity, let's set canvas size to image size
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
    ctx.drawImage(img, 0, 0);
    currentBoxes = []; // Clear boxes when a new image is drawn
}

export function drawBoxes(boxes) {
    if (!currentImage) return;
    currentBoxes = boxes; // Update local copy
    redrawCanvas(); // Redraw image and boxes
}

function redrawCanvas() {
     if (!ctx || !currentImage) return;
    // Clear canvas and redraw the base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);

    // Draw all bounding boxes
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    currentBoxes.forEach(box => {
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    });

     // Highlight selected box (optional)
     if (selectedBoxIndex !== -1 && currentBoxes[selectedBoxIndex]) {
        ctx.strokeStyle = 'blue';
        ctx.lineWidth = 3;
        const box = currentBoxes[selectedBoxIndex];
        ctx.strokeRect(box.x, box.y, box.width, box.height);
     }
}


export function getImageData() {
    if (!ctx || !currentImage) return null;
    try {
        // Ensure the image is fully drawn before getting data
        // Since drawImage is synchronous here, it should be fine.
        // If drawing were async, we'd need to wait.
         return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
        console.error("Error getting ImageData (maybe tainted canvas?):", e);
        // Handle potential SecurityError if the image source is cross-origin
        // and the server doesn't send CORS headers.
        alert("Could not process image due to cross-origin restrictions. Try downloading the image and uploading it from your device.");
        return null;
    }
}


// --- Interaction Logic (Basic Dragging Example) ---

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    // Important: Calculate mouse position relative to the *canvas content*,
    // considering potential scaling of the canvas element itself if its CSS
    // width/height differs from its internal resolution.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
    };
}

function handleMouseDown(e) {
    const pos = getMousePos(e);
    selectedBoxIndex = -1; // Reset selection

    // Check if the click is inside any box (iterate in reverse to select topmost box)
    for (let i = currentBoxes.length - 1; i >= 0; i--) {
        const box = currentBoxes[i];
        if (pos.x >= box.x && pos.x <= box.x + box.width &&
            pos.y >= box.y && pos.y <= box.y + box.height) {
            isDragging = true;
            selectedBoxIndex = i;
            dragStartX = pos.x;
            dragStartY = pos.y;
            // Calculate offset from top-left corner of the box
            offsetX = pos.x - box.x;
            offsetY = pos.y - box.y;
            canvas.style.cursor = 'grabbing';
            redrawCanvas(); // Redraw to show selection highlight
            break; // Stop after finding the first box
        }
    }
     if (!isDragging) {
         canvas.style.cursor = 'default';
     }
}

function handleMouseMove(e) {
    if (!isDragging || selectedBoxIndex === -1) return;

    const pos = getMousePos(e);
    const box = currentBoxes[selectedBoxIndex];

    // Calculate new top-left position
    let newX = pos.x - offsetX;
    let newY = pos.y - offsetY;

    // Basic boundary checks (prevent dragging outside canvas)
    newX = Math.max(0, Math.min(newX, canvas.width - box.width));
    newY = Math.max(0, Math.min(newY, canvas.height - box.height));


    // Update the box position in the local array
    box.x = newX;
    box.y = newY;

    // Update the main application state (optional, could update on mouseup)
    // main.updateDetectedBox(selectedBoxIndex, { ...box }); // Update central store

    redrawCanvas(); // Redraw with the updated box position
}

function handleMouseUp(e) {
    if (isDragging && selectedBoxIndex !== -1) {
        // Final update to the main application state when dragging stops
        main.updateDetectedBox(selectedBoxIndex, { ...currentBoxes[selectedBoxIndex] });
         // Potentially trigger download button re-enabling if state allows
         document.getElementById('downloadButton').disabled = false; // Or check state properly
    }
    isDragging = false;
    // Don't reset selectedBoxIndex here if you want it to remain highlighted
    // selectedBoxIndex = -1; // Uncomment to deselect on mouse up
    canvas.style.cursor = selectedBoxIndex !== -1 ? 'grab' : 'default'; // Change cursor back
     redrawCanvas(); // Redraw to potentially remove highlight or finalize position
}

