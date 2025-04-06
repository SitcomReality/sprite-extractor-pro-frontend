# Sprite Extractor Pro - Frontend Implementation Process

This document outlines the steps involved in building the frontend-only Sprite Extractor application.

## Phase 1: Project Setup & Basic UI (COMPLETE)

*   **Goal:** Set up the basic HTML structure, CSS styling, and initial JavaScript modules. Load OpenCV.js.
*   **HTML (`index.html`):**
    *   Create file input (`<input type="file">`).
    *   Add main canvas (`<canvas>`).
    *   Add buttons ("Detect", "Download Spritesheet").
    *   Add input fields for parameters (Grid Size, Padding).
    *   Include basic status display area.
    *   Link CSS file.
    *   Include OpenCV.js via CDN and add `onload` callback (`onOpenCvReady`).
    *   Include main JS module (`main.js` type="module").
    *   Add basic favicon link.
*   **CSS (`css/style.css`):**
    *   Basic layout (Flexbox/Grid for controls and canvas).
    *   Style buttons, inputs, canvas container.
    *   Style status message area.
    *   Initial styles for bounding boxes (though drawing will be on canvas).
*   **JavaScript (`js/`):**
    *   **`main.js`:**
        *   Set up basic module structure (import other modules).
        *   Implement `onOpenCvReady` callback to set a flag/initialize `imageProcessor`.
        *   Add event listener for file input.
        *   Implement basic `handleImageUpload`:
            *   Use `FileReader` to read the image.
            *   Create an `Image` object.
            *   On image load, pass it to `canvasManager` to display.
            *   Update UI status (`uiController`).
            *   Enable "Detect" button.
        *   Add placeholder event listeners for "Detect" and "Download" buttons.
        *   Basic initialization (`init`) function called on DOMContentLoaded.
    *   **`uiController.js`:**
        *   Functions to update status text (`updateStatus`).
        *   Functions to enable/disable buttons (`enableButton`, `disableButton`).
        *   Function for loading state (`setLoading`).
        *   Basic `init` function to get element references.
    *   **`canvasManager.js`:**
        *   `init` function to get canvas context.
        *   `drawImage` function to draw the uploaded image onto the canvas.
        *   Placeholder `drawBoxes` function.
        *   `getImageData` function to retrieve pixel data from the canvas.
    *   **`imageProcessor.js`:**
        *   `init` function to receive and store the `cv` object.
        *   Placeholder `detectSprites` function.
        *   Placeholder `createSpritesheet` function.
*   **Assets (`assets/`):**
    *   Add a placeholder or simple favicon.
*   **Testing:**
    *   Verify HTML structure and CSS layout.
    *   Confirm OpenCV.js loads successfully (check console).
    *   Test image upload and display on the canvas.
    *   Check button states (detect enabled after upload).

## Phase 2: Sprite Detection (COMPLETE)

*   **Goal:** Implement sprite detection using OpenCV.js within `imageProcessor.js`.
*   **JavaScript:**
    *   **`imageProcessor.js` (`detectSprites`):**
        *   Receive `ImageData` from `main.js`.
        *   Convert `ImageData` to `cv.Mat`.
        *   Perform OpenCV operations:
            *   Grayscale (`cv.cvtColor`).
            *   (Optional) Blur (`cv.GaussianBlur`).
            *   Threshold (`cv.threshold` - `THRESH_BINARY_INV | THRESH_OTSU` is a good starting point).
            *   (Optional) Morphological operations (`cv.dilate`, `cv.erode`).
            *   Find Contours (`cv.findContours` - `RETR_EXTERNAL`, `CHAIN_APPROX_SIMPLE`).
            *   Calculate Bounding Boxes (`cv.boundingRect`).
            *   Filter boxes (e.g., by minimum/maximum area).
        *   **Crucially:** Manage `cv.Mat` memory (`mat.delete()` in a `finally` block).
        *   Return an array of detected box objects (`{ x, y, width, height }`).
    *   **`main.js` (`handleDetectSprites`):**
        *   Add `async` keyword.
        *   Get `ImageData` from `canvasManager`.
        *   Call `imageProcessor.detectSprites`, passing `ImageData`.
        *   Use `try...catch` for error handling during detection.
        *   Show loading state (`uiController.setLoading`).
        *   On success:
            *   Store the returned boxes.
            *   Pass boxes to `canvasManager.drawBoxes`.
            *   Update status (`uiController.updateStatus`).
            *   Enable "Download Spritesheet" button if boxes are found.
        *   On failure: Update status with error.
        *   Hide loading state.
    *   **`canvasManager.js` (`drawBoxes`):**
        *   Receive the array of boxes.
        *   Store the boxes locally.
        *   Implement `redrawCanvas`:
            *   Clear the canvas.
            *   Draw the `currentImage`.
            *   Iterate through stored boxes and draw rectangles (`ctx.strokeRect`).
        *   Call `redrawCanvas` inside `drawBoxes`.
