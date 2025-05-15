const { world_width, world_height } = require("./world")

function checkPlayerCollision(player1, player2) {
    if(player1.guild !== player2.guild){
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
}

function checkWallCollision(player){
   if(player.x<0){
        player.speedX += player.max_speed/2
   }
   if(player.x > world_width){
        player.speedX -= player.max_speed/2
   }
   if(player.y < 0){
        player.speedY += player.max_speed/2
   }
   if(player.y > world_height){
        player.speedY -= player.max_speed/2
   }
}

function checkWeaponCollision(player, weapons) {
    for (let i = weapons.length - 1; i >= 0; i--) {
        const weapon = weapons[i];
        const distance = Math.pow(player.x - weapon.x, 2) + Math.pow(player.y - weapon.y, 2)
        if (distance < 900) {
            player.armed = true;
            weapons.splice(i, 1);
        }
    }
}

function checkAidCollision(player, first_aids) {
    for (let i = first_aids.length - 1; i >= 0; i--) {
        const first_aid = first_aids[i];
        const distance = Math.pow(player.x - first_aid.x, 2) + Math.pow(player.y - first_aid.y, 2);
        if (distance < 900) {
            player.hp += 10;
            if (player.hp > player.max_hp) {
                player.hp = player.max_hp;
            }
            first_aids.splice(i, 1);
        }
    }
}


module.exports = {
    checkPlayerCollision,
    checkWallCollision,
    checkAidCollision,
    checkWeaponCollision,
}