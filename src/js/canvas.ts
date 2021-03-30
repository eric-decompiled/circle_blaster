import gsap from 'gsap'
import { Player, Projectile } from './models/player'
import { Enemy, Boss } from './models/enemies'
import { PowerUp } from './models/powerups'
import { Particle, BackgroundParticle } from './models/particles'
import { Point, Velocity } from './models/base'

// HTML elements
const canvas = document.querySelector('canvas')
const scoreEl = document.querySelector('#scoreEl')
const levelEl = document.querySelector('#levelEl')
const modalEl = document.querySelector('#modalEl') as HTMLElement
const comboEl = document.querySelector('#comboEl')
const bigScoreEl = document.querySelector('#bigScoreEl')
const startGameBtn = document.querySelector('#startGameBtn')
const inforBarEl = document.querySelector('#infoBar')
const longComboEl = document.querySelector('#longestComboEl')
const runtimeEl = document.querySelector('#timeEl')
const victoryEl = document.querySelector('#victoryEl') as HTMLElement

// Songs
const albatrossSongURL = './audio/albatross.mp3'
const movingMiamiSongURL = './audio/moving_to_miami.mp3'
const inCloudsSongURL = './audio/in_clouds.mp3'
let currentSong = movingMiamiSongURL
const backgroundMusic = new Audio(currentSong)
backgroundMusic.volume = 0.66
backgroundMusic.currentTime = 0
const bossMusic = new Audio('./audio/altBoss.mp3')
bossMusic.loop = true
const victoryMusicURL = './audio/rising_stars.mp3'
const victorySong = new Audio(victoryMusicURL)
const winSound = new Audio('/audio/activation.mp3')

function nextSong() {
    switch (currentSong) {
        case albatrossSongURL: default:
            backgroundMusic.src = movingMiamiSongURL
            backgroundMusic.volume = 0.4
            break
        case inCloudsSongURL:
            backgroundMusic.src = albatrossSongURL
            backgroundMusic.volume = 0.5
            break
        case movingMiamiSongURL:
            backgroundMusic.src = inCloudsSongURL
            backgroundMusic.volume = 0.33
            break
    }
    if (!scene.boss) {
        backgroundMusic.src = currentSong
        backgroundMusic.pause()
        backgroundMusic.load()
        backgroundMusic.play()
    }
}

// Sound FX
const startGameAudio = new Audio('./audio/start.mp3')
const endGameAudio = new Audio('./audio/altEnd.mp3')
const comboBreak = new Audio('./audio/destroy.mp3')
const destroyEnemy = new Audio('./audio/continue.mp3')
const obtainPowerupAudio = new Audio('./audio/powerup.mp3')
const alarmAudio = new Audio('./audio/warning.mp3')
const maxShotsAudio = new Audio('./audio/cancel.mp3')

backgroundMusic.addEventListener('ended', nextSong)
victorySong.addEventListener('ended', nextSong)

const scene = {
    active: false,
    boss: false,
    color: undefined,
}
const keys = {
    up: false,
    down: false,
    right: false,
    left: false
}
const mouse = {
    down: false,
    x: undefined,
    y: undefined,
}
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight - inforBarEl.clientHeight
let topLeft: Point
let bottomRight: Point
let animationId: number
let player: Player
let powerUps: PowerUp[]
let particles: Particle[]
let enemies: any[]
let projectiles: Projectile[]
let backgroundParticles: BackgroundParticle[]
let frame: number
let score: number
let level: number
let combo: number
let litCount: number
let particleCount: number
let powerupTimeout = setTimeout(() => { }, 0) // let type inference do its thing
const spacing = 30
const padding = 0

// stats
let longestCombo: number
let startTime: any

function init() {
    canvas.width = innerWidth
    canvas.height = innerHeight - inforBarEl.clientHeight
    topLeft = new Point(
        padding,
        padding
    )
    bottomRight = new Point(
        canvas.width - padding,
        canvas.height - padding
    )
    score = 0
    combo = 0
    frame = 0
    level = 1
    longestCombo = 0
    startTime = Date.now()
    comboEl.innerHTML = combo.toString()
    victoryEl.style.display = 'none'
    gsap.to(bossMusic, {
        volume: 0.0,
        duration: 4,
        onComplete: () => {
            bossMusic.pause()
            bossMusic.currentTime = 0
            bossMusic.volume = 1.0
        }
    })
    backgroundMusic.volume = 0.5
    backgroundMusic.play()
    scene.boss = false
    levelEl.innerHTML = level.toString()
    player = new Player(topLeft, bottomRight, 'ivory', keys)
    projectiles = []
    particles = []
    enemies = []
    powerUps = []
    backgroundParticles = []
    for (var i = topLeft.x; i < bottomRight.x; i += spacing) {
        for (let j = topLeft.y; j < bottomRight.y; j += spacing) {
            backgroundParticles.push(new BackgroundParticle(i, j, 3, 'ivory'))
        }
    }
    particleCount = backgroundParticles.length
    litCount = 0
}

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.5)' // create motion blur effect
    c.fillRect(0, 0, canvas.width, canvas.height)
    if (frame % (750 + level * 100) === 0) {
        setLevel(score)
        spawnEnemies(level)
        if (Math.random() < 0.20) spawnPowerUp()
    }
    frame++
    updateParticles()
    updatePowerups()
    updateEnemies()
    updateProjectiles()
    player.update(c)
    if (player.powerUp === 'Automatic' && mouse.down && frame % 12 === 0) {
        projectiles.push(player.shoot(mouse))
    }
}


function updateEnemies() {
    enemies.forEach((enemy, index) => {
        const dist = player.distanceBetween(enemy)
        if (dist < 1) endGame()
        enemy.update(c)
        // check if enemy hit any projectiles
        projectiles.forEach((projectile) => {
            const dist = projectile.distanceBetween(enemy)
            if (dist < 0.1) {
                const splashAmount = Math.max(16, enemy.radius / 6)
                const splashAngle = projectile.center.angleTo(enemy.center)
                projectile.resolveCollision(enemy)
                hitSplash(projectile.center, enemy.color, splashAmount, splashAngle)
                projectile.color = enemy.color
                // remove projectile on hit
                if (enemy.hit(projectile.power)) {
                    // i.e. enemy survived hit
                    addScore(100, projectile)
                } else {
                    enemy.color === scene.color ?
                        continueCombo() :
                        breakCombo(enemy)
                    if (enemy.isBoss) winGame()
                    // extra splash for kill
                    const splashAmount = Math.random() * 12 + 6
                    hitSplash(projectile.center, enemy.color, splashAmount, splashAngle)
                    addScore(enemy.points, projectile)
                    // remove enemy after some time for it to fade 
                    setTimeout(() => projectiles = projectiles.filter(p => p.id !== projectile.id), 0)
                    setTimeout(() => enemies = enemies.filter(e => e.id !== enemy.id), 100)
                }
                projectile.power *= 2.5
            }
        })
        // bounce off walls
        const collidedWithX = enemy.center.x - enemy.radius + enemy.velocity.x < topLeft.x || enemy.center.x + enemy.radius + enemy.velocity.x > bottomRight.x
        const collidedWithY = enemy.center.y - enemy.radius + enemy.velocity.y < topLeft.y || enemy.center.y + enemy.radius + enemy.velocity.y > bottomRight.y
        if (enemy.inPlay) {
            if (collidedWithX) {
                enemy.velocity.x = -enemy.velocity.x
            }
            if (collidedWithY) {
                enemy.velocity.y = -enemy.velocity.y
            }
        } else {
            enemy.inPlay = !(collidedWithX || collidedWithY)
        }
        // check for collisions with other enemies. For loop to not double collide.
        for (let i = index + 1; i < enemies.length; i++) {
            const e = enemies[i]
            if (enemy.distanceBetween(e) < 0.1) e.resolveCollision(enemy)
        }
    })
}


function updatePowerups() {
    powerUps.forEach((powerUp, index) => {
        if (powerUp.distanceBetween(player) < 1) {
            let obtainSound = obtainPowerupAudio.cloneNode() as HTMLAudioElement
            obtainSound.play()
            player.powerUp = 'Automatic'
            player.color = '#FFF500'
            powerUps.splice(index, 1)
            clearTimeout(powerupTimeout)
            powerupTimeout = setTimeout(() => {
                player.powerUp = ''
                player.color = '#FFF'
            }, 5000)
        } else {
            powerUp.update(c)
        }
        const collidedWithX = powerUp.center.x - powerUp.radius / 2 <= topLeft.x || powerUp.center.x + powerUp.radius / 2 >= bottomRight.x
        const collidedWithY = powerUp.center.y - powerUp.radius / 3 <= topLeft.y || powerUp.center.y + powerUp.radius / 2 >= bottomRight.x
        if (powerUp.inPlay) {
            if (collidedWithX) {
                powerUp.velocity.x = -powerUp.velocity.x
            }
            if (collidedWithY) {
                powerUp.velocity.y = -powerUp.velocity.y
            }
        } else {
            powerUp.inPlay = !(collidedWithX || collidedWithY)
        }
    })
}

function addScore(basePoints: number, projectile: Projectile) {
    let multiplier = 1 + combo / 10
    const points = (basePoints * multiplier) | 0 // bitwise or 0 casts to int
    score += points
    scoreEl.innerHTML = score.toString()
    createScoreLabel(projectile, points)
}

function createScoreLabel(projectile: Projectile, score: number) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score.toString()
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = projectile.center.x + 'px'
    scoreLabel.style.top = projectile.center.y + 'px'
    document.body.appendChild(scoreLabel)
    gsap.to(scoreLabel, {
        opacity: 0,
        y: -30,
        duration: 1,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

function spawnEnemy(level: number) {
    enemies.push(new Enemy(outOfBounds(), player.center, level))
}

function spawnBoss() {
    scene.boss = true
    gsap.to(backgroundMusic, {
        volume: 0.0,
        duration: 6,
        onComplete: () => {
            backgroundMusic.src = albatrossSongURL
            backgroundMusic.currentTime = 0
            backgroundMusic.pause()
        }
    })
    setTimeout(() => alarmAudio.play(), 2000)
    setTimeout(() => {
        gsap.to(alarmAudio.play(), {
            volume: 0.0,
            duration: 4,
            onComplete: () => {
                alarmAudio.pause()
                alarmAudio.currentTime = 2
                alarmAudio.volume = 1.0
            }
        })
    }, 6000)
    setTimeout(() => bossMusic.play(), 10000)
    let pushBoss = () => enemies.push(new Boss(outOfBounds(), player))
    setTimeout(pushBoss, 11000)
}

function spawnEnemies(level: number) {
    spawnEnemy(1)
    if (level > 1) spawnEnemy(1)
    if (level > 2) spawnEnemy(2)
    if (level > 3) spawnEnemy(3)
    if (level > 4 && !scene.boss) spawnBoss()
}

function setLevel(score: number) {
    if (score > 1000) level = 2
    if (score > 2500) level = 3
    if (score > 5000) level = 4
    if (score > 10000) level = 5
    if (score > 250000) level = 6
    if (score > 1000000) level = 7
    levelEl.innerHTML = level.toString()
}

function spawnPowerUp() {
    powerUps.push(new PowerUp(outOfBounds(), new Point(canvas.width / 2, canvas.height / 2)))
}

function endGame() {
    cancelAnimationFrame(animationId)
    modalEl.style.display = 'flex'
    bigScoreEl.innerHTML = score.toString()
    endGameAudio.play()
    scene.active = false
    gsap.to('#whiteModalEl', {
        opacity: 1,
        scale: 1,
        duration: 0.35,
    })
    postEvent('game lost', endStats())
}

function winGame() {
    cancelAnimationFrame(animationId)
    modalEl.style.display = 'flex'
    bigScoreEl.innerHTML = score.toString()
    backgroundMusic.src = victoryMusicURL
    backgroundMusic.load()
    backgroundMusic.play()
    winSound.play()
    victorySong.play()
    scene.active = false
    victoryEl.style.display = 'block'
    bigScoreEl.innerHTML = score.toString()
    longComboEl.innerHTML = longestCombo.toString()
    // messey way to do time + doesn't handle hour+ time
    let playTime = Date.now() - startTime
    const timeString = `${new Date(playTime).toISOString().substr(14, 8)}`
    runtimeEl.innerHTML = timeString

    // idea to animate when player wins
    // setInterval(() => {
    //     hitSplash(Math.random() * bottomRight.x, Math.random() * bottomRight.y, 'ivory', 24, Math.random() * Math.PI * 2)
    // }, 250)

    gsap.to(bossMusic, {
        volume: 0.0,
        duration: 2,
        onComplete: () => {
            bossMusic.pause()
            bossMusic.volume = 1
        }
    })
    scene.active = false
    gsap.to('#whiteModalEl', {
        opacity: 1,
        scale: 1,
        duration: 0.35,
    })
    postEvent('game won', endStats())
}

function updateParticles() {
    // hit effects
    particles = particles.filter(p => p.alpha > 0)
    particles.forEach(p => p.update(c))

    // background dots
    backgroundParticles.forEach(bp => {
        const dist = Math.hypot(player.center.x - bp.x, player.center.y - bp.y)
        const hideRadius = 125
        if (dist < hideRadius) {
            // hide close particles, illuminate radius
            bp.alpha = dist < 70 ? 0 : 0.35
            if (!bp.touched) {
                litCount += 1
                bp.touched = true
                if (litCount / particleCount > 0.60) {
                    player.unleash(bp.color)
                    backgroundParticles.forEach(bp => bp.touch())
                }
            }
        }
        bp.update(c)
    })
}


function updateProjectiles() {
    projectiles.forEach(projectile => {
        const collidedWithX = projectile.center.x - projectile.radius + projectile.velocity.x < topLeft.x || projectile.center.x + projectile.radius + projectile.velocity.x > bottomRight.x
        const collidedWithY = projectile.center.y - projectile.radius + projectile.velocity.y < topLeft.y || projectile.center.y + projectile.radius + projectile.velocity.y > bottomRight.y
        if (collidedWithX) {
            projectile.velocity.x = -projectile.velocity.x
            projectile.collisions++
        }
        if (collidedWithY) {
            projectile.velocity.y = -projectile.velocity.y
            projectile.collisions++
        }
        if (projectile.collisions > 5) setTimeout(() => {
            hitSplash(projectile.center, projectile.color, 24, Math.random() * Math.PI * 2)
            projectiles = projectiles.filter(p => p.id !== projectile.id)
        }, 0)
        projectile.update(c)
    })

    // remove projectiles out of bounds
    // projectiles.forEach((projectile, index) => {
    //     projectile.update(c)
    //     if (
    //         projectile.center.x + projectile.radius < 0 ||
    //         projectile.center.x - projectile.radius > canvas.width ||
    //         projectile.center.y + projectile.radius < 0 ||
    //         projectile.center.y - projectile.radius > canvas.height
    //     ) {
    //         setTimeout(() => projectiles.splice(index, 1), 0)
    //     }
    // })
}

function hitSplash(p: Point, color: string, amount: number, angle: number) {
    // particles should be bias to break away from enemy
    const xBias = Math.cos(angle) * 1.1
    const yBias = Math.sin(angle) * 1.1
    for (let i = 0; i < amount; i++) {
        particles.push(
            new Particle(
                p.x,
                p.y,
                Math.random() * 2,
                color,
                new Velocity(
                    (Math.random() - 0.5) + xBias,
                    (Math.random() - 0.5) + yBias
                )
            )
        )
    }
}

function continueCombo() {
    let destroySound = destroyEnemy.cloneNode() as HTMLAudioElement
    destroySound.volume = 0.75
    destroySound.play()
    combo += 1
    longestCombo = longestCombo > combo ? longestCombo : combo
    comboEl.innerHTML = combo.toString()
}

function breakCombo(enemy: Enemy) {
    const breakSound = comboBreak.cloneNode() as HTMLAudioElement
    breakSound.volume = 0.33
    breakSound.play()
    player.leash()
    backgroundParticles.forEach(p => {
        p.color = enemy.color
        gsap.to(p, {
            alpha: 0.15,
            duration: 0.03,
            onComplete: () => {
                gsap.to(p, {
                    alpha: p.initialAlpha,
                    touched: false,
                    duration: 0.03
                })
            }
        })
    })
    combo = 0
    comboEl.innerHTML = combo.toString()
    litCount = 0
    scene.color = enemy.color
}

// User input
startGameBtn.addEventListener('click', (event) => {
    init()
    event.stopPropagation()
    scoreEl.innerHTML = score.toString()
    bigScoreEl.innerHTML = score.toString()
    scene.active = true
    gsap.to('#whiteModalEl', {
        opacity: 0,
        scale: 0.75,
        ease: 'expo',
        duration: 0.25,
        onComplete: () => modalEl.style.display = 'none'
    })
    startGameAudio.play()
    backgroundMusic.play()
    animate()
    postEvent('game started', { "width": bottomRight.x, "height": bottomRight.y })
})

addEventListener('mousedown', ({ clientX, clientY }) => {
    mouse.down = true
    mouse.x = clientX
    mouse.y = clientY
})

addEventListener('mousemove', ({ clientX, clientY }) => {
    mouse.x = clientX
    mouse.y = clientY
})

addEventListener('mouseup', () => {
    mouse.down = false
})

addEventListener('touchstart', (event) => {
    mouse.down = true
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY
})

addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY
})

addEventListener('touchend', () => {
    mouse.down = false
})

addEventListener('click', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY
    if (scene.active) {
        if (projectiles.length < player.maxShots) {

            projectiles.push(player.shoot(mouse))
        } else {
            maxShotsAudio.play()
        }
    }
})

addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
    init()
})

addEventListener('keydown', ({ code }) => {
    switch (code) {
        case 'KeyW': case 'ArrowUp':
            keys.up = true
            break
        case 'KeyA': case 'ArrowLeft':
            keys.left = true
            break
        case 'KeyS': case 'ArrowDown':
            keys.down = true
            break
        case 'KeyD': case 'ArrowRight':
            keys.right = true
            break
    }
})

addEventListener('keyup', ({ code }) => {
    switch (code) {
        case 'KeyW': case 'ArrowUp':
            keys.up = false
            break
        case 'KeyA': case 'ArrowLeft':
            keys.left = false
            break
        case 'KeyS': case 'ArrowDown':
            keys.down = false
            break
        case 'KeyD': case 'ArrowRight':
            keys.right = false
            break
    }
})

function endStats() {
    let playTime = Date.now() - startTime
    const timeString = `${new Date(playTime).toISOString().substr(14, 8)}`
    return {
        'score': score,
        'playTime': timeString,
        'longestCombo': longestCombo
    }
}

function postEvent(name: string, payload: object) {
    // if (enableMixpanel) {
    //     mixpanel.track(name, payload)
    // } else {
    //     console.log('dev tracking: ', name, payload)
    // }
}

function outOfBounds(radius = 100): Point {
    // assume radius since it should be big enough
    if (Math.random() < 0.5) {
        let x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius,
            y = Math.random() * canvas.height
        return new Point(x, y)
    } else {
        let x = Math.random() * canvas.height,
            y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
        return new Point(x, y)
    }
}