*   **Testing:**
    *   Upload an image with distinct sprites on a relatively clean background.
    *   Click "Detect Sprites".
    *   Verify bounding boxes are drawn correctly on the canvas.
    *   Check console for OpenCV errors or memory leak warnings (if any).
    *   Test with different images. Adjust OpenCV parameters (`threshold`, `blur`, filtering) in `imageProcessor.js` if detection is poor.

## Phase 3: Spritesheet Generation & Download (COMPLETE)

*   **Goal:** Implement the creation of the final spritesheet and allow users to download it.
*   **JavaScript:**
    *   **`imageProcessor.js` (`createSpritesheet`):**
        *   Receive the *original* `HTMLImageElement`, the final list of boxes, grid size, and padding.
        *   Calculate the required spritesheet dimensions based on the number of sprites, grid size, and layout (e.g., square grid).
        *   Create a new offscreen canvas (`document.createElement('canvas')`).
        *   Set its dimensions.
        *   Get its 2D context.
        *   Iterate through the boxes:
            *   Calculate the target cell position (`col * gridSize`, `row * gridSize`).
            *   Calculate the drawing position *within* the cell, accounting for padding and centering.
            *   Determine scaling factor to fit the sprite within `gridSize - 2*padding` while maintaining aspect ratio (use `Math.min`).
            *   Draw the cropped sprite from the *original image* onto the spritesheet canvas using `drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)`.
        *   Convert the spritesheet canvas to a Blob (`canvas.toBlob(callback, 'image/png')`).
        *   Return the Blob via a Promise.
    *   **`main.js` (`handleDownloadSpritesheet`):**
        *   Add `async` keyword.
        *   Get grid size and padding values from input fields.
        *   Get the final list of boxes (potentially modified by user interaction later).
        *   Call `imageProcessor.createSpritesheet`, passing the `originalImage`, boxes, and parameters. Use `await`.
        *   Use `try...catch` for error handling.
        *   Show loading state.
        *   On success:
            *   Create a temporary download link (`<a>` element).
            *   Set `href` to `URL.createObjectURL(blob)`.
            *   Set `download` attribute (e.g., "spritesheet.png").
            *   Simulate a click on the link.
            *   Clean up the object URL (`URL.revokeObjectURL`).
            *   Remove the link element.
            *   Update status.
        *   On failure: Update status with error.
        *   Hide loading state.
*   **Testing:**
    *   After detecting sprites, click "Download Spritesheet".
    *   Verify a PNG file is downloaded.
    *   Open the file and check if sprites are correctly cropped and arranged on the specified grid with padding.
    *   Test with different grid sizes and padding values.

## Phase 4: Bounding Box Interaction (Basic Dragging COMPLETE, Future Enhancements Optional)

*   **Goal:** Allow users to manually adjust the detected bounding boxes (move, resize).
*   **JavaScript:**
    *   **`canvasManager.js`:**
        *   Add state variables: `isDragging`, `selectedBoxIndex`, `dragStartX/Y`, `offsetX/Y`.
        *   Add event listeners: `mousedown`, `mousemove`, `mouseup`, `mouseleave`.
        *   **`handleMouseDown`:**
            *   Get mouse position relative to canvas content (`getMousePos` helper function, accounting for CSS scaling).
            *   Check if the click is inside any existing box. Iterate in reverse order to select the top-most box.
            *   If inside a box: set `isDragging = true`, store `selectedBoxIndex`, calculate `offsetX/Y` (mouse position relative to box top-left). Set cursor (e.g., 'grabbing'). Redraw to highlight selection (optional).
        *   **`handleMouseMove`:**
            *   If `isDragging`: Get current mouse position. Calculate new box `x, y` based on mouse position and `offsetX/Y`. Perform boundary checks (don't drag outside canvas). Update the box coordinates in the `currentBoxes` array. Call `redrawCanvas`. Set cursor.
        *   **`handleMouseUp` / `handleMouseLeave`:**
            *   Set `isDragging = false`.
            *   **Crucial:** Update the *central* box data in `main.js` by calling an exported function (`main.updateDetectedBox(selectedBoxIndex, currentBoxes[selectedBoxIndex])`).
            *   Reset cursor (e.g., 'grab' if over a box, 'default' otherwise).
            *   Optionally reset `selectedBoxIndex` or keep it highlighted. Redraw.
        *   **`redrawCanvas`:** Modify to optionally draw a highlight (different color/line width) around the `selectedBoxIndex`.
        *   **(Optional Future: Resizing)** Add small handle elements (visually or logically) at corners/edges. Detect clicks on handles in `mousedown`. Add `isResizing` state. Modify `mousemove` to adjust `width/height` based on handle dragged.
    *   **`main.js`:**
        *   Export `getDetectedBoxes` function.
        *   Export `updateDetectedBox(index, newBox)` function to allow `canvasManager` to update the centrally stored `detectedBoxes` array.
*   **Testing:**
    *   Detect sprites.
    *   Click and drag a bounding box. Verify it moves correctly and stays within canvas bounds.
    *   Release the mouse. Verify the box stays in the new position.
    *   Download the spritesheet again. Verify the spritesheet reflects the moved box position.
    *   Test edge cases (clicking outside boxes, dragging off canvas).

## Phase 5: Refinements & Optional Features (Future Work)

*   **Goal:** Improve usability, performance, and add advanced features.
*   **Web Workers:**
    *   If detection is slow, move `imageProcessor.js` OpenCV logic into `imageProcessor.worker.js`.
    *   Use `postMessage` to send `ImageData` to the worker.
    *   Use `onmessage` in `main.js` to receive results (boxes or errors) back from the worker.
    *   Handle worker initialization and termination.
    *   Note: Transferable Objects (`ImageData`, `ArrayBuffer`) can improve performance when sending data to workers. OpenCV Mats cannot be directly transferred.
*   **Advanced Detection Parameters:**
    *   Add UI controls (sliders, inputs) for OpenCV parameters (blur kernel size, threshold values, contour area filtering).
    *   Pass these parameters from `main.js` to `imageProcessor.detectSprites`.
    *   Allow users to re-run detection with new parameters.
*   **Manual Box Creation/Deletion:**
    *   Add buttons/modes to allow users to draw new boxes directly on the canvas or delete existing ones.
    *   Update `canvasManager` interaction logic.
*   **Improved UI/UX:**
    *   Clearer loading indicators (spinners).
    *   Better error messages.
    *   Visual feedback during interactions (e.g., cursor changes).
    *   Zoom/pan functionality for large images within the canvas container.
*   **Code Quality:**
    *   Add comments.
    *   Refactor complex functions.
    *   Consistent error handling.
*   **Persistence (Optional):**
    *   Use `localStorage` to save/load detection parameters or even box positions (though image data itself shouldn't be stored).

This phased approach allows for incremental development and testing, starting with the core functionality and progressively adding features and refinements.
`````` js/main.js
import * as uiController from './uiController.js';
import * as canvasManager from './canvasManager.js';
// Use a dynamic import for OpenCV to potentially handle loading states better
// Although the current script tag onload works fine for now.
// const cv = await import('opencv-js');

let cv; // Will be assigned in onOpenCvReady
let originalImage = null;
let detectedBoxes = []; // Stores { x, y, width, height }

// --- OpenCV Initialization ---
let cvReady = false;
let cvLoadPromise = null; // Promise to track OpenCV loading

// Expose the onOpenCvReady function to the global scope
window.onOpenCvReady = () => {
    if (window.cv) {
        console.log('OpenCV.js is ready.');
        cv = window.cv; // Assign to module scope variable
        imageProcessor.init(cv); // Pass cv object to the processor
        cvReady = true;
        uiController.updateStatus('OpenCV loaded. Ready to upload image.');
        // Resolve the promise if it exists
        if (cvLoadPromise && typeof cvLoadPromise.resolve === 'function') {
            cvLoadPromise.resolve();
        }
         // Check if an image is already loaded and enable detect if so
        if (originalImage) {
            uiController.enableButton('detectButton');
        }
    } else {
        console.error("OpenCV.js loaded but 'cv' object not found.");
        uiController.updateStatus('Error loading OpenCV.js.');
         if (cvLoadPromise && typeof cvLoadPromise.reject === 'function') {
            cvLoadPromise.reject(new Error("cv object not found after OpenCV script load."));
        }
    }

};

// Function to ensure OpenCV is ready before proceeding
async function ensureCvReady() {
    if (cvReady) {
        return true;
    }
    // If the script is still loading, create a promise to wait for it
    if (!cvLoadPromise) {
         let resolve, reject;
         cvLoadPromise = new Promise((res, rej) => { resolve = res; reject = rej; });
         cvLoadPromise.resolve = resolve; // Attach resolve/reject for the global callback
         cvLoadPromise.reject = reject;
    }
    console.log("Waiting for OpenCV to load...");
    await cvLoadPromise;
    console.log("OpenCV ready, proceeding.");
    return cvReady; // Return the final status
}


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
        img.onload = async () => { // Make async to wait for CV potentially
            originalImage = img;
            // Set crossOrigin attribute *before* setting src if loading external images
            // img.crossOrigin = "Anonymous"; // Needed if image source is external & requires CORS
            canvasManager.drawImage(img);
            detectedBoxes = []; // Reset boxes on new image
            uiController.disableButton('downloadButton'); // Disable download until new detection
            uiController.setLoading(false); // Hide loading overlay first

             // Only enable detect button if OpenCV is also ready
            const isCvReady = await ensureCvReady();
            if (isCvReady) {
                 uiController.enableButton('detectButton');
                 uiController.updateStatus('Image loaded. Click "Detect Sprites".');
            } else {
                 uiController.updateStatus('Image loaded. Waiting for OpenCV...');
                 // Detect button will be enabled by onOpenCvReady when it finishes
            }
        };
        img.onerror = () => {
            uiController.updateStatus('Error loading image.');
            uiController.setLoading(false);
            originalImage = null; // Reset image state
            uiController.disableButton('detectButton');
            uiController.disableButton('downloadButton');
        }
        img.src = e.target.result; // Set src *after* onload/onerror are defined
    };
    reader.onerror = () => {
        uiController.updateStatus('Error reading file.');
        uiController.setLoading(false);
    }
    reader.readAsDataURL(file);
}

async function handleDetectSprites() {
    // Ensure CV is ready before attempting detection
    const isCvReady = await ensureCvReady();
    if (!originalImage || !isCvReady) {
        uiController.updateStatus('Image not loaded or OpenCV not ready.');
        return;
    }


    uiController.setLoading(true, 'Detecting sprites...');
    uiController.disableButton('detectButton');
    uiController.disableButton('downloadButton'); // Disable download during detection

    // Use requestAnimationFrame to allow UI to update before heavy processing
    requestAnimationFrame(async () => {
        try {
            // Get image data from the canvas where the original image was drawn
            const imageData = canvasManager.getImageData();
            if (!imageData) {
                // Error getting image data (e.g., tainted canvas)
                // uiController should have already shown an alert via canvasManager
                throw new Error("Could not get image data from canvas.");
            }

            // --- Perform detection ---
            // Pass detection parameters from UI if implemented
            const params = {
                 // Example: Get threshold value from an input
                 // thresholdValue: parseInt(document.getElementById('thresholdInput').value, 10) || 127
            };
            detectedBoxes = await imageProcessor.detectSprites(imageData, params);


            // --- Display results ---
            canvasManager.drawBoxes(detectedBoxes); // Draw the newly detected boxes
            uiController.updateStatus(`${detectedBoxes.length} potential sprites detected. Adjust boxes if needed, then download.`);
            if (detectedBoxes.length > 0) {
                uiController.enableButton('downloadButton'); // Enable download if sprites were found
            } else {
                 uiController.disableButton('downloadButton'); // Keep disabled if no sprites found
            }
        } catch (error) {
            console.error('Error during sprite detection:', error);
            uiController.updateStatus(`Detection failed: ${error.message}`);
            // Ensure buttons are in a known state after error
             uiController.disableButton('downloadButton');
        } finally {
            uiController.setLoading(false);
            uiController.enableButton('detectButton'); // Re-enable detection button
        }
    });
}

async function handleDownloadSpritesheet() {
    // Ensure CV is ready just in case, though unlikely to be needed for download itself
    const isCvReady = await ensureCvReady();
     if (!originalImage || detectedBoxes.length === 0 || !isCvReady) {
        uiController.updateStatus('No sprites detected or image/OpenCV not ready.');
        return;
    }

    uiController.setLoading(true, 'Generating spritesheet...');
    uiController.disableButton('downloadButton'); // Disable while generating
    uiController.disableButton('detectButton'); // Also disable detect

    // Use requestAnimationFrame to allow UI to update
     requestAnimationFrame(async () => {
        try {
            const gridSize = parseInt(document.getElementById('gridSize').value, 10);
            const padding = parseInt(document.getElementById('padding').value, 10);

             if (isNaN(gridSize) || gridSize <= 0) {
                throw new Error("Invalid Grid Size. Must be a positive number.");
            }
             if (isNaN(padding) || padding < 0) {
                throw new Error("Invalid Padding. Must be zero or positive.");
            }


            // Use the *original* image for cropping, and the current `detectedBoxes` array
            const spritesheetBlob = await imageProcessor.createSpritesheet(originalImage, detectedBoxes, gridSize, padding);

            // --- Trigger download ---
            const url = URL.createObjectURL(spritesheetBlob);
            const a = document.createElement('a');
            a.href = url;
            // Suggest a filename based on the original image name if possible
            const originalFileName = document.getElementById('imageUpload').files[0]?.name.split('.')[0] || 'sprites';
            a.download = `${originalFileName}_spritesheet.png`;
            document.body.appendChild(a); // Append link to body
            a.click();                          // Simulate click to trigger download
            document.body.removeChild(a);       // Remove link from body
            URL.revokeObjectURL(url);           // Release the object URL

            uiController.updateStatus('Spritesheet downloaded successfully.');

        } catch (error) {
            console.error('Error generating or downloading spritesheet:', error);
            uiController.updateStatus(`Spritesheet generation failed: ${error.message}`);
        } finally {
            uiController.setLoading(false);
            // Re-enable buttons based on state
             uiController.enableButton('detectButton');
             if (detectedBoxes.length > 0) {
                uiController.enableButton('downloadButton');
             }
        }
    });
}

// --- Initialization ---
function init() {
    uiController.init();
    canvasManager.init('mainCanvas');
    // Initial state: Update status, disable buttons
    uiController.updateStatus('Loading OpenCV.js...'); // Initial status
    uiController.disableButton('detectButton');
    uiController.disableButton('downloadButton');

    // No need to call ensureCvReady here, it will be called on demand
    // or when the script load callback fires.
     console.log("Application initialized. Waiting for OpenCV and image upload.");
}

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', init);

// Make detectedBoxes accessible/modifiable by canvasManager for adjustments
export function getDetectedBoxes() {
    // Return a copy to prevent direct modification from outside? Or allow it?
    // For now, allowing direct reference modification via updateDetectedBox.
    return detectedBoxes;
}

export function updateDetectedBox(index, newBox) {
    if (index >= 0 && index < detectedBoxes.length) {
        // Basic validation on the new box data
        if (typeof newBox?.x === 'number' && typeof newBox?.y === 'number' &&
            typeof newBox?.width === 'number' && newBox.width > 0 &&
            typeof newBox?.height === 'number' && newBox.height > 0)
        {
            detectedBoxes[index] = {
                x: Math.round(newBox.x), // Ensure integer coords
                y: Math.round(newBox.y),
                width: Math.round(newBox.width),
                height: Math.round(newBox.height)
             };
            // console.log(`Updated box ${index}:`, detectedBoxes[index]);
             // Enable download button again as boxes might have been adjusted
             if(detectedBoxes.length > 0){
                 uiController.enableButton('downloadButton');
             }
        } else {
             console.warn("Attempted to update box with invalid data:", newBox);
        }

    } else {
         console.warn(`Invalid index ${index} for updateDetectedBox.`);
    }
}

