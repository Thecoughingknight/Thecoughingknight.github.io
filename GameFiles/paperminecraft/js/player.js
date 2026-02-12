class Player {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.vY = 0; // Vertical velocity
        this.speed = 4;
        this.gravity = 0.5;
    }

    update(keys, world) {
        // Horizontal Movement
        if (keys['ArrowLeft'] || keys['a']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['d']) this.x += this.speed;

        // Gravity and Floor Collision (Simple)
        this.vY += this.gravity;
        this.y += this.vY;

        let floorY = 10 * world.tileSize - this.size;
        if (this.y > floorY) {
            this.y = floorY;
            this.vY = 0;
            if (keys['ArrowUp'] || keys['w']) this.vY = -10; // Jump
        }
    }

    draw(ctx) {
        ctx.fillStyle = "#e74c3c"; // Red player
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}
