class TabataTimer {
    constructor() {
        // Default timer configuration
        this.defaultConfig = {
            workTime: 20,
            restTime: 10,
            totalRounds: 8,
            getReadyTime: 10
        };
        
        // Timer configuration (will be loaded from settings)
        this.workTime = this.defaultConfig.workTime;
        this.restTime = this.defaultConfig.restTime;
        this.totalRounds = this.defaultConfig.totalRounds;
        this.getReadyTime = this.defaultConfig.getReadyTime;
        
        // Timer state
        this.currentRound = 0;
        this.currentTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkPhase = true;
        this.isGetReadyPhase = false;
        this.timerInterval = null;
        this.hasBeenStarted = false; // Track if timer has ever been started
        this.wakeLock = null; // For preventing screen sleep
        
        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.phaseDisplay = document.getElementById('phaseDisplay');
        this.currentRoundDisplay = document.getElementById('currentRound');
        this.totalRoundsDisplay = document.getElementById('totalRounds');
        this.timerContainer = document.querySelector('.timer-display');
        this.roundBoxes = document.getElementById('roundBoxes');
        
        // Settings elements
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.roundsInput = document.getElementById('roundsInput');
        this.workTimeInput = document.getElementById('workTimeInput');
        this.restTimeInput = document.getElementById('restTimeInput');
        this.applySettingsButton = document.getElementById('applySettings');
        this.resetToDefaultsButton = document.getElementById('resetToDefaults');
        
        // Display elements
        this.workoutDescription = document.getElementById('workoutDescription');
        
        // Bind event listeners
        this.bindEvents();
        
        // Load settings and initialize display
        this.loadSettings();
        this.updateWorkoutInfo();
        this.generateRoundBoxes();
        this.updateDisplay();
    }
    
    bindEvents() {
        // Handle single click vs double click on timer
        let clickTimeout;
        this.timerContainer.addEventListener('click', (e) => {
            if (clickTimeout) {
                // Double click detected - reset timer
                clearTimeout(clickTimeout);
                clickTimeout = null;
                this.reset();
            } else {
                // Single click - start/pause after delay to detect double click
                clickTimeout = setTimeout(() => {
                    clickTimeout = null;
                    this.togglePlayPause();
                }, 250);
            }
        });
        
        // Settings events
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.applySettingsButton.addEventListener('click', () => this.applySettings());
        this.resetToDefaultsButton.addEventListener('click', () => this.resetToDefaults());
        
        // Real-time validation for inputs
        const inputs = [this.roundsInput, this.workTimeInput, this.restTimeInput].filter(input => input);
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.validateInput(input);
                this.updateWorkoutInfoPreview();
            });
        });
    }
    
    loadSettings() {
        // Load settings from localStorage or use defaults
        const savedSettings = localStorage.getItem('tabataSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.workTime = settings.workTime || this.defaultConfig.workTime;
            this.restTime = settings.restTime || this.defaultConfig.restTime;
            this.totalRounds = settings.totalRounds || this.defaultConfig.totalRounds;
            this.getReadyTime = this.restTime; // Use rest time for get ready
        }
        
        // Update input values - check if elements exist first
        if (this.roundsInput) this.roundsInput.value = this.totalRounds;
        if (this.workTimeInput) this.workTimeInput.value = this.workTime;
        if (this.restTimeInput) this.restTimeInput.value = this.restTime;
    }
    
    saveSettings() {
        const settings = {
            workTime: this.workTime,
            restTime: this.restTime,
            totalRounds: this.totalRounds
        };
        localStorage.setItem('tabataSettings', JSON.stringify(settings));
    }
    
    toggleSettings() {
        this.settingsPanel.classList.toggle('show');
    }
    
    validateInput(input) {
        const value = parseInt(input.value);
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        
        if (value < min) {
            input.value = min;
        } else if (value > max) {
            input.value = max;
        }
    }
    
    updateWorkoutInfoPreview() {
        // Update workout description preview based on current input values
        const rounds = parseInt(this.roundsInput.value) || this.defaultConfig.totalRounds;
        const workTime = parseInt(this.workTimeInput.value) || this.defaultConfig.workTime;
        const restTime = parseInt(this.restTimeInput.value) || this.defaultConfig.restTime;
        const totalTime = rounds * (workTime + restTime);
        
        this.workoutDescription.innerHTML = `<strong>${rounds}</strong> rounds × (<strong>${workTime}</strong>s work + <strong>${restTime}</strong>s rest) = <strong>${totalTime}</strong>s`;
    }
    
    applySettings() {
        // Prevent applying settings while timer is running
        if (this.isRunning) {
            alert('Please pause or reset the timer before changing settings.');
            return;
        }
        
        // Get and validate values
        const newRounds = parseInt(this.roundsInput.value);
        const newWorkTime = parseInt(this.workTimeInput.value);
        const newRestTime = parseInt(this.restTimeInput.value);
        
        // Apply new settings
        this.totalRounds = newRounds;
        this.workTime = newWorkTime;
        this.restTime = newRestTime;
        this.getReadyTime = newRestTime; // Use rest time for get ready countdown
        
        // Save to localStorage
        this.saveSettings();
        
        // Update displays
        this.updateWorkoutInfo();
        this.generateRoundBoxes();
        this.reset(); // Reset timer with new settings
        
        // Hide settings panel
        this.settingsPanel.classList.remove('show');
        
        // Show confirmation
        this.showNotification('Settings applied!');
    }
    
    resetToDefaults() {
        this.roundsInput.value = this.defaultConfig.totalRounds;
        this.workTimeInput.value = this.defaultConfig.workTime;
        this.restTimeInput.value = this.defaultConfig.restTime;
        this.updateWorkoutInfoPreview();
    }
    
    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 0.8rem 1.2rem;
            border-radius: 8px;
            z-index: 1000;
            font-weight: bold;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 2000);
    }
    
    // Generate round progress boxes
    generateRoundBoxes() {
        if (!this.roundBoxes) return;
        
        // Clear existing boxes
        this.roundBoxes.innerHTML = '';
        
        // Create boxes for each round
        for (let i = 1; i <= this.totalRounds; i++) {
            const box = document.createElement('div');
            box.className = 'round-box';
            box.setAttribute('data-round', i);
            this.roundBoxes.appendChild(box);
        }
        
        this.updateRoundBoxes();
    }
    
    // Update round boxes visual state
    updateRoundBoxes() {
        if (!this.roundBoxes) return;
        
        const boxes = this.roundBoxes.querySelectorAll('.round-box');
        const isWorkoutComplete = this.timerContainer.classList.contains('complete');
        
        boxes.forEach((box, index) => {
            const roundNumber = index + 1;
            box.classList.remove('completed', 'current', 'rest');
            
            if (isWorkoutComplete || roundNumber < this.currentRound) {
                // Round is completely finished or workout is complete
                box.classList.add('completed');
            } else if (roundNumber === this.currentRound && this.currentRound > 0) {
                // Current round in progress
                box.classList.add('current');
                
                // Add rest class if in rest phase
                if (!this.isWorkPhase && !this.isGetReadyPhase) {
                    box.classList.add('rest');
                }
            }
            // Otherwise, box remains in default state (upcoming round)
        });
    }
    
    updateWorkoutInfo() {
        // Update workout description with new format
        const totalTime = this.totalRounds * (this.workTime + this.restTime);
        this.workoutDescription.innerHTML = `<strong>${this.totalRounds}</strong> rounds × (<strong>${this.workTime}</strong>s work + <strong>${this.restTime}</strong>s rest) = <strong>${totalTime}</strong>s`;
        
        // Update total rounds display
        this.totalRoundsDisplay.textContent = `/ ${this.totalRounds}`;
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    togglePlayPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }
    
    start() {
        if (!this.isRunning && !this.isPaused) {
            // Starting fresh workout with get ready phase
            this.currentRound = 0; // Start at 0 for get ready
            this.currentTime = this.getReadyTime;
            this.isGetReadyPhase = true;
            this.isWorkPhase = false; // Will be set to true after get ready
            this.hasBeenStarted = true; // Mark that timer has been started
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Prevent screen from sleeping while timer is running
        this.requestWakeLock();
        
        // Start the timer
        this.timerInterval = setInterval(() => this.tick(), 1000);
        
        this.updateDisplay();
        this.playBeep(); // Start signal
    }
    
    pause() {
        if (this.isRunning) {
            this.isRunning = false;
            this.isPaused = true;
            clearInterval(this.timerInterval);
            
            // Release wake lock when paused
            this.releaseWakeLock();
            
            this.updateDisplay();
        }
    }
    
    reset() {
        // Stop timer
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        
        // Release wake lock when reset
        this.releaseWakeLock();
        
        // Reset state
        this.currentRound = 0;
        this.currentTime = 0;
        this.isWorkPhase = true;
        this.isGetReadyPhase = false;
        this.hasBeenStarted = false; // Reset the started flag
        
        // Reset visual state
        this.timerContainer.classList.remove('work', 'rest', 'get-ready', 'complete');
        document.body.classList.remove('work-phase', 'rest-phase', 'get-ready-phase', 'complete-phase');
        
        this.updateDisplay();
        this.updateRoundBoxes();
    }
    
    tick() {
        this.currentTime--;
        
        if (this.currentTime <= 0) {
            this.handlePhaseComplete();
        }
        
        this.updateDisplay();
    }
    
    handlePhaseComplete() {
        if (this.isGetReadyPhase) {
            // Get ready phase complete, start first work phase
            this.isGetReadyPhase = false;
            this.currentRound = 1;
            this.isWorkPhase = true;
            this.currentTime = this.workTime;
            this.playBeep(); // Single beep for work start
        } else if (this.isWorkPhase) {
            // Work phase complete, check if this was the last round
            if (this.currentRound >= this.totalRounds) {
                // Last work phase complete - go directly to workout completion
                this.completeWorkout();
                return;
            }
            
            // Not the last round - switch to rest
            this.isWorkPhase = false;
            this.currentTime = this.restTime;
            this.playBeep(2); // Double beep for rest
        } else {
            // Rest phase complete, check if workout is done
            if (this.currentRound >= this.totalRounds) {
                this.completeWorkout();
                return;
            }
            
            // Move to next round
            this.currentRound++;
            this.isWorkPhase = true;
            this.currentTime = this.workTime;
            this.playBeep(); // Single beep for work
        }
    }
    
    completeWorkout() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        // Release wake lock when workout completes
        this.releaseWakeLock();
        
        // Show completion with celebration
        this.phaseDisplay.innerHTML = 'Workout Complete!';
        this.timeDisplay.textContent = 'Congratulations!';
        this.timerContainer.classList.remove('work', 'rest', 'get-ready');
        this.timerContainer.classList.add('complete');
        
        // Add purple background for completion
        document.body.classList.remove('work-phase', 'rest-phase', 'get-ready-phase');
        document.body.classList.add('complete-phase');
        
        // Update round boxes to mark all rounds as completed
        this.updateRoundBoxes();
        
        // Add confetti animation
        this.createConfetti();
        
        this.playBeep(3); // Triple beep for completion
        
        // Auto-reset after 5 seconds (longer to enjoy the celebration)
        setTimeout(() => {
            this.reset();
        }, 5000);
    }
    
    updateDisplay() {
        // Update time display
        if (this.currentTime > 0) {
            const minutes = Math.floor(this.currentTime / 60);
            const seconds = this.currentTime % 60;
            this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        // Update phase display
        if (this.isRunning || this.isPaused) {
            if (this.isGetReadyPhase) {
                this.phaseDisplay.textContent = 'GET READY';
                this.timerContainer.classList.remove('work', 'rest');
                this.timerContainer.classList.add('get-ready');
                document.body.classList.remove('work-phase', 'rest-phase');
                document.body.classList.add('get-ready-phase');
            } else if (this.isWorkPhase) {
                this.phaseDisplay.textContent = 'WORK';
                this.timerContainer.classList.remove('rest', 'get-ready');
                this.timerContainer.classList.add('work');
                document.body.classList.remove('rest-phase', 'get-ready-phase');
                document.body.classList.add('work-phase');
            } else {
                this.phaseDisplay.textContent = 'REST';
                this.timerContainer.classList.remove('work', 'get-ready');
                this.timerContainer.classList.add('rest');
                document.body.classList.remove('work-phase', 'get-ready-phase');
                document.body.classList.add('rest-phase');
            }
            
            if (this.isPaused) {
                this.phaseDisplay.textContent += ' (PAUSED)';
                // Add visual hint for double-click to reset (only if timer has been started)
                if (this.hasBeenStarted) {
                    this.phaseDisplay.innerHTML += '<br><small style="opacity: 0.7; font-size: 0.7em;">Double-click to reset</small>';
                }
            }
        } else {
            // Check if we're in completion state - don't override the congratulations message
            if (!this.timerContainer.classList.contains('complete')) {
                if (this.hasBeenStarted) {
                    this.phaseDisplay.innerHTML = 'Click to start<br><small style="opacity: 0.7; font-size: 0.7em;">Double-click to reset</small>';
                } else {
                    this.phaseDisplay.innerHTML = 'Click to start';
                }
                this.timerContainer.classList.remove('work', 'rest', 'complete', 'get-ready');
                document.body.classList.remove('work-phase', 'rest-phase', 'get-ready-phase', 'complete-phase');
                this.timeDisplay.textContent = '00:00';
            }
        }
        
        // Update round display
        this.currentRoundDisplay.textContent = this.currentRound;
        
        // Apply active class only when round is greater than 0
        if (this.currentRound > 0) {
            this.currentRoundDisplay.classList.add('active');
        } else {
            this.currentRoundDisplay.classList.remove('active');
        }
        
        // Update round boxes
        this.updateRoundBoxes();
    }
    
    playBeep(count = 1) {
        // Create audio context for beep sounds
        if (typeof(AudioContext) !== "undefined" || typeof(webkitAudioContext) !== "undefined") {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.value = count === 2 ? 800 : 1000; // Different pitch for rest
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                }, i * 200);
            }
        }
    }
    
    // Create confetti animation for celebration
    createConfetti() {
        const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#ff9800', '#9c27b0', '#4caf50'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '1000';
        
        document.body.appendChild(confettiContainer);
        
        // Create multiple confetti pieces
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.style.position = 'absolute';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '100%';
            confetti.style.borderRadius = '50%';
            confetti.style.animation = `confetti ${2 + Math.random() * 3}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            
            confettiContainer.appendChild(confetti);
        }
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confettiContainer.parentNode) {
                confettiContainer.parentNode.removeChild(confettiContainer);
            }
        }, 6000);
    }
    
    // Wake Lock methods to prevent screen sleep during workouts
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Screen wake lock activated');
                
                // Listen for wake lock release (e.g., when tab becomes hidden)
                this.wakeLock.addEventListener('release', () => {
                    console.log('Screen wake lock released');
                });
            } else {
                console.log('Screen Wake Lock API not supported');
                // Fallback: try to keep screen active with a hidden video element
                this.createFallbackWakeLock();
            }
        } catch (err) {
            console.log('Failed to activate screen wake lock:', err);
            // Fallback method
            this.createFallbackWakeLock();
        }
    }
    
    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
            console.log('Screen wake lock manually released');
        }
        
        // Clean up fallback if used
        if (this.fallbackVideo) {
            this.fallbackVideo.pause();
            this.fallbackVideo.remove();
            this.fallbackVideo = null;
        }
    }
    
    // Fallback method for browsers that don't support Wake Lock API
    createFallbackWakeLock() {
        try {
            // Create a tiny, silent video that plays in loop to prevent sleep
            this.fallbackVideo = document.createElement('video');
            this.fallbackVideo.setAttribute('muted', '');
            this.fallbackVideo.setAttribute('playsinline', '');
            this.fallbackVideo.setAttribute('loop', '');
            this.fallbackVideo.style.position = 'fixed';
            this.fallbackVideo.style.opacity = '0';
            this.fallbackVideo.style.pointerEvents = 'none';
            this.fallbackVideo.style.width = '1px';
            this.fallbackVideo.style.height = '1px';
            this.fallbackVideo.style.top = '-1px';
            this.fallbackVideo.style.left = '-1px';
            
            // Create a minimal video data URL (1x1 pixel, 1 second)
            this.fallbackVideo.src = 'data:video/mp4;base64,AAAAHGZ0eXBpc29tAAACAGlzb21pc28ybXA0MQAAAAhmcmVlAAAAKG1kYXQAAAAgAQAAAAAAAAAgAAAAAAAAAAgAAAAAAAAAGBgYGBgYGBgYGBgYGBgYGBgY';
            
            document.body.appendChild(this.fallbackVideo);
            this.fallbackVideo.play().catch(() => {
                console.log('Fallback wake lock video failed to play');
            });
            
            console.log('Fallback wake lock method activated');
        } catch (err) {
            console.log('Fallback wake lock method failed:', err);
        }
    }
}

// Initialize the timer when the page loads
let timerInstance;
document.addEventListener('DOMContentLoaded', () => {
    timerInstance = new TabataTimer();
});

// Add some visual feedback for better UX
document.addEventListener('DOMContentLoaded', () => {
    // Add click animation to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            if (timerInstance) {
                timerInstance.togglePlayPause();
            }
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            if (timerInstance) {
                timerInstance.reset();
            }
        }
    });
    
    // Add a small instruction for keyboard shortcuts
    const container = document.querySelector('.container');
    const footer = document.querySelector('.attribution');
    const shortcuts = document.createElement('div');
    shortcuts.className = 'shortcuts';
    shortcuts.innerHTML = 'Press <strong>Space</strong> to start/pause • Press <strong>R</strong> to reset';
    container.insertBefore(shortcuts, footer);
});