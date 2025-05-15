const { world_height, world_width, ball_spawn_time } = require("./world");

let weapons = [];
let first_aids = [];
const players = {};
let cats_names = ["banana", "garf", "gaze", "huh"]
let dogs_names = ["doge", "mruwojad", "piesek", "sleepy"]

function addPlayer(socket_id, name, color, flag, avatar) {
    players[socket_id] = {
        x: Math.random() * world_width - 50,
        y: Math.random() * world_height - 50,
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
        avatar: avatar || "garf",
        guild: cats_names.includes(avatar) ? "cat" : "dog"
    };
}

function spawnPowerUp(){
    weapons.push({x: Math.random()*world_width, y: Math.random()*world_height})
    first_aids.push({x: Math.random()*world_width, y: Math.random()*world_height})
}

setInterval(() =>{
    spawnPowerUp()
},ball_spawn_time)

module.exports = {
    weapons,
    first_aids,
    players,

    addPlayer
}