let statusElement = null;
let detectButton = null;
let downloadButton = null;
let loadingOverlay = null; // Or just manage status text

export function init() {
    statusElement = document.getElementById('status');
    detectButton = document.getElementById('detectButton');
    downloadButton = document.getElementById('downloadButton');
    // Create a loading indicator if needed, e.g., a spinner div
    // loadingOverlay = document.getElementById('loadingOverlay');
    if (!statusElement || !detectButton || !downloadButton) {
        console.error("UI Controller init failed: Elements not found.");
    }
}

export function updateStatus(message) {
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.display = message ? 'block' : 'none';
    }
     console.log("Status:", message); // Log status for debugging
}

export function setLoading(isLoading, message = 'Processing...') {
    if (isLoading) {
        updateStatus(message);
        // Show spinner/overlay if implemented
        // loadingOverlay.style.display = 'flex';
        disableButton('detectButton'); // Often disable buttons during loading
        disableButton('downloadButton');
    } else {
        // Hide spinner/overlay
        // loadingOverlay.style.display = 'none';
         // Re-enable buttons based on app state, not automatically here
         // Status message might be updated by the caller after loading finishes
    }
}


export function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
    }
}

export function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
    }
}

let statusElement = null;
let detectButton = null;
let downloadButton = null;
let loadingOverlay = null;
let statusContainer = null; // Container for the message

export function init() {
    statusElement = document.getElementById('status');
    statusContainer = statusElement ? statusElement.parentElement : null; // Get the container if needed for showing/hiding
    detectButton = document.getElementById('detectButton');
    downloadButton = document.getElementById('downloadButton');
    // Could create a dedicated loading overlay dynamically or find one
    // loadingOverlay = document.getElementById('loadingOverlay');
    if (!statusElement || !detectButton || !downloadButton || !statusContainer) {
        console.error("UI Controller init failed: One or more required elements not found.");
    }
}

export function updateStatus(message, isError = false) {
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.style.color = isError ? '#d9534f' : 'white'; // Example: red for errors
        statusElement.style.display = message ? 'block' : 'none';

        // Make sure the container (which might control background/position) is visible
        if (statusContainer) {
            statusContainer.style.visibility = message ? 'visible' : 'hidden';
            statusContainer.style.opacity = message ? '1' : '0'; // Optional fade
        }
    }
     if (isError) {
        console.error("Status Update (Error):", message);
     } else {
         console.log("Status Update:", message);
     }
}

export function setLoading(isLoading, message = 'Processing...') {
    if (isLoading) {
        updateStatus(message); // Show loading message
        // Show spinner/overlay if implemented
        // if (loadingOverlay) loadingOverlay.style.display = 'flex';

        // Disable buttons during loading
        disableButton('detectButton');
        disableButton('downloadButton');
        // Maybe change cursor to 'wait'
        document.body.style.cursor = 'wait';
    } else {
        // Hide spinner/overlay
        // if (loadingOverlay) loadingOverlay.style.display = 'none';

        // Don't update status message here, let the caller do it
        // Re-enable buttons based on app state *after* loading finishes
        // The calling function (e.g., handleDetectSprites) should re-enable appropriately
        document.body.style.cursor = 'default'; // Reset cursor
    }
}


export function enableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        // console.log(`Enabled button: ${buttonId}`);
    } else {
        console.warn(`Attempted to enable non-existent button: ${buttonId}`);
    }
}

export function disableButton(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        // console.log(`Disabled button: ${buttonId}`);
    } else {
         console.warn(`Attempted to disable non-existent button: ${buttonId}`);
    }
}

