class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new AudioManager();

        // Set initial canvas size
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
        this.speed = 5;
        this.gameOver = false;
        this.hasShield = false;
        this.isGameStarted = false;

        this.highScore = localStorage.getItem('highScore') || 0;
        document.getElementById('high-score-value').textContent = this.highScore;

        this.setupControls();
        this.startGame();
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

    startGame() {
        this.isGameStarted = true;
        this.gameLoop();
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
        if (Math.random() < 0.02) {
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
                }
            }
        }

        for (const powerup of this.powerups) {
            if (this.checkCollision(this.player, powerup)) {
                this.audio.play('powerup');
                if (powerup.type === 'shield') {
                    this.hasShield = true;
                } else if (powerup.type === 'speed') {
                    this.speed *= 1.5;
                    setTimeout(() => this.speed /= 1.5, 3000);
                }
                this.powerups = this.powerups.filter(p => p !== powerup);
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
        this.speed = 5;
        this.gameOver = false;
        this.hasShield = false;
        this.currentLane = 1;
        this.player.x = this.lanes[this.currentLane];
        document.getElementById('game-over').classList.add('hidden');
    }

    update() {
        if (this.gameOver) return;

        // Smooth player movement
        this.player.x += (this.lanes[this.currentLane] - this.player.x) * 0.2;

        this.score += 0.1;
        this.speed += 0.001;

        document.getElementById('score-value').textContent = Math.floor(this.score);

        this.spawnObstacle();
        this.spawnPowerup();

        // Update positions
        this.obstacles.forEach(obstacle => obstacle.y += this.speed);
        this.powerups.forEach(powerup => powerup.y += this.speed);

        // Clean up off-screen objects
        this.obstacles = this.obstacles.filter(obstacle => obstacle.y < this.canvas.height);
        this.powerups = this.powerups.filter(powerup => powerup.y < this.canvas.height);

        this.particles.update();
        this.checkCollisions();
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw lanes with glow effect
        this.ctx.strokeStyle = '#0ff';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#0ff';

        this.lanes.forEach(x => {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        });

        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;

        // Draw player with glow
        this.ctx.fillStyle = this.hasShield ? '#ff0' : '#0ff';
        this.ctx.shadowBlur = 15;
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

        // Reset shadow for other elements
        this.ctx.shadowBlur = 0;

        // Draw obstacles with glow
        this.ctx.fillStyle = '#f00';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#f00';

        this.obstacles.forEach(obstacle => {
            this.ctx.beginPath();
            this.ctx.arc(obstacle.x, obstacle.y, obstacle.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw powerups with glow
        this.powerups.forEach(powerup => {
            this.ctx.fillStyle = powerup.type === 'shield' ? '#ff0' : '#0f0';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = powerup.type === 'shield' ? '#ff0' : '#0f0';

            this.ctx.beginPath();
            this.ctx.arc(powerup.x, powerup.y, powerup.width/2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Draw particles
        this.particles.draw();
    }

    gameLoop() {
        if (!this.isGameStarted) return;

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when window loads
window.addEventListener('load', () => {
    new Game();
});