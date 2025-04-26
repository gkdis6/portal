// Store active intervals and associated elements
let activeTimers = {}; // { widgetId: { intervalId: id, widget: el, display: el, actionBtn: el, controls: el, duration: sec, customInput: el } }

// Function to format seconds into MM:SS or SSs format
function formatTime(seconds) {
    if (seconds < 0) seconds = 0;
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// --- Timer State Management --- 

function stopTimer(widgetId) {
    console.log(`[Timer Debug] stopTimer called for ${widgetId}`); // Log entry
    if (activeTimers[widgetId] && activeTimers[widgetId].intervalId) { // Check intervalId exists
        clearInterval(activeTimers[widgetId].intervalId);
        activeTimers[widgetId].intervalId = null; // Clear the interval ID reference
        console.log(`[Timer Debug] Interval cleared for ${widgetId}`);
        // Don't delete the whole activeTimers[widgetId] entry here
    }
    // Remove finished class if it exists, regardless of interval
    if (activeTimers[widgetId] && activeTimers[widgetId].widget) {
         activeTimers[widgetId].widget.classList.remove('finished');
    }
}

function startTimer(widgetId) {
    if (!activeTimers[widgetId]) return; // Should exist

    const timerData = activeTimers[widgetId];
    let time = timerData.duration;

    // Initial display update
    timerData.display.textContent = formatTime(time);

    timerData.intervalId = setInterval(() => {
        if (!activeTimers[widgetId]) { // Check if stopped externally
             clearInterval(timerData.intervalId); // Prevent ghost interval
             return;
        }
        time--;
        timerData.display.textContent = formatTime(time);
        // Store remaining time if needed for resume later?
        // activeTimers[widgetId].remaining = time;

        if (time <= 0) {
            stopTimer(widgetId); // Stop interval first
            setTimerState(widgetId, 'finished'); // Set state and update UI
            // Add class for animation
            if (timerData.widget) {
                 timerData.widget.classList.add('finished');
                // Optional: Remove finished state after a while
                setTimeout(() => {
                    if(timerData.widget) timerData.widget.classList.remove('finished');
                }, 2000); 
            }
        }
    }, 1000);
}

// Updates UI based on state
function setTimerState(widgetId, newState, duration = null) {
     if (!activeTimers[widgetId]) return;
    const timerData = activeTimers[widgetId];
    timerData.state = newState;

    // Update duration if provided (usually when setting to idle)
    if (duration !== null) {
        timerData.duration = duration;
    }

    switch (newState) {
        case 'idle':
            // --- DEBUG LOGS START ---
            console.log(`[Timer Debug] Setting state to idle for ${widgetId}. New duration: ${timerData.duration}`);
            timerData.display.textContent = formatTime(timerData.duration);
            console.log(`[Timer Debug] Display text content set to: ${timerData.display.textContent}`);
            // --- DEBUG LOGS END ---
            timerData.actionBtn.textContent = 'Start';
            timerData.actionBtn.style.display = 'block';
            timerData.controls.style.display = 'flex';
            if(timerData.widget) timerData.widget.classList.remove('finished');
            break;
        case 'running':
            // Display update happens in interval
            timerData.actionBtn.textContent = 'Stop';
            timerData.actionBtn.style.display = 'block';
            timerData.controls.style.display = 'none';
            if(timerData.widget) timerData.widget.classList.remove('finished');
            break;
        case 'finished':
            timerData.display.textContent = "Time's Up!";
            timerData.actionBtn.textContent = 'Reset';
            timerData.actionBtn.style.display = 'block';
            timerData.controls.style.display = 'none';
            // 'finished' class added in startTimer callback
            break;
    }
}

// --- Widget Content Creation --- 

export function createTimerContent(contentContainer, content, id, updateWidgetContent, widget) {
    let currentDuration = 60; // Default duration: 1 minute

    // TODO: Load state from 'content' if implemented

    const timerDisplay = document.createElement("div");
    timerDisplay.classList.add("timer-display");
    // Initial display set by setTimerState later

    const actionButton = document.createElement("button");
    actionButton.classList.add("action-button");
    // Initial text set by setTimerState later

    // --- Controls Container --- 
    const controlsContainer = document.createElement("div");
    controlsContainer.classList.add("timer-controls");

    // Preset Duration Buttons Container
    const presetControls = document.createElement("div");
    presetControls.classList.add("preset-controls");

    // Custom Duration Input Container
    const customControls = document.createElement("div");
    customControls.classList.add("custom-controls");

    const customInput = document.createElement("input");
    customInput.type = "text"; // Use text to allow format like MM:SS
    customInput.placeholder = "MM:SS or Secs";
    customInput.classList.add("custom-duration-input");

    const setButton = document.createElement("button");
    setButton.textContent = "Set";
    setButton.classList.add("set-duration-button");

    // --- Store references --- 
    activeTimers[id] = {
        intervalId: null,
        widget: widget,
        display: timerDisplay,
        actionBtn: actionButton,
        controls: controlsContainer,
        duration: currentDuration,
        state: 'idle', // Initial state
        customInput: customInput // Add reference to custom input
    };

    // --- Action Button Logic ---
    actionButton.addEventListener("click", () => {
        const currentState = activeTimers[id]?.state;
        if (currentState === 'idle') {
            setTimerState(id, 'running');
            startTimer(id); // Start the timer process
        } else if (currentState === 'running') {
            stopTimer(id);
            setTimerState(id, 'idle'); // Go back to idle, keep selected duration
        } else if (currentState === 'finished') {
            stopTimer(id); // Ensure cleanup
            setTimerState(id, 'idle'); // Go back to idle, keep selected duration
        }
    });

    // --- Preset Buttons Logic ---
    const durationOptions = {
        '1m': 60,
        '5m': 300,
        '30m': 1800
    };

    Object.entries(durationOptions).forEach(([text, seconds]) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.dataset.seconds = seconds;
        if (seconds === currentDuration) {
            btn.classList.add('active');
        }
        btn.addEventListener("click", () => {
            stopTimer(id); // Stop any running timer
            setTimerState(id, 'idle', seconds); // Set to idle with new duration
            // Clear custom input when preset is clicked
            if (activeTimers[id]) activeTimers[id].customInput.value = ''; 
            // Update active class for presets
            presetControls.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // TODO: Save state if implemented
            // updateWidgetContent(id, JSON.stringify({ state: 'idle', duration: seconds }));
        });
        presetControls.appendChild(btn); // Add to preset container
    });

    // --- Custom Input Logic ---
    function parseCustomTime(inputString) {
        inputString = inputString.trim();
        if (/^\d+$/.test(inputString)) { // Only seconds
            return parseInt(inputString, 10);
        } else if (/^\d{1,2}:\d{1,2}$/.test(inputString)) { // MM:SS format
            const parts = inputString.split(':');
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            if (seconds >= 0 && seconds < 60) {
                return (minutes * 60) + seconds;
            }
        }
        return null; // Invalid format
    }

    setButton.addEventListener("click", () => {
        const customSeconds = parseCustomTime(customInput.value);
        if (customSeconds !== null && customSeconds > 0) {
            stopTimer(id);
            setTimerState(id, 'idle', customSeconds);
            // Deselect preset buttons
            presetControls.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            console.log(`[Timer Debug] Custom time set to: ${customSeconds}s`);
            // TODO: Save state if implemented
            // updateWidgetContent(id, JSON.stringify({ state: 'idle', duration: customSeconds }));
        } else {
            alert("Invalid time format. Use seconds (e.g., 90) or MM:SS (e.g., 1:30).");
            customInput.value = ''; // Clear invalid input
        }
    });
     // Allow setting with Enter key in the input field
    customInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            setButton.click();
        }
    });


    // --- Assemble Controls ---
    customControls.appendChild(customInput);
    customControls.appendChild(setButton);

    controlsContainer.appendChild(presetControls);
    controlsContainer.appendChild(customControls);

    // --- Append to Main Content ---
    contentContainer.appendChild(timerDisplay);
    contentContainer.appendChild(controlsContainer);
    contentContainer.appendChild(actionButton); // Action button below controls now

    // Set initial UI state
    setTimerState(id, 'idle');
}

// Cleanup function needs to delete the entry
export function cleanupTimer(widgetId) {
    stopTimer(widgetId); // Stop interval first
    delete activeTimers[widgetId]; // Delete the state entry
    console.log(`Cleaned up timer state for widget ${widgetId}`);
} 