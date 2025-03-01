class AudioManager {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {};
        this.initSounds();
    }

    async initSounds() {
        // Create oscillator-based sound effects
        this.sounds.move = () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.frequency.setValueAtTime(600, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        };

        this.sounds.crash = () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.frequency.setValueAtTime(200, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.3);
        };

        this.sounds.powerup = () => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.frequency.setValueAtTime(400, this.context.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, this.context.currentTime + 0.1);
            gain.gain.setValueAtTime(0.2, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.1);
        };
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }
}
