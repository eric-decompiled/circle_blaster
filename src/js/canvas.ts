import gsap from 'gsap'
import { Player } from './models/player'
import { Enemy, Boss } from './models/enemies'
import { PowerUp } from './models/powerups'
import { Projectile, Particle, BackgroundParticle } from './models/particles'

const canvas = document.querySelector('canvas')
const scoreEl = document.querySelector('#scoreEl')
const levelEl = document.querySelector('#levelEl')
const modalEl = document.querySelector('#modalEl') as HTMLElement
const bigScoreEl = document.querySelector('#bigScoreEl')
const comboContainer = document.querySelector('#comboContainer') as HTMLElement
const comboEl = document.querySelector('#comboEl')
const startGameBtn = document.querySelector('#startGameBtn')
const startGameAudio = new Audio('./audio/start.mp3')
const endGameAudio = new Audio('./audio/altEnd.mp3')
const comboBreak = new Audio('./audio/destroy.mp3')
const destroyEnemy = new Audio('./audio/continue.mp3')
const obtainPowerupAudio = new Audio('./audio/powerup.mp3')
const backgroundMusic = new Audio('./audio/alternate.mp3')
backgroundMusic.volume = 0.50
backgroundMusic.loop = true
const bossMusic = new Audio('./audio/altBoss.mp3')
bossMusic.loop = true
const alarmAudio = new Audio('./audio/warning.mp3')

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
canvas.height = innerHeight
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
let particleCount: number
let litCount: number
let powerupTimeout = setTimeout(() => { }, 0) // let type inference do its thing

function init() {
    score = 0
    combo = 0
    frame = 0
    level = 1
    endGameAudio.pause()
    endGameAudio.currentTime = 0
    gsap.to(bossMusic, {
        volume: 0,
        duration: 4,
        onComplete: () => {
            bossMusic.pause()
            bossMusic.currentTime = 0
            bossMusic.volume = 1.0
        }
    })
    backgroundMusic.currentTime = 0
    backgroundMusic.volume = 0.5
    backgroundMusic.play()
    scene.boss = false
    levelEl.innerHTML = level.toString()
    comboContainer.style.display = 'none'
    player = new Player(canvas, 10, 'ivory')
    projectiles = []
    particles = []
    enemies = []
    powerUps = []
    backgroundParticles = []
    let spacing = 30
    for (var i = spacing / 2; i < canvas.width; i += spacing) {
        for (let j = spacing / 2; j < canvas.height; j += spacing) {
            backgroundParticles.push(new BackgroundParticle(i, j, 3, 'ivory'))
        }
    }
    particleCount = backgroundParticles.length
    litCount = 0
}
function animate() {
    animationId = requestAnimationFrame(animate)
    frame++
    if (frame % 250 === 0) {
        spawnEnemies(level)
    }
    if (frame % 1250 === 0) {
        setLevel(score)
        spawnPowerUp()
    }
    c.fillStyle = 'rgba(0, 0, 0, 0.5)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    // animate background dots
    backgroundParticles.forEach(bp => {
        const dist = Math.hypot(player.x - bp.x, player.y - bp.y)
        const hideRadius = 125
        if (dist < hideRadius) {
            // hide close particles, illuminate radius
            bp.alpha = dist < 70 ? 0 : 0.35
            if (!bp.touched) {
                litCount += 1
                bp.touched = true
                if (litCount / particleCount > 0.50) {
                    player.unleash(bp.color)
                    backgroundParticles.forEach(bp => bp.touch())
                }
            }
        }
        bp.update(c)
    })
    player.update(c, keys)
    if (player.powerUp === 'Automatic' && mouse.down && frame % 4 === 0) {
        projectiles.push(player.shoot(mouse))
    }
    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y)
        if (dist - player.radius - powerUp.width / 2 < 1) {
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
    })
    // remove particles when they are no longer visible
    particles.forEach((p, i) => p.alpha <= 0 ? particles.splice(i, 1) : p.update(c))
    // remove projectiles out of bounds
    projectiles.forEach((projectile, index) => {
        projectile.update(c)
        // gc out of bounds projectiles
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => projectiles.splice(index, 1), 0)
        }
    })
    enemies.forEach((enemy, index) => {
        // pass in player coordinates for homing
        enemy.update(c, player.x, player.y)

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (dist - enemy.radius - player.radius < 1) endGame()

        // check if enemy hit any projectiles
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            if (dist - enemy.radius - projectile.radius < 0.1 && enemy.radius > 0) {
                const splashAmount = Math.max(16, enemy.radius / 8)
                const splashAngle = Math.atan2(projectile.y - enemy.y, projectile.x - enemy.x)
                hitSplash(projectile, enemy.color, splashAmount, splashAngle)
                setTimeout(() => projectiles.splice(projectileIndex, 1), 0)
                if (enemy.hit(projectile.power)) {
                    // i.e. enemy survived hit
                    addScore(100, projectile)
                } else {
                    enemy.color === scene.color ? continueCombo() : breakCombo(enemy)
                    const splashAmount = Math.random() * 18 + 6
                    hitSplash(projectile, enemy.color, splashAmount, splashAngle)
                    addScore(enemy.points, projectile)
                    setTimeout(() => {
                        const enemyIndex = enemies.findIndex(e => e.id === enemy.id)
                        if (enemyIndex >= 0) enemies.splice(enemyIndex, 1)
                    }, 250)
                }
            }
        })
    })
}

function createScoreLabel(projectile: Projectile, score: number) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score.toString()
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = projectile.x + 'px'
    scoreLabel.style.top = projectile.y + 'px'
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

function addScore(basePoints: number, projectile: Projectile) {
    let multiplier = 1 + (combo > 5 ? combo / 10 : 0)
    const points = (basePoints * multiplier) | 0 // bitwise or 0 casts to int
    score += points
    scoreEl.innerHTML = score.toString()
    createScoreLabel(projectile, points)
}

function spawnEnemy(level: number) {
    enemies.push(new Enemy(canvas.width, canvas.height, level))
}

function spawnBoss() {
    scene.boss = true
    gsap.to(backgroundMusic, {
        volume: 0.0,
        duration: 6,
        onComplete: () => {
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
    enemies.push(new Boss(canvas.width, canvas.height))
}

function spawnEnemies(level: number) {
    spawnEnemy(1)
    if (level > 1) spawnEnemy(1)
    if (level > 2) spawnEnemy(2)
    if (level > 3 && !scene.boss) spawnEnemy(3)
    if (level > 4 && !scene.boss) spawnBoss()
}

function setLevel(score: number) {
    if (score > 5000) level = 2
    if (score > 10000) level = 3
    if (score > 25000) level = 4
    if (score > 50000) level = 5
    if (score > 250000) level = 6
    if (score > 1000000) level = 7
    levelEl.innerHTML = level.toString()
}

function spawnPowerUp() {
    powerUps.push(new PowerUp(canvas))
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

function hitSplash(projectile: Projectile, color: string, amount: number, angle: number) {
    // particles should be bias to break away from enemy
    const xBias = Math.cos(angle) * 1.1
    const yBias = Math.sin(angle) * 1.1
    for (let i = 0; i < amount; i++) {
        particles.push(
            new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 2,
                color,
                {
                    x: (Math.random() - 0.5) + xBias,
                    y: (Math.random() - 0.5) + yBias
                }
            )
        )
    }
}

function continueCombo() {
    let destroySound = destroyEnemy.cloneNode() as HTMLAudioElement
    destroySound.volume = 0.75
    destroySound.play()
    combo += 1
    if (combo >= 3) {
        comboContainer.style.display = 'inline'
        comboEl.innerHTML = combo.toString()
    }
}

function breakCombo(enemy: Enemy) {
    combo = 0
    const breakSound = comboBreak.cloneNode() as HTMLAudioElement
    breakSound.volume = 0.25
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
    litCount = 0
    scene.color = enemy.color
    comboContainer.style.display = 'none'
}
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
    if (scene.active) projectiles.push(player.shoot(mouse))
})

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