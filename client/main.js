const socket = io();
let players = {};
let weapons = [];
let first_aids = [];
let explosions = {};

//import { start } from 'repl';
import { playMusic } from './modules/sound.js'
import { playSound } from './modules/sound.js'
import { GifPlayer } from './modules/gifPlayer.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const xpCanvas = document.getElementById('xpCanvas').getContext('2d');
const chatForm = document.createElement('form');
const chatInput = document.createElement('input');
const chatButton = document.createElement('button');
const messagesList = document.createElement('ul');
const chatDiv = document.createElement('div');
const startScreen = document.getElementById('start-screen');
const playerForm = document.getElementById('player-form');
const playerNameInput = document.getElementById('player-name');

chatForm.id = 'chat-form';
chatInput.id = 'chat-input';
chatButton.textContent = 'Wyślij';
chatButton.type = 'submit';
chatDiv.id = 'chat';
messagesList.id = 'messages';

chatForm.appendChild(chatInput);
chatForm.appendChild(chatButton);
chatDiv.appendChild(messagesList);
chatDiv.appendChild(chatForm);
document.body.appendChild(chatDiv);

playerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = playerNameInput.value.trim();
    const color = document.getElementById('cat-color').value;
    const flag = document.getElementById('player-flag').value;
    const avatar = document.querySelector('input[name="avatar"]:checked')?.value;
    if (name.length >= 1 && name.length <= 16 && avatar !== undefined) {
        socket.emit('join_request', { name, color, flag, avatar });
    }
});

socket.on('join_accepted', (playerData) => {
    startScreen.style.display = 'none';
    players[socket.id] = playerData;
    gameLoop()
    
    setInterval(() => {
        sendMovement();
        //updateXPBar();
    }, 16)
});

let click = {x: undefined, y:undefined}

socket.on('currentPlayers', (serverPlayers) => {
    Object.assign(players, serverPlayers);
});

socket.on('newPlayer', (playerData) => {
    players[playerData.id] = playerData;
});

socket.on('players_update', (playerData) => {
    players = playerData.players
});

socket.on('exp_update', (playerData) => {
    updateXPBar(playerData)
});

socket.on('playerDisconnected', (id) => {
    delete players[id];
});

socket.on('death', (position) => {
    playSound("explosion")
    explosions[position.x] = new GifPlayer(document.getElementById("explosion_sprite"), 200, 282, 17, position.x, position.y, 50, 50);
});

socket.on('chat message', (msg) => {
    const item = document.createElement('li');
    item.textContent = msg;
    messagesList.appendChild(item);
    const chatBox = document.getElementById('messages');
    chatBox.scrollTop = chatBox.scrollHeight;
});

socket.on('power_ups', (data) => {
    first_aids = data.first_aids;
    weapons = data.weapons
});

chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (chatInput.value) {
        let message = socket.emit('chat message', chatInput.value);
        chatInput.value = '';
    }
});

const keys = {};

window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function sendMovement() {
    let movement = { x: 0, y: 0 };

    if (keys['ArrowUp'] || keys['w']) movement.y = 1;
    if (keys['ArrowDown'] || keys['s']) movement.y = -1;
    if (keys['ArrowLeft'] || keys['a']) movement.x = 1;
    if (keys['ArrowRight'] || keys['d']) movement.x = -1;

    socket.emit('move', movement);
}

function setClick(){
    click.x = event.clientX 
    click.y = event.clientY
}

function updateXPBar(){
    const player = players[socket.id];
    if (!player) return;
    xpCanvas.clearRect(0, 0, 1000, 50);
    xpCanvas.fillStyle = "purple"
    xpCanvas.lineWidth = "6";
    xpCanvas.fillRect(0,0, 1000*player.exp/(Math.pow(2, player.lvl) + 8),50)
    xpCanvas.rect(0,0, 1000,50)
    xpCanvas.stroke()
}
/*
function moveTowardPoint(player) {
    let movement = { x: 0, y: 0 };
    if(Math.abs(click.y-(player.y+25)) <= 3) { 
        movement.y=0 
        click.y = undefined 
    }
    if(Math.abs(click.x-(player.x+25)) <= 3) { 
        movement.x=0 
        click.x = undefined 
    }
    if(click.x != undefined){
        if(click.x > player.x+25) { movement.x=1 }
        else {movement.x=-1}
    }
    if(click.y != undefined){
        if(click.y > player.y+25) { movement.y=1 }
        else {movement.y=-1}
    }
    console.log(click, player)
    socket.emit('move', movement);
    }
    
document.addEventListener("click", setClick);*/

function drawMiniMap()
{
    ctx.beginPath();
    ctx.lineWidth = "2";
    ctx.strokeStyle = "black";
    ctx.rect(850, 450, 130, 130);
    ctx.stroke();
    ctx.lineWidth = "0";
    for(const id in players){
        const player = players[id]
        if(player.guild===players[socket.id].guild){
            ctx.fillStyle = "#00FF00";
            ctx.strokeStyle = "#00FF00";
        }
        else{
            ctx.fillStyle = "red";
            ctx.strokeStyle = "red";
        }
        ctx.beginPath();
        ctx.arc(850+130*((1000-player.x)/1000), 450+130*((1000-player.y)/1000), 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!players[socket.id]) return;
    for (const id in players) {
        const player = players[id];
        if (!player) continue;

        const img = document.getElementById(player.avatar)
        if(id === socket.id)
        {
            ctx.drawImage(img, 500 - 25, 300 -25);

            ctx.fillStyle = player.color || 'black';
            ctx.font = '15px Arial'; 
            ctx.globalAlpha = 1; // przezroczystość koloru
            ctx.lineWidth = 1;
            // Flaga
            const flagMap = {
                pl: '🇵🇱',
                us: '🇺🇸',
                de: '🇩🇪',
                fr: '🇫🇷',
                jp: '🇯🇵'
            };
            
            const flagEmoji = flagMap[player.flag?.toLowerCase()] || '';
            //ctx.fillText(flagEmoji, player.x - 10, player.y - 30);
    
            
            let hp_bar = '['
            for(let i=0;i<10;i++){
                if(player.max_hp*i/10 < player.hp){
                    hp_bar+= '|'
                }
                else{
                    hp_bar += ' '
                }
            }
            hp_bar += ']'
            ctx.fillText(`${hp_bar} [${player.lvl}]`, 500-30, 300 + 45 );
            //ctx.strokeText(`${hp_bar} [${player.lvl}]`, player.x-35, player.y + 45 );
            ctx.fillText(`${player.name} `, 500-(player.name.length*4), 300- 35);
            //ctx.strokeText(`${player.name} `, player.x-40, player.y- 35);
            //ctx.globalAlpha = 1.0;
            ctx.strokeStyle = 'black';
    
            if(player.armed){
                ctx.beginPath();
                ctx.lineWidth = "3";
                ctx.strokeStyle = "red";
                ctx.rect(500 -25, 300 -25, 50, 50);
                ctx.stroke();
                ctx.strokeStyle = "black";
                ctx.lineWidth = "1";
            }
            //moveTowardPoint(player)
        }
        else
        {
            let relative_pos = {x: 500 - (player.x-players[socket.id].x)-25, y: 300 - (player.y-players[socket.id].y) - 25}
            ctx.drawImage(img, relative_pos.x, relative_pos.y);
            // Obwódka kolorem gracza
            if(player.guild === players[socket.id].guild){
                ctx.fillStyle = '#00FF00' || 'black';
            }
            else{
                ctx.fillStyle = 'red' || 'black';
            }
            ctx.font = '15px Arial'; 
            ctx.globalAlpha = 1; // przezroczystość koloru
            ctx.lineWidth = 1;
            // Flaga
            const flagMap = {
                pl: '🇵🇱',
                us: '🇺🇸',
                de: '🇩🇪',
                fr: '🇫🇷',
                jp: '🇯🇵'
            };
            
            const flagEmoji = flagMap[player.flag?.toLowerCase()] || '';
            //ctx.fillText(flagEmoji, player.x - 10, player.y - 30);
    
            
            let hp_bar = '['
            for(let i=0;i<10;i++){
                if(player.max_hp*i/10 < player.hp){
                    hp_bar+= '|'
                }
                else{
                    hp_bar += ' '
                }
            }
            hp_bar += ']'
            ctx.fillText(`${hp_bar} [${player.lvl}]`, relative_pos.x, relative_pos.y + 65 );
            //ctx.strokeText(`${hp_bar} [${player.lvl}]`, player.x-35, player.y + 45 );
            ctx.fillText(`${player.name} `, relative_pos.x-(player.name.length*4)+15, relative_pos.y-15);
            //ctx.strokeText(`${player.name} `, player.x-40, player.y- 35);
            //ctx.globalAlpha = 1.0;
            ctx.strokeStyle = 'black';
    
            if(player.armed){
                ctx.beginPath();
                ctx.lineWidth = "3";
                ctx.strokeStyle = "red";
                ctx.rect(relative_pos.x, relative_pos.y, 50, 50);
                ctx.stroke();
                ctx.strokeStyle = "black";
                ctx.lineWidth = "1";
            }
            //moveTowardPoint(player)
        }
    }


    for(const first_aid of first_aids){
        ctx.beginPath();
        ctx.arc(500+(players[socket.id].x-first_aid.x), 300+(players[socket.id].y-first_aid.y), 5, 0, 2 * Math.PI);
        ctx.fillStyle = "green";
        ctx.fill();
        ctx.stroke();
    }
    for(const weapon of weapons){
        ctx.beginPath();
        ctx.arc(500+(players[socket.id].x-weapon.x), 300+(players[socket.id].y-weapon.y), 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
        ctx.stroke();
    }
    if(startScreen.style.display == 'none'){
        playMusic();
    }
    for (const explosion of Object.values(explosions)) {
        let params = explosion.getDrawParams();
        ctx.drawImage(
            params.img,
            params.sx, params.sy, params.sw, params.sh,
            500+(players[socket.id].x-params.dx), 300+(players[socket.id].y-params.dy), params.dw, params.dh
        );
    }
    drawMiniMap()
    requestAnimationFrame(gameLoop);
}