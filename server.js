const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const players = {};

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);

    // Dodaj nowego gracza
    players[socket.id] = {
        x: Math.random() * 700,
        y: Math.random() * 500,
        hp: 100,
        exp: 0
    };

    // Wyślij aktualny stan do nowego gracza
    socket.emit('currentPlayers', players);

    // Poinformuj wszystkich o nowym graczu
    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    // Ruch gracza
    socket.on('move', (movement) => {
        if (players[socket.id]) {
            players[socket.id].x += movement.x;
            players[socket.id].y += movement.y;
            io.emit('playerMoved', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
        }
    });

    // Rozłączenie
    socket.on('disconnect', () => {
        console.log('Gracz opuścił:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

app.use(express.static('public'));

http.listen(3000, () => {
    console.log('Serwer działa na porcie 3000');
});
