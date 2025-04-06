// Placeholder for OpenCV object, will be initialized via init()
let cvInstance = null;

export function init(cv) {
    if (!cv) {
        console.error("OpenCV instance not provided during initialization.");
        return;
    }
    cvInstance = cv;
    console.log("Image Processor initialized with OpenCV.");
}

/**
 * Detects potential sprite bounding boxes using OpenCV.
 * @param {ImageData} imageData - The ImageData object from the canvas.
 * @param {object} params - Detection parameters (e.g., threshold values). Currently unused.
 * @returns {Promise<Array<{x: number, y: number, width: number, height: number}>>} - A promise that resolves with an array of bounding boxes.
 */
export async function detectSprites(imageData, params) {
    if (!cvInstance) {
        throw new Error("OpenCV is not initialized.");
    }
    if (!imageData) {
         throw new Error("ImageData is invalid.");
    }

    // Wrap OpenCV operations in a try...finally block to ensure memory is released
    let src = null;
    let gray = null;
    let blurred = null;
    let thresh = null;
    let contours = null;
    let hierarchy = null;
    const detectedBoxes = [];

    try {
        // 1. Load image data into an OpenCV Mat object
        // Use cv.matFromImageData for direct conversion
        src = cvInstance.matFromImageData(imageData);
        if (!src || src.empty()) {
             throw new Error("Failed to create Mat from ImageData.");
        }

        // 2. Convert to Grayscale
        gray = new cvInstance.Mat();
        cvInstance.cvtColor(src, gray, cvInstance.COLOR_RGBA2GRAY);

        // 3. Apply Gaussian Blur (optional, helps reduce noise)
        // blurred = new cvInstance.Mat();
        // let ksize = new cvInstance.Size(5, 5); // Kernel size - adjust as needed
        // cvInstance.GaussianBlur(gray, blurred, ksize, 0, 0, cvInstance.BORDER_DEFAULT);
        // let sourceForThreshold = blurred; // Use blurred image for thresholding
        let sourceForThreshold = gray; // Use grayscale directly if no blur

        // 4. Apply Thresholding (Binary Inverse + Otsu's method is common for sprite sheets with transparency/uniform backgrounds)
        thresh = new cvInstance.Mat();
        // Adjust thresholding parameters as needed.
        // cv.threshold(source, dest, threshValue, maxVal, type)
        // THRESH_BINARY_INV: Pixels above threshold become 0, below become maxVal
        // THRESH_OTSU: Automatically determines the optimal threshold value
        cvInstance.threshold(sourceForThreshold, thresh, 0, 255, cvInstance.THRESH_BINARY_INV | cvInstance.THRESH_OTSU);

        // (Optional) Apply morphological operations (e.g., dilation/erosion) to clean up the mask
        // let kernel = cvInstance.Mat.ones(3, 3, cvInstance.CV_8U);
        // cvInstance.dilate(thresh, thresh, kernel, new cvInstance.Point(-1, -1), 1);
        // cvInstance.erode(thresh, thresh, kernel, new cvInstance.Point(-1, -1), 1);
        // kernel.delete();


        // 5. Find Contours
        contours = new cvInstance.MatVector();
        hierarchy = new cvInstance.Mat(); // Hierarchy information (parent/child contours)
        // cv.findContours(source, contours, hierarchy, mode, method)
        // RETR_EXTERNAL: Retrieves only the extreme outer contours. Good for separating distinct objects.
        // CHAIN_APPROX_SIMPLE: Compresses horizontal, vertical, and diagonal segments, leaving only their end points. Saves memory.
        cvInstance.findContours(thresh, contours, hierarchy, cvInstance.RETR_EXTERNAL, cvInstance.CHAIN_APPROX_SIMPLE);

        // 6. Extract Bounding Boxes
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const rect = cvInstance.boundingRect(contour);

            // Basic filtering (optional): Ignore very small or very large boxes
            const minArea = 10; // Minimum pixel area
            const maxArea = (imageData.width * imageData.height) * 0.9; // Max % of total image area
            if (rect.width * rect.height >= minArea && rect.width * rect.height <= maxArea ) {
                 detectedBoxes.push({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height
                });
            }
            contour.delete(); // Clean up individual contour Mat
        }

        console.log(`Found ${contours.size()} raw contours, kept ${detectedBoxes.length} boxes after filtering.`);

    } catch (error) {
        console.error("OpenCV Error during detection:", error);
        // Rethrow or handle as needed
        throw new Error(`OpenCV processing failed: ${error.message || error}`);
    } finally {
        // IMPORTANT: Release all allocated OpenCV Mat objects
        if (src) src.delete();
        if (gray) gray.delete();
        if (blurred) blurred.delete();
        if (thresh) thresh.delete();
        if (contours) contours.delete();
        if (hierarchy) hierarchy.delete();
        console.log("OpenCV Mats released.");
    }

    return detectedBoxes;
}


/**
 * Creates a spritesheet by cropping sprites from the original image and arranging them on a grid.
 * @param {HTMLImageElement} originalImage - The original uploaded image element.
 * @param {Array<{x: number, y: number, width: number, height: number}>} boxes - Array of bounding boxes for sprites.
 * @param {number} gridSize - The size (width and height) of each cell in the spritesheet grid.
 * @param {number} padding - The padding space around each sprite within its grid cell.
 * @returns {Promise<Blob>} - A promise that resolves with the spritesheet image as a Blob.
 */
export async function createSpritesheet(originalImage, boxes, gridSize, padding) {
    if (!originalImage || boxes.length === 0) {
        throw new Error("No image or bounding boxes provided for spritesheet creation.");
    }

    const numSprites = boxes.length;
    // Determine grid layout (e.g., aim for a roughly square grid)
    const cols = Math.ceil(Math.sqrt(numSprites));
    const rows = Math.ceil(numSprites / cols);

    // Calculate spritesheet dimensions
    const sheetWidth = cols * gridSize;
    const sheetHeight = rows * gridSize;

    // Create a new canvas for the spritesheet
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = sheetWidth;
    sheetCanvas.height = sheetHeight;
    const sheetCtx = sheetCanvas.getContext('2d');

    // Ensure transparent background
    sheetCtx.clearRect(0, 0, sheetWidth, sheetHeight);

    // Draw each sprite onto the spritesheet canvas
    boxes.forEach((box, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        // Calculate the top-left corner of the target grid cell
        const cellX = col * gridSize;
        const cellY = row * gridSize;

        // Calculate the maximum available space within the cell for the sprite (considering padding)
        const maxSpriteWidth = gridSize - 2 * padding;
        const maxSpriteHeight = gridSize - 2 * padding;

        // Determine the scaling factor to fit the sprite into the cell while maintaining aspect ratio
        const scale = Math.min(maxSpriteWidth / box.width, maxSpriteHeight / box.height, 1); // Don't scale up (max 1)

        const drawWidth = box.width * scale;
        const drawHeight = box.height * scale;

        // Calculate the position to draw the sprite centered within the padded cell area
        const drawX = cellX + padding + (maxSpriteWidth - drawWidth) / 2;
        const drawY = cellY + padding + (maxSpriteHeight - drawHeight) / 2;

        try {
             // Draw the cropped portion of the original image onto the spritesheet canvas
             // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
            sheetCtx.drawImage(
                originalImage,
                box.x, box.y, box.width, box.height, // Source rectangle (from original image)
                drawX, drawY, drawWidth, drawHeight  // Destination rectangle (on spritesheet canvas)
            );
        } catch (e) {
             console.error(`Error drawing sprite index ${index}:`, e);
             // Continue trying to draw other sprites
        }
    });

    // Convert the spritesheet canvas to a Blob
    return new Promise((resolve, reject) => {
        sheetCanvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas to Blob conversion failed.'));
            }
        }, 'image/png'); // Specify image format (e.g., PNG for transparency)
    });
}

