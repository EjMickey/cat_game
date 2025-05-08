const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, '..', 'client'), {
    maxAge: '1d'
}));

const http = require('http').createServer(app);
const io = require('socket.io')(http);
const collisions = require('./modules/collisions.js');
const movement = require('./modules/movement.js');
const objects = require('./modules/objects.js');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

const input_buffer = {};

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

function checkDeath(player, socket_id){
    if(player.hp <= 0){
        const { name, color, flag, avatar } = player;
        objects.addPlayer(socket_id, name, color, flag, avatar);
        const socket = io.sockets.sockets.get(socket_id);
        if (socket) {
            socket.broadcast.emit('death', {x: player.x, y: player.y});
        }
    }
}

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);

    socket.on('join_request', ({ name, color, flag, avatar }) => {
        if (typeof name !== 'string' || name.length < 1 || name.length > 16) return;
        objects.addPlayer(socket.id, name, color, flag, avatar);
        socket.emit('join_accepted', objects.players[socket.id]);
        socket.emit('currentPlayers', objects.players);
        socket.broadcast.emit('newPlayer', { id: socket.id, ...objects.players[socket.id] });
    });
    
    socket.on('move', (movement) => {
        if (!objects.players[socket.id]) return;

        movement.x = Math.max(-1, Math.min(1, movement.x));
        movement.y = Math.max(-1, Math.min(1, movement.y));

        input_buffer[socket.id] = movement;
    })

    socket.on('disconnect', () => {
        console.log('Gracz opuścił:', socket.id);
        delete objects.players[socket.id];
        delete input_buffer[socket.id];
        io.emit('playerDisconnected', socket.id);
    });

    socket.on('chat message', (msg) => {
        message = '['+objects.players[socket.id].name+']: '+ msg
        io.emit('chat message', message);
      });
});

app.use(express.static('public'));

http.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});

function checkCombat(player, id)
{
    for (const otherId in objects.players) {
        if (otherId !== id) {
            const otherPlayer = objects.players[otherId];
            collisions.checkPlayerCollision(player, otherPlayer);
            checkDeath(player, id);
        }
    }
}

setInterval(() => { // Main loop
    for (const id in objects.players) {
        const player = objects.players[id];

        movement.updateSpeed(player, input_buffer[id]);
        movement.normaliseSpeed(player);
        movement.updatePosition(player);

        collisions.checkWallCollision(player);
        collisions.checkWeaponCollision(player, objects.weapons);
        collisions.checkAidCollision(player, objects.first_aids);
        checkLvlUp(player);

        checkCombat(player, id);
    }

    io.emit('power_ups', { first_aids: objects.first_aids, weapons: objects.weapons });
    io.emit('players_update', { players: objects.players });
}, 16);