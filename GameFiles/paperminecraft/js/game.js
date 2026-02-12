const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const world = new World(32); // 32 is TILE_SIZE
const player = new Player();
const keys = {};

window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);

// Mining/Placing Logic
window.addEventListener('mousedown', e => {
    let gridX = Math.floor((e.clientX + player.x) / world.tileSize);
    let gridY = Math.floor((e.clientY + player.y) / world.tileSize);
    let chunkIdx = Math.floor(gridX / world.chunkSize);
    let localX = gridX % world.chunkSize;
    if (localX < 0) localX += world.chunkSize;

    if (world.chunks[chunkIdx]) {
        if (e.button === 0) { // Left Click: Mine
            world.chunks[chunkIdx][localX][gridY] = 0;
        } else if (e.button === 2) { // Right Click: Place
            let blockToPlace = player.inventory[player.selectedSlot];
            world.chunks[chunkIdx][localX][gridY] = blockToPlace;
        }
    }
});

// Prevent right-click menu from popping up
window.oncontextmenu = (e) => e.preventDefault();

function gameLoop() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    player.update(keys);
    world.update(player.x);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    world.draw(ctx, player);
    
    requestAnimationFrame(gameLoop);
}

gameLoop();
