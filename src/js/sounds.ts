let ctx = new AudioContext()

let sounds = {
    shoot: { url: './audio/shoot.mp3', gain: 0.5 },
    hit: { url: './audio/hit.mp3', gain: 0.33 },
    destroy: { url: './audio/destroy.mp3', gain: 0.33 },
    bounce: { url: './audio/bounce.mp3', gain: 0.33 },
    ammo: { url: './audio/no_ammo.mp3', gain: 0.66 },
    powerup: { url: './audio/powerup.mp3', gain: 0.66 },
    startGame: { url: './audio/start.mp3', gain: 1.0 },
    endGame: { url: './audio/end_game.mp3', gain: 1.0 },
    winGame: { url: './audio/win_game.mp3', gain: 1.0 },
    unleash: { url: './audio/unleash.mp3', gain: 1.0 },
}

function loadSounds() {
    Object.keys(sounds).forEach(sound => {
        let url = sounds[sound].url
        let request = new XMLHttpRequest()
        request.open('GET', url, true)
        request.responseType = 'arraybuffer'

        request.onload = function () {
            ctx.decodeAudioData(request.response, function (buffer) {
                let gainNode = ctx.createGain()
                gainNode.gain.setValueAtTime(sounds[sound].gain, ctx.currentTime)
                sounds[sound].node = gainNode
                sounds[sound].buffer = buffer
            }, console.error)
        }
        request.send()
    })
}
loadSounds()

export function playShootSound() {
    playSound('shoot')
}

export function playHitSound() {
    playSound('hit')
}

export function playDestroySound() {
    playSound('destroy')
}

export function playBounceSound() {
    playSound('bounce')
}

export function playNoAmmoSound() {
    playSound('ammo')
}

export function playPowerUpSound() {
    playSound('powerup')
}

export function playStartGameSound() {
    playSound('startGame')
}

export function playEndGameSound() {
    playSound('endGame')
}

export function playWinGameSound() {
    playSound('winGame')
}

export function playUnleashSound() {
    playSound('unleash')
}

function playSound(sound: string) {
    let source = ctx.createBufferSource()
    source.buffer = sounds[sound].buffer
    let gain = sounds[sound].node
    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(0)
}