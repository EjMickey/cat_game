let songs = ["hasselhoff", "manian", "pump_it_up", "rawdogger"]
let sound_effects = ["explosion", "collision", ""]
let song = null

export function playMusic() {
    if(song === null){
        song = document.getElementById(songs[Math.floor(Math.random()*4)]);
        song.volume = 0.2
        song.play(); 
    }   
    else if(song.ended)
    {
        song = null
    }
}

export function playSound(sound_name)
{
    let sound = document.getElementById(sound_name)
    sound.volume = 0.5
    sound.play()
}