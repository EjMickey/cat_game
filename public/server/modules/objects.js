let weapons = [];
let first_aids = [];
const players = {};

function addPlayer(socket_id, name, color, flag, avatar) {
    players[socket_id] = {
        x: Math.random() * 900 + 50,
        y: Math.random() * 500 + 50,
        speedX: 0,
        speedY: 0,
        max_speed: 5,
        hp: 30,
        exp: 0,
        exp_gain: 0,
        lvl: 1,
        max_hp: 30,
        armed: false,
        name: name || "Macius2007PL",
        color: /^#[0-9A-F]{6}$/i.test(color) ? color : '#000000',
        flag: flag || 'pl',
        avatar: avatar || null
    };
}

function spawnPowerUp(){
    weapons.push({x: Math.random()*950, y: Math.random()*550})
    first_aids.push({x: Math.random()*950, y: Math.random()*550})
}

setInterval(() =>{
    spawnPowerUp()
},5000)

module.exports = {
    weapons,
    first_aids,
    players,

    addPlayer
}