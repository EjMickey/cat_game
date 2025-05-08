
function updateSpeed(player, input) {
    const movement = input || { x: 0, y: 0 };
    if (movement.x === 0) {
        player.speedX *= 0.95;
    } else {
        player.speedX += movement.x;
    }

    if (movement.y === 0) {
        player.speedY *= 0.95;
    } else {
        player.speedY += movement.y;
    }
}

function normaliseSpeed(player) {
    if (player.speedX > player.max_speed) {
        player.speedX = player.max_speed
    }
    if (player.speedX < -player.max_speed) {
        player.speedX = -player.max_speed
    }
    if (player.speedY > player.max_speed) {
        player.speedY = player.max_speed
    }
    if (player.speedY < -player.max_speed) {
        player.speedY = -player.max_speed
    }
}

function updatePosition(player) {
    player.x += player.speedX;
    player.y += player.speedY;
}

module.exports = {
    updatePosition,
    normaliseSpeed,
    updateSpeed
}