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
        
        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.phaseDisplay = document.getElementById('phaseDisplay');
        this.currentRoundDisplay = document.getElementById('currentRound');
        this.totalRoundsDisplay = document.getElementById('totalRounds');
        this.progressFill = document.getElementById('progressFill');
        this.resetButton = document.getElementById('resetButton');
        this.timerContainer = document.querySelector('.timer-display');
        
        // Settings elements
        this.settingsToggle = document.getElementById('settingsToggle');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.roundsInput = document.getElementById('roundsInput');
        this.workTimeInput = document.getElementById('workTimeInput');
        this.restTimeInput = document.getElementById('restTimeInput');
        this.getReadyInput = document.getElementById('getReadyInput');
        this.applySettingsButton = document.getElementById('applySettings');
        this.resetToDefaultsButton = document.getElementById('resetToDefaults');
        
        // Display elements
        this.workoutDescription = document.getElementById('workoutDescription');
        
        // Bind event listeners
        this.bindEvents();
        
        // Load settings and initialize display
        this.loadSettings();
        this.updateWorkoutInfo();
        this.updateDisplay();
    }
    
    bindEvents() {
        this.timerContainer.addEventListener('click', () => this.togglePlayPause());
        this.resetButton.addEventListener('click', () => this.reset());
        
        // Settings events
        this.settingsToggle.addEventListener('click', () => this.toggleSettings());
        this.applySettingsButton.addEventListener('click', () => this.applySettings());
        this.resetToDefaultsButton.addEventListener('click', () => this.resetToDefaults());
        
        // Real-time validation for inputs
        const inputs = [this.roundsInput, this.workTimeInput, this.restTimeInput, this.getReadyInput].filter(input => input);
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateInput(input));
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
            this.getReadyTime = settings.getReadyTime || this.defaultConfig.getReadyTime;
        }
        
        // Update input values - check if elements exist first
        if (this.roundsInput) this.roundsInput.value = this.totalRounds;
        if (this.workTimeInput) this.workTimeInput.value = this.workTime;
        if (this.restTimeInput) this.restTimeInput.value = this.restTime;
        if (this.getReadyInput) {
            this.getReadyInput.value = this.getReadyTime;
        }
    }
    
    saveSettings() {
        const settings = {
            workTime: this.workTime,
            restTime: this.restTime,
            totalRounds: this.totalRounds,
            getReadyTime: this.getReadyTime
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
        const newGetReadyTime = this.getReadyInput ? parseInt(this.getReadyInput.value) : this.defaultConfig.getReadyTime;
        
        // Apply new settings
        this.totalRounds = newRounds;
        this.workTime = newWorkTime;
        this.restTime = newRestTime;
        this.getReadyTime = newGetReadyTime;
        
        // Save to localStorage
        this.saveSettings();
        
        // Update displays
        this.updateWorkoutInfo();
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
        if (this.getReadyInput) {
            this.getReadyInput.value = this.defaultConfig.getReadyTime;
        }
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
    
    updateWorkoutInfo() {
        // Update workout description with new format
        const totalTime = this.totalRounds * (this.workTime + this.restTime);
        this.workoutDescription.innerHTML = `<strong>${this.totalRounds}</strong> rounds × (<strong>${this.workTime}</strong>s work + <strong>${this.restTime}</strong>s rest) = <strong>${totalTime}</strong>s of 🔥`;
        
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
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
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
            
            this.updateDisplay();
        }
    }
    
    reset() {
        // Stop timer
        this.isRunning = false;
        this.isPaused = false;
        clearInterval(this.timerInterval);
        
        // Reset state
        this.currentRound = 0;
        this.currentTime = 0;
        this.isWorkPhase = true;
        this.isGetReadyPhase = false;
        
        // Reset visual state
        this.timerContainer.classList.remove('work', 'rest', 'get-ready');
        
        this.updateDisplay();
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
            // Work phase complete, switch to rest
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
            
            // Animate round completion
            this.animateRoundComplete();
        }
    }
    
    completeWorkout() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        
        // Show completion
        this.phaseDisplay.textContent = 'Workout Complete!';
        this.timeDisplay.textContent = '🎉';
        this.timerContainer.classList.remove('work', 'rest', 'get-ready');
        this.timerContainer.classList.add('complete');
        
        this.playBeep(3); // Triple beep for completion
        
        // Auto-reset after 3 seconds
        setTimeout(() => {
            this.reset();
        }, 3000);
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
            } else if (this.isWorkPhase) {
                this.phaseDisplay.textContent = 'WORK';
                this.timerContainer.classList.remove('rest', 'get-ready');
                this.timerContainer.classList.add('work');
            } else {
                this.phaseDisplay.textContent = 'REST';
                this.timerContainer.classList.remove('work', 'get-ready');
                this.timerContainer.classList.add('rest');
            }
            
            if (this.isPaused) {
                this.phaseDisplay.textContent += ' (PAUSED)';
            }
        } else {
            this.phaseDisplay.textContent = 'Press to start';
            this.timerContainer.classList.remove('work', 'rest', 'complete', 'get-ready');
            this.timeDisplay.textContent = '00:00';
        }
        
        // Update round display
        this.currentRoundDisplay.textContent = this.currentRound;
        
        // Update progress bar
        this.updateProgressBar();
    }
    
    updateProgressBar() {
        if (!this.isRunning && !this.isPaused) {
            this.progressFill.style.width = '0%';
            return;
        }
        
        const totalWorkoutTime = this.totalRounds * (this.workTime + this.restTime);
        const completedRounds = this.currentRound - 1;
        const completedTime = completedRounds * (this.workTime + this.restTime);
        
        let currentPhaseTime = 0;
        if (this.isWorkPhase) {
            currentPhaseTime = this.workTime - this.currentTime;
        } else {
            currentPhaseTime = this.workTime + (this.restTime - this.currentTime);
        }
        
        const totalElapsedTime = completedTime + currentPhaseTime;
        const progressPercent = (totalElapsedTime / totalWorkoutTime) * 100;
        
        this.progressFill.style.width = `${Math.min(progressPercent, 100)}%`;
    }
    
    animateRoundComplete() {
        this.currentRoundDisplay.parentElement.classList.add('round-complete');
        setTimeout(() => {
            this.currentRoundDisplay.parentElement.classList.remove('round-complete');
        }, 600);
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
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TabataTimer();
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
            document.getElementById('playPauseButton').click();
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            document.getElementById('resetButton').click();
        }
    });
    
    // Add a small instruction for keyboard shortcuts
    const container = document.querySelector('.container');
    const shortcuts = document.createElement('div');
    shortcuts.style.cssText = `
        margin-top: 1rem; 
        font-size: 0.8rem; 
        color: #666; 
        text-align: center;
    `;
    shortcuts.innerHTML = 'Press <strong>Space</strong> to start/pause • Press <strong>R</strong> to reset';
    container.appendChild(shortcuts);
});