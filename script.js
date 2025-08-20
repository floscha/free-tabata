class TabataTimer {
    constructor() {
        // Timer configuration
        this.workTime = 20; // seconds
        this.restTime = 10; // seconds
        this.totalRounds = 8;
        
        // Timer state
        this.currentRound = 0;
        this.currentTime = 0;
        this.isRunning = false;
        this.isPaused = false;
        this.isWorkPhase = true;
        this.timerInterval = null;
        
        // DOM elements
        this.timeDisplay = document.getElementById('timeDisplay');
        this.phaseDisplay = document.getElementById('phaseDisplay');
        this.currentRoundDisplay = document.getElementById('currentRound');
        this.progressFill = document.getElementById('progressFill');
        this.startButton = document.getElementById('startButton');
        this.pauseButton = document.getElementById('pauseButton');
        this.resetButton = document.getElementById('resetButton');
        this.timerContainer = document.querySelector('.timer-display');
        
        // Bind event listeners
        this.bindEvents();
        
        // Initialize display
        this.updateDisplay();
    }
    
    bindEvents() {
        this.startButton.addEventListener('click', () => this.start());
        this.pauseButton.addEventListener('click', () => this.pause());
        this.resetButton.addEventListener('click', () => this.reset());
    }
    
    start() {
        if (!this.isRunning && !this.isPaused) {
            // Starting fresh workout
            this.currentRound = 1;
            this.currentTime = this.workTime;
            this.isWorkPhase = true;
        }
        
        this.isRunning = true;
        this.isPaused = false;
        
        // Update button states
        this.startButton.disabled = true;
        this.pauseButton.disabled = false;
        
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
            
            // Update button states
            this.startButton.disabled = false;
            this.pauseButton.disabled = true;
            this.startButton.textContent = 'Resume';
            
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
        
        // Reset button states
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.startButton.textContent = 'Start Workout';
        
        // Reset visual state
        this.timerContainer.classList.remove('work', 'rest');
        
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
        if (this.isWorkPhase) {
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
        
        // Reset button states
        this.startButton.disabled = false;
        this.pauseButton.disabled = true;
        this.startButton.textContent = 'Start Workout';
        
        // Show completion
        this.phaseDisplay.textContent = 'Workout Complete!';
        this.timeDisplay.textContent = '🎉';
        this.timerContainer.classList.remove('work', 'rest');
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
            if (this.isWorkPhase) {
                this.phaseDisplay.textContent = 'WORK';
                this.timerContainer.classList.remove('rest');
                this.timerContainer.classList.add('work');
            } else {
                this.phaseDisplay.textContent = 'REST';
                this.timerContainer.classList.remove('work');
                this.timerContainer.classList.add('rest');
            }
            
            if (this.isPaused) {
                this.phaseDisplay.textContent += ' (PAUSED)';
            }
        } else {
            this.phaseDisplay.textContent = 'Ready to start';
            this.timerContainer.classList.remove('work', 'rest', 'complete');
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
            const startButton = document.getElementById('startButton');
            const pauseButton = document.getElementById('pauseButton');
            
            if (!startButton.disabled) {
                startButton.click();
            } else if (!pauseButton.disabled) {
                pauseButton.click();
            }
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