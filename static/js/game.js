class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.lanes = [this.canvas.width * 0.25, this.canvas.width * 0.5, this.canvas.width * 0.75];
        this.currentLane = 1;
        this.particles = new ParticleSystem(this.canvas, this.ctx);

        this.player = {
            x: this.lanes[1],
            y: this.canvas.height - 100,
            width: 40,
            height: 40
        };

        this.obstacles = [];
        this.powerups = [];
        this.score = 0;
        this.baseSpeed = 5;
        this.speedMultiplier = 1;
        this.gameOver = false;
        this.hasShield = false;
        this.neonIntensity = 0;
        this.achievementLevels = [10, 100, 500, 1000, 2000, 5000];
        this.nextAchievementIndex = 0;

        this.highScore = localStorage.getItem('highScore') || 0;
        document.getElementById('high-score-value').textContent = this.highScore;

        this.setupControls();
        this.gameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.lanes = [this.canvas.width * 0.25, this.canvas.width * 0.5, this.canvas.width * 0.75];
        if (this.player) {
            this.player.x = this.lanes[this.currentLane];
            this.player.y = this.canvas.height - 100;
        }
    }

    showAchievement(score) {
        const achievementPopup = document.getElementById('achievement-popup');
        const achievementText = achievementPopup.querySelector('.achievement-text');
        achievementText.textContent = `Score ${score} reached! 🎉`;
        achievementPopup.classList.remove('hidden');

        // Create celebratory particles
        for (let i = 0; i < 50; i++) {
            this.particles.emit(
                Math.random() * this.canvas.width,
                Math.random() * this.canvas.height,
                `hsl(${Math.random() * 360}, 100%, 50%)`,
                15
            );
        }

        setTimeout(() => {
            achievementPopup.classList.add('hidden');
        }, 3000);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            if (e.key === 'ArrowLeft' || e.key === 'a') this.movePlayer(-1);
            if (e.key === 'ArrowRight' || e.key === 'd') this.movePlayer(1);
        });

        let touchStartX = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.gameOver) return;
            const touchEndX = e.changedTouches[0].clientX;
            const diff = touchEndX - touchStartX;
            if (Math.abs(diff) > 30) {
                this.movePlayer(diff > 0 ? 1 : -1);
            }
        });

        document.getElementById('retry-button').addEventListener('click', () => this.restart());
    }

    movePlayer(direction) {
        const newLane = this.currentLane + direction;
        if (newLane >= 0 && newLane < 3) {
            this.currentLane = newLane;
            this.audio.play('move');
            this.particles.emit(this.player.x, this.player.y, '#0ff', 5);
        }
    }

    spawnObstacle() {
        const spawnChance = 0.02 * this.speedMultiplier;
        if (Math.random() < spawnChance) {
            const lane = Math.floor(Math.random() * 3);
            this.obstacles.push({
                x: this.lanes[lane],
                y: -30,
                width: 30,
                height: 30,
                lane: lane
            });
        }
    }

    spawnPowerup() {
        if (Math.random() < 0.005) {
            const lane = Math.floor(Math.random() * 3);
            this.powerups.push({
                x: this.lanes[lane],
                y: -30,
                width: 20,
                height: 20,
                lane: lane,
                type: Math.random() < 0.5 ? 'shield' : 'speed'
            });
        }
    }

    checkCollisions() {
        for (const obstacle of this.obstacles) {
            if (this.checkCollision(this.player, obstacle)) {
                if (!this.hasShield) {
                    this.audio.play('crash');
                    this.gameOver = true;
                    this.showGameOver();
                } else {
                    this.hasShield = false;
                    this.obstacles = this.obstacles.filter(o => o !== obstacle);
                    // Create explosion effect
                    for (let i = 0; i < 20; i++) {
                        this.particles.emit(obstacle.x, obstacle.y, '#f00', 10);
                    }
                }
            }
        }

        for (const powerup of this.powerups) {
            if (this.checkCollision(this.player, powerup)) {
                this.audio.play('powerup');
                if (powerup.type === 'shield') {
                    this.hasShield = true;
                } else if (powerup.type === 'speed') {
                    this.speedMultiplier *= 1.5;
                    setTimeout(() => this.speedMultiplier /= 1.5, 3000);
                }
                this.powerups = this.powerups.filter(p => p !== powerup);
                // Create collection effect
                for (let i = 0; i < 15; i++) {
                    this.particles.emit(powerup.x, powerup.y, powerup.type === 'shield' ? '#ff0' : '#0f0', 8);
                }
            }
        }
    }

    checkCollision(a, b) {
        return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
               Math.abs(a.y - b.y) < (a.height + b.height) / 2;
    }

    showGameOver() {
        document.getElementById('game-over').classList.remove('hidden');
        document.getElementById('final-score').textContent = Math.floor(this.score);
        if (this.score > this.highScore) {
            this.highScore = Math.floor(this.score);
            localStorage.setItem('highScore', this.highScore);
            document.getElementById('best-score').textContent = this.highScore;
        }
    }

    restart() {
        this.obstacles = [];
        this.powerups = [];
        this.score = 0;
        this.baseSpeed = 5;
        this.speedMultiplier = 1;
        this.gameOver = false;
        this.hasShield = false;
        this.currentLane = 1;
        this.nextAchievementIndex = 0;
        this.neonIntensity = 0;
        document.getElementById('game-over').classList.add('hidden');
    }

    update() {
        if (this.gameOver) return;

        // Smooth player movement
        this.player.x += (this.lanes[this.currentLane] - this.player.x) * 0.2;

        this.score += 0.1 * this.speedMultiplier;
        this.baseSpeed += 0.001;

        // Check achievements
        if (this.nextAchievementIndex < this.achievementLevels.length &&
            this.score >= this.achievementLevels[this.nextAchievementIndex]) {
            this.showAchievement(this.achievementLevels[this.nextAchievementIndex]);
            this.nextAchievementIndex++;
        }

        // Update neon intensity based on speed
        this.neonIntensity = Math.sin(Date.now() * 0.003) * 5 + (this.speedMultiplier * 5);

        document.getElementById('score-value').textContent = Math.floor(this.score);

        this.spawnObstacle();
        this.spawnPowerup();

        const currentSpeed = this.baseSpeed * this.speedMultiplier;
        this.obstacles.forEach(obstacle => obstacle.y += currentSpeed);
        this.powerups.forEach(powerup => powerup.y += currentSpeed);

        this.obstacles = this.obstacles.filter(obstacle => obstacle.y < this.canvas.height);
        this.powerups = this.powerups.filter(powerup => powerup.y < this.canvas.height);

        this.particles.update();
        this.checkCollisions();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lanes with dynamic glow
        this.ctx.strokeStyle = '#0ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10 + this.neonIntensity;
        this.ctx.shadowColor = '#0ff';

        this.lanes.forEach(x => {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        });

        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;

        // Draw player with dynamic glow
        this.ctx.fillStyle = this.hasShield ? '#ff0' : '#0ff';
        this.ctx.shadowBlur = 15 + this.neonIntensity;
        this.ctx.shadowColor = this.hasShield ? '#ff0' : '#0ff';

        this.ctx.beginPath();
        this.ctx.arc(this.player.x, this.player.y, this.player.width/2, 0, Math.PI * 2);
        this.ctx.fill();

        if (this.hasShield) {
            this.ctx.strokeStyle = '#ff0';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.width/2 + 5, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw obstacles with dynamic glow
        this.ctx.shadowBlur = 10 + this.neonIntensity;
        this.obstacles.forEach(obstacle => {
            this.ctx.fillStyle = '#f00';
            this.ctx.shadowColor = '#f00';
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw powerups with dynamic glow
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.type === 'shield' ? '#ff0' : '#0f0';
            this.ctx.shadowColor = powerup.type === 'shield' ? '#ff0' : '#0f0';
            this.ctx.shadowBlur = 10 + this.neonIntensity;
            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, powerup.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw particles
        this.particles.draw();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    new Game();
});