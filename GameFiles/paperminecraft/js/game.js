const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Initialize Systems
const world = new World();
const player = new Player(); // Make sure player.js is loaded before this!

// Set Initial Player Position
// We put them at Y=400 so they don't spawn inside the ground or too high up
player.y = 400; 
player.x = 0;

// Input State
const keys = {};

// --- EVENT LISTENERS ---

// Keyboard Movement
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    
    // Quick Restart (R key)
    if(e.code === 'KeyR') {
        player.x = 0;
        player.y = 400;
        world.chunks = {}; // Clear world to regenerate
    }
});

window.addEventListener('keyup', e => keys[e.code] = false);

// Mouse Interaction (Mining & Placing)
window.addEventListener('mousedown', e => {
    // 1. Calculate the Camera Offset (Center of screen)
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    // 2. Convert Screen Coordinates -> World Coordinates
    // "MousePos + PlayerPos - CenterOffset"
    const worldMouseX = e.clientX + player.x - centerX;
    const worldMouseY = e.clientY + player.y - centerY;

    // 3. Convert World Coordinates -> Grid Coordinates
    const gridX = Math.floor(worldMouseX / world.tileSize);
    const gridY = Math.floor(worldMouseY / world.tileSize);

    // 4. Find the Chunk
    const chunkIdx = Math.floor(gridX / world.chunkSize);
    let localX = gridX % world.chunkSize;
    
    // Fix negative modulo bug (so you can mine to the left of start)
    if (localX < 0) localX += world.chunkSize;

    // 5. Execute Action
    if (world.chunks[chunkIdx]) {
        // Left Click (0) = Mine (Set to Air/0)
        if (e.button === 0) {
            world.chunks[chunkIdx][localX][gridY] = 0;
        }
        // Right Click (2) = Place Block
        else if (e.button === 2) {
            // Prevent placing blocks inside the player
            // (Simple collision check)
            const playerGridX = Math.floor(player.x / world.tileSize);
            const playerGridY = Math.floor(player.y / world.tileSize);

            if (gridX !== playerGridX || gridY !== playerGridY) {
                // Get the ID from the player's hotbar
                let blockToPlace = player.inventory[player.selectedSlot];
                world.chunks[chunkIdx][localX][gridY] = blockToPlace;
            }
        }
    }
});

// Disable the Context Menu so Right-Click doesn't open a browser menu
window.oncontextmenu = (e) => e.preventDefault();

// --- GAME LOOP ---

function gameLoop() {
    // Resize canvas every frame to handle window resizing dynamically
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 1. Update Logic
    player.update(keys);
    world.update(player.x);

    // 2. Clear Screen
    // Use sky color
    ctx.fillStyle = "#87CEEB"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw World
    world.draw(ctx, player);

    // 4. Draw Player (Simple Red Box for now)
    // We draw the player exactly in the center of the screen
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    ctx.fillStyle = "red";
    ctx.fillRect(centerX, centerY, 30, 30); // Player is slightly smaller than a block (30px vs 32px)

    // Repeat
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop();
