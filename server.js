const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const players = {};
let weapons = [];
let first_aids = [];
const max_speed = 3;

function checkPlayerCollision(player1, player2) {
    const distance = Math.sqrt(
        Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
    );
    if(distance < 50){
        if(player1.armed){
            player2.hp -= 10*player1.lvl
            if(player2.hp <= 0) {
                player1.exp_gain += player2.lvl*10
            }
            player1.armed = false
        }
    }
}

function doBump(player){
    if(player.x<0){
        player.speedX += max_speed
   }
   if(player.x > 950){
        player.speedX -= max_speed
   }
   if(player.y < 0 ){
        player.speedY += max_speed
   }
   if(player.y > 550){
        player.speedY -= max_speed
   }
}

function checkWallCollision(player){
   if(player.x<0){
        player.speedX += max_speed
   }
   if(player.x > 950){
        player.speedX -= max_speed
   }
   if(player.y < 0 ){
        player.speedY += max_speed
   }
   if(player.y > 550){
        player.speedY -= max_speed
   }
}

function checkWeaponCollision(player) {
    let updated_weapons = [];
    for (const weapon of weapons) {
        const distance = Math.sqrt(
            Math.pow(player.x - weapon.x, 2) + Math.pow(player.y - weapon.y, 2)
        );
        if (distance < 30) {
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
        const distance = Math.sqrt(
            Math.pow(player.x - first_aid.x, 2) + Math.pow(player.y - first_aid.y, 2)
        );
        if (distance < 30) {
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
    if(player.hp<=0){
        addPlayer(socket_id)
    }
}

function addPlayer(socket_id){
    players[socket_id] = {
        x: Math.random() * 700,
        y: Math.random() * 500,
        hp: 40,
        max_hp: 40,
        exp: 0,
        lvl: 1,
        speedX: 0,
        speedY: 0,
        armed: false,
        exp_gain: 0
    };
}

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);

    // Dodaj nowego gracza
    addPlayer(socket.id)

    // Wyślij aktualny stan do nowego gracza
    socket.emit('currentPlayers', players);

    // Poinformuj wszystkich o nowym graczu
    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    socket.on('move', (movement) => {
        if (players[socket.id]) {
            if (movement.x == 0) {
                players[socket.id].speedX *= 0.95;
            }
            if (movement.y == 0) {
                players[socket.id].speedY *= 0.95;
            }
            players[socket.id].speedX += movement.x;
            players[socket.id].speedY += movement.y;
            updateSpeed(players[socket.id]);
            players[socket.id].x += players[socket.id].speedX;
            players[socket.id].y += players[socket.id].speedY;
    
            checkWallCollision(players[socket.id]);
            checkWeaponCollision(players[socket.id]);
            checkAidCollision(players[socket.id]);
            checkLvlUp(players[socket.id]);
    
            for (const id in players) {
                if (id !== socket.id) {
                    const otherPlayer = players[id];
                    checkPlayerCollision(players[socket.id], otherPlayer);
                    checkDeath(players[socket.id], socket.id)
                }
            }
    
            io.emit('power_ups', { first_aids: first_aids, weapons: weapons });
            io.emit('players_update', { players: players });
        }
    });
    
    // Rozłączenie
    socket.on('disconnect', () => {
        console.log('Gracz opuścił:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
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

setInterval(() =>{
    spawnPowerUp()
},5000)