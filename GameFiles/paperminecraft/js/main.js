/**
 * main.js - The Game Orchestrator
 */

// 1. Canvas Setup
const canvas = document.getElementById('worldCanvas');
const ctx = canvas.getContext('2d');

// 2. Global Game State
const gameState = {
    assetsLoaded: false,
    paused: false,
    blockSize: 8,
    gravity: 0.25
};

let player;

function init() {
    // Generate the world data first (from worldGen.js)
    // This fills the 'worldGrid' array
    generateWorld();

    // Spawn Player at a safe spot (X: 10, Y: calculated surface)
    const spawnX = 10 * gameState.blockSize;
    const spawnY = 5 * gameState.blockSize; // Start high, let gravity work
    
    // Create player instance (Assumes Player class is in player.js)
    player = new Player(spawnX, spawnY);

    // Start the game loop
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState.paused) return;

    // Update player logic and handle collisions with worldGrid
    // We pass worldGrid and blockSize so the player knows what it's hitting
    player.update(worldGrid, gameState.blockSize);
}

function draw() {
    // Clear sky
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 1. Draw the World (Optimized: only draw what's on screen)
    for (let x = 0; x < worldGrid.length; x++) {
        for (let y = 0; y < worldGrid[x].length; y++) {
            const blockType = worldGrid[x][y];
            if (blockType !== 0) {
                drawBlock(x, y, blockType); // Function from worldGen.js
            } else {
                // Optional: Draw cave background
                if (y > groundLevel) { // groundLevel from worldGen.js
                     ctx.fillStyle = '#4a321d';
                     ctx.fillRect(x * gameState.blockSize, y * gameState.blockSize, gameState.blockSize, gameState.blockSize);
                }
            }
        }
    }

    // 2. Draw the Player
    player.draw(ctx);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game when the window loads
window.addEventListener('load', init);

// Handle "R" for reset (modularly re-calls generation)
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'r') {
        generateWorld();
        player.y = 0; // Reset player position
        player.dy = 0;
    }
});
