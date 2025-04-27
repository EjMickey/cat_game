const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const players = {};
const max_speed = 3;

function checkCollision(player1, player2) {
    const distance = Math.sqrt(
        Math.pow(player1.x - player2.x, 2) + Math.pow(player1.y - player2.y, 2)
    );
    return distance < 50; // Zakładając, że każdy gracz ma promień 25
}

function checkWallCollision(player){
    return player.x<0 || player.x > 950 || player.y < 0 || player.y > 550
}

function checkLvlUp(player){
    if(player.lvl*player.exp > Math.pow(10, player.lvl)){
        player.exp = 0
        player.lvl += 1
        return true
    }
    else return false
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

io.on('connection', (socket) => {
    console.log('Nowy gracz:', socket.id);

    // Dodaj nowego gracza
    players[socket.id] = {
        x: Math.random() * 700,
        y: Math.random() * 500,
        hp: 100,
        exp: 0,
        lvl: 1,
        speedX: 0,
        speedY: 0
    };

    // Wyślij aktualny stan do nowego gracza
    socket.emit('currentPlayers', players);

    // Poinformuj wszystkich o nowym graczu
    socket.broadcast.emit('newPlayer', { id: socket.id, ...players[socket.id] });

    // Ruch gracza
    socket.on('move', (movement) => {
        if (players[socket.id]) {
            // Aktualizacja pozycji gracza
            if(movement.x == 0){
                players[socket.id].speedX *= 0.95;
            }
            if(movement.y == 0){
                players[socket.id].speedY *= 0.95;
            }
            players[socket.id].speedX += movement.x;
            players[socket.id].speedY += movement.y;
            updateSpeed(players[socket.id])
            players[socket.id].x += players[socket.id].speedX;
            players[socket.id].y += players[socket.id].speedY;
    
            // Sprawdzenie kolizji z innymi graczami
            for (const id in players) {
                if (id !== socket.id) {
                    const otherPlayer = players[id];
                    if (checkCollision(players[socket.id], otherPlayer) || checkWallCollision(players[socket.id])) {
                        if(checkLvlUp(players[socket.id])){
                            io.emit('playerLvled', { id: socket.id, lvl: players[socket.id].lvl});
                        }
                        players[socket.id].speedX = 0;
                        players[socket.id].speedY = 0
                        players[socket.id].x -= players[socket.id].speedX;
                        players[socket.id].y -= players[socket.id].speedY;
                        players[socket.id].hp -= 1;
                        players[socket.id].exp += 2;
                        io.emit('playerHurt', { id: socket.id, exp: players[socket.id].exp, hp: players[socket.id].hp });
                        break;
                    }
                }
            }
//
            io.emit('playerMoved', { id: socket.id, x: players[socket.id].x, y: players[socket.id].y });
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
