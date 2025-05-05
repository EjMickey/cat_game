const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const players = {};
let weapons = [];
let first_aids = [];
const input_buffer = {};
const max_speed = 5;

function checkPlayerCollision(player1, player2) {
    const distance = Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
    if(distance < 2500){
        if(player1.armed){
            player2.hp -= Math.floor(10+(1.05*player1.lvl))
            if(player2.hp <= 0) {
                player1.exp_gain += player2.lvl*10
            }
            player1.armed = false
        }
    }
}

function checkWallCollision(player){
   if(player.x<25){
        player.speedX += max_speed
   }
   if(player.x > 975){
        player.speedX -= max_speed
   }
   if(player.y < 25 ){
        player.speedY += max_speed
   }
   if(player.y > 575){
        player.speedY -= max_speed
   }
}

function checkWeaponCollision(player) {
    let updated_weapons = [];
    for (const weapon of weapons) {
        const distance = Math.pow(player.x - weapon.x, 2) + Math.pow(player.y - weapon.y, 2)
        if (distance < 900) {
            player.armed = true;
        } else {
            updated_weapons.push(weapon);
        }
    }
    weapons = updated_weapons;
}

function checkAidCollision(player) {
    let updated_first_aids = [];
    for (const first_aid of first_aids) {
        const distance = Math.pow(player.x - first_aid.x, 2) + Math.pow(player.y - first_aid.y, 2)
        if (distance < 900) {
            player.hp += 10;
            if(player.hp>player.max_hp){
                player.hp = player.max_hp
            }
        } else {
            updated_first_aids.push(first_aid);
        }
    }
    first_aids = updated_first_aids;
}

function checkLvlUp(player){
    player.exp += player.exp_gain
    player.exp_gain = 0
    if(player.exp > Math.pow(2, player.lvl) + 8){
        player.exp = 0
        player.lvl += 1
        player.max_hp = Math.floor(player.max_hp * 1.1)
        player.hp = player.max_hp
    }
}

function updateSpeed(player){
    if(player.speedX>max_speed){
        player.speedX = max_speed
    }
    if(player.speedX<-max_speed){
        player.speedX = -max_speed
    }
    if(player.speedY>max_speed){
        player.speedY = max_speed
    }
    if(player.speedY<-max_speed){
        player.speedY = -max_speed
    }
}

function checkDeath(player, socket_id){
    if(player.hp <= 0){
        const { name, color, flag, avatar } = player;
        addPlayer(socket_id, name, color, flag, avatar);
    }
}

function addPlayer(socket_id, name, color, flag, avatar) {
    players[socket_id] = {
        x: Math.random() * 900 + 50,
        y: Math.random() * 500 + 50,
        speedX: 0,
        speedY: 0,
        hp: 10,
        exp: 0,
        exp_gain: 0,
        lvl: 1,
        max_hp: 10,
        armed: false,
        name: name || "Macius2007PL",
        color: /^#[0-9A-F]{6}$/i.test(color) ? color : '#000000',
        flag: flag || 'pl',
        avatar: avatar || null
    };
}

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);

    socket.on('join_request', ({ name, color, flag, avatar }) => {
        if (typeof name !== 'string' || name.length < 1 || name.length > 16) return;
        addPlayer(socket.id, name, color, flag, avatar);
        socket.emit('join_accepted', players[socket.id]);
        socket.emit('currentPlayers', players);
        socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });
    });
    
    socket.on('move', (movement) => {
        if (!players[socket.id]) return;

        movement.x = Math.max(-1, Math.min(1, movement.x));
        movement.y = Math.max(-1, Math.min(1, movement.y));

        input_buffer[socket.id] = movement;
    })

    socket.on('disconnect', () => {
        console.log('Gracz opuścił:', socket.id);
        delete players[socket.id];
        delete input_buffer[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    socket.on('chat message', (msg) => {
        message = '['+players[socket.id].name+']: '+ msg
        io.emit('chat message', message);
      });
});

app.use(express.static('public'));

http.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});

function spawnPowerUp(){
    weapons.push({x: Math.random()*950, y: Math.random()*550})
    first_aids.push({x: Math.random()*950, y: Math.random()*550})
    io.emit('power_ups', { first_aids: first_aids, weapons: weapons });
}

setInterval(() => {
    for (const id in players) {
        const player = players[id];
        const movement = input_buffer[id] || { x: 0, y: 0 };

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

        updateSpeed(player);

        player.x += player.speedX;
        player.y += player.speedY;

        checkWallCollision(player);
        checkWeaponCollision(player);
        checkAidCollision(player);
        checkLvlUp(player);

        for (const otherId in players) {
            if (otherId !== id) {
                const otherPlayer = players[otherId];
                checkPlayerCollision(player, otherPlayer);
                checkDeath(player, id);
            }
        }
    }

    io.emit('power_ups', { first_aids, weapons });
    io.emit('players_update', { players });
}, 16);

setInterval(() =>{
    spawnPowerUp()
},5000)