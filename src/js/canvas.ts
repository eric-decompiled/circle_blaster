import gsap from 'gsap'
import { Player, Projectile } from './models/player'
import { Enemy, HomingEnemy, Boss, OscilatingEnemy } from './models/enemies'
import { PowerUp } from './models/powerups'
import { Particle, BackgroundParticle } from './models/particles'
import { Circle, Color, Point, Velocity } from './models/base'
import { Keys, Mouse } from './models/input'
const playerColor = new Color(0, 0, 100)

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
let startingSong = albatrossSongURL
const backgroundMusic = new Audio(startingSong)
backgroundMusic.volume = 0.66
backgroundMusic.currentTime = 0
const bossMusic = new Audio('./audio/altBoss.mp3')
bossMusic.loop = true
const victoryMusicURL = './audio/rising_stars.mp3'
const victorySong = new Audio(victoryMusicURL)
const winSound = new Audio('/audio/activation.mp3')
let spawnPoints: Point[]

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
const c = canvas.getContext('2d')
c.lineWidth = 5
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
let mouse = new Mouse()
let keys = new Keys()
let frame: number
let score: number
let level: number
let combo: number
let litCount: number
let particleCount: number
let powerupTimeout = setTimeout(() => { }, 0) // let type inference do its thing
let center: Point
const spacing = 30
const padding = 0

// stats
let longestCombo: number
let startTime: any

function init() {
    mouse = new Mouse()
    keys = new Keys()
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
    center = new Point(
        canvas.width / 2,
        canvas.height / 2
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
    player = new Player(
        new Point(bottomRight.x / 2, bottomRight.y / 2),
        playerColor,
        keys
    )
    projectiles = []
    particles = []
    enemies = []
    powerUps = []
    backgroundParticles = []
    for (var i = topLeft.x; i < bottomRight.x; i += spacing) {
        for (let j = topLeft.y; j < bottomRight.y; j += spacing) {
            backgroundParticles.push(new BackgroundParticle(new Point(i, j), 3, playerColor))
        }
    }
    particleCount = backgroundParticles.length
    litCount = 0
    spawnPoints = [
        new Point(0, 0),
        new Point(canvas.width / 4, 0),
        new Point(canvas.width / 2, 0),
        new Point(3 * canvas.width / 4, 0),
        new Point(0, canvas.height / 3),
        new Point(0, 2 * canvas.height / 3),
        new Point(0, canvas.height),
        new Point(canvas.width / 4, bottomRight.y),
        new Point(canvas.width / 2, bottomRight.y),
        new Point(3 * canvas.width / 4, bottomRight.y),
        new Point(bottomRight.x, canvas.height / 3),
        new Point(bottomRight.x, 2 * canvas.height / 3),
        new Point(bottomRight.x, canvas.height),
    ]
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
    updateBackgroundParticles()
    updateEnemies()
    updateParticles()
    updatePowerups()
    updateProjectiles()
    updatePlayer()
}

function updatePlayer() {
    player.update(c)
    if (player.powerUp === 'Automatic' && mouse.down && frame % 12 === 0) {
        projectiles.push(player.shoot(mouse))
    }
    resolveWallCollisions(player)
}


function updateEnemies() {
    enemies.forEach((enemy, index) => {
        const dist = player.distanceBetween(enemy)
        if (dist < 1) endGame()
        enemy.update(c)
        // check if enemy hit any projectiles
        projectiles.forEach((projectile) => {
            const dist = projectile.distanceBetween(enemy)
            if (dist < 1) {
                const splashAmount = Math.max(16, enemy.radius / 6)
                const splashAngle = -projectile.center.angleTo(enemy.center)
                hitSplash(projectile.center, enemy.color, splashAmount, splashAngle)
                hitSplash(projectile.center, projectile.color, 4, splashAngle)

                projectile.collide(enemy.color.h)
                projectile.resolveCollision(enemy)
                enemy.velocity.x *= 0.85
                enemy.velocity.y *= 0.85
                if (enemy.hit(projectile.power)) {
                    // i.e. enemy survived hit
                    addScore(100, projectile)
                    projectile.power += 6
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
                    setTimeout(() => enemies = enemies.filter(e => e.id !== enemy.id), 100)
                }
            }
        })
        if (enemy.inPlay) {
            if (resolveWallCollisions(enemy)) {
                enemy.collide()
            }
        } else {
            enemy.inPlay = !(hitXWall(enemy) || hitYWall(enemy))
        }
        // check for collisions with other enemies. For loop to not double collide.
        for (let i = index + 1; i < enemies.length; i++) {
            const e = enemies[i]
            if (enemy.distanceBetween(e) < 1) {
                const angle = -enemy.center.angleTo(e.center)
                const collisionPoint = new Point(
                    enemy.center.x + Math.cos(angle) * enemy.radius,
                    enemy.center.y + Math.sin(angle) * enemy.radius
                )
                e.resolveCollision(enemy)
                e.collide()
                enemy.collide()
                if (e.velocity.speed() > 3 || enemy.velocity.speed > 3) {
                    hitSplash(collisionPoint, enemy.color, 4, angle + Math.PI)
                    hitSplash(collisionPoint, e.color, 4, angle)
                }
            }
        }
    })
}

function updatePowerups() {
    powerUps.forEach((powerUp, index) => {
        if (powerUp.distanceBetween(player) < 1) {
            let obtainSound = obtainPowerupAudio.cloneNode() as HTMLAudioElement
            obtainSound.play()
            clearTimeout(powerupTimeout)
            player.powerUp = ' '
            powerUps.splice(index, 1)
            powerupTimeout = setTimeout(() => {
                player.powerUp = ''
                player.color = playerColor
            }, 5000)
        } else {
            powerUp.update(c)
        }
        if (powerUp.inPlay) {
            resolveWallCollisions(powerUp)
        } else {
            powerUp.inPlay = !(hitXWall(powerUp) || hitYWall(powerUp))
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
    let e: Enemy
    if (Math.random() < 0.3) {
        e = new HomingEnemy(randomSpawnPoint(), player.center, level)
    } else if (Math.random() < 0.15) {
        e = new OscilatingEnemy(randomSpawnPoint(), center, level)
    } else {
        e = new Enemy(randomSpawnPoint(), player.center, level)
    }
    enemies.push(e)
}

function spawnBoss() {
    if (scene.boss) return
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
    let pushBoss = () => enemies.push(new Boss(randomSpawnPoint(), player))
    setTimeout(pushBoss, 11000)
}

let ticker = 0
function spawnEnemies(level: number) {
    ticker++
    spawnEnemy(1)
    if (level > 1) spawnEnemy(1)
    if (level > 2 && ticker % 2 === 0) spawnEnemy(2)
    if (level > 3 && ticker % 2 === 0) spawnEnemy(3)
    if (level > 4 && !scene.boss) spawnBoss()
}

function setLevel(score: number) {
    if (score > 2500) level = 2
    if (score > 5000) level = 3
    if (score > 10000) level = 4
    if (score > 20000) level = 5
    if (score > 250000) level = 6
    if (score > 1000000) level = 7
    levelEl.innerHTML = level.toString()
}

function spawnPowerUp() {
    powerUps.push(new PowerUp(randomSpawnPoint(), new Point(canvas.width / 2, canvas.height / 2)))
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
}

function updateParticles() {
    particles = particles.filter(p => p.alpha > 0)
    particles.forEach(p => p.update(c))
}

function updateBackgroundParticles() {
    // background dots
    backgroundParticles.forEach(bp => {
        const dist = Math.hypot(player.center.x - bp.center.x, player.center.y - bp.center.y)
        const hideRadius = 125
        if (dist < hideRadius) {
            // hide close particles, illuminate radius
            bp.alpha = dist < 70 ? 0 : 0.35
            if (!bp.touched) {
                litCount += 1
                bp.touched = true
                if (litCount / particleCount > 0.60) {
                    player.unleash()
                    backgroundParticles.forEach(bp => bp.touch())
                }
            }
        }
        bp.update(c)
    })
}


function updateProjectiles() {
    projectiles.forEach(projectile => {
        resolveWallCollisions(projectile)

        // remove projectiles that have bounced to many times
        if (projectile.collisions > 5) setTimeout(() => {
            hitSplash(projectile.center, projectile.color, 24, Math.random() * Math.PI * 2)
            projectiles = projectiles.filter(p => p.id !== projectile.id)
        }, 0)
        projectile.update(c)
    })
}

function hitXWall(c: Circle): boolean {
    return c.center.x - c.radius + c.velocity.x <= topLeft.x ||
        c.center.x + c.radius + c.velocity.x >= bottomRight.x
}

function hitYWall(c: Circle): boolean {
    return c.center.y - c.radius + c.velocity.y < topLeft.y ||
        c.center.y + c.radius + c.velocity.y > bottomRight.y
}

function resolveWallCollisions(c: Circle): boolean {
    const hitX = hitXWall(c)
    const hitY = hitYWall(c)
    if (hitX) {
        if (c.velocity.x > 0) {
            c.center.x = canvas.width - c.radius
        } else {
            c.center.x = 0 + c.radius
        }
        c.velocity.x = -c.velocity.x
        c.collisions++
    }
    if (hitY) {
        if (c.velocity.y > 0) {
            c.center.y = canvas.height - c.radius
        } else {
            c.center.y = 0 + c.radius
        }
        c.velocity.y = -c.velocity.y
        c.collisions++
    }
    return hitX || hitY
}

function hitSplash(p: Point, color: Color, amount: number, angle: number) {
    // particles should be bias to break away from enemy
    const xBias = Math.cos(angle)
    const yBias = Math.sin(angle)
    for (let i = 0; i < amount; i++) {
        particles.push(
            new Particle(
                new Point(p.x, p.y),
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
})

addEventListener('mousedown', ({ clientX, clientY }) => {
    mouse.down = true
    mouse.point.x = clientX
    mouse.point.y = clientY
})

addEventListener('mousemove', ({ clientX, clientY }) => {
    mouse.point.x = clientX
    mouse.point.y = clientY
})

addEventListener('mouseup', () => {
    mouse.down = false
})

addEventListener('touchstart', (event) => {
    mouse.down = true
    mouse.point.x = event.touches[0].clientX
    mouse.point.y = event.touches[0].clientY
})

addEventListener('touchmove', (event) => {
    mouse.point.x = event.touches[0].clientX
    mouse.point.y = event.touches[0].clientY
})

addEventListener('touchend', () => {
    mouse.down = false
})

addEventListener('click', ({ clientX, clientY }) => {
    mouse.point.x = clientX
    mouse.point.y = clientY
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

let spawnI = 0
function randomSpawnPoint(): Point {
    spawnI++
    return spawnPoints[spawnI % spawnPoints.length].clone()
}

function nextSong() {
    switch (backgroundMusic.src) {
        case albatrossSongURL: default:
            backgroundMusic.src = movingMiamiSongURL
            backgroundMusic.volume = 0.4
            break
        case movingMiamiSongURL:
            backgroundMusic.src = inCloudsSongURL
            backgroundMusic.volume = 0.33
            break
        case inCloudsSongURL:
            backgroundMusic.src = albatrossSongURL
            backgroundMusic.volume = 0.5
            break
    }
    if (!scene.boss) {
        backgroundMusic.pause()
        backgroundMusic.load()
        backgroundMusic.play()
    }
}