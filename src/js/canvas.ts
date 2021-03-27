import gsap from 'gsap'
import { Player } from './models/player'
import { Enemy, Boss } from './models/enemies'
import { PowerUp } from './models/powerups'
import { Particle, BackgroundParticle } from './models/particles'

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
const enemyHitAudio = new Audio('./audio/hit.mp3')
const comboBreak = new Audio('./audio/destroy.mp3')
const destroyEnemy = new Audio('./audio/continue.mp3')
const obtainPowerupAudio = new Audio('./audio/powerup.mp3')
const backgroundMusic = new Audio('./audio/background.mp3')
const alternateMusic = new Audio('./audio/alternate.mp3')
alternateMusic.volume = 0.50
const bossMusic = new Audio('./audio/altBoss.mp3')
bossMusic.loop = true
const alarmAudio = new Audio('./audio/warning.mp3')
alternateMusic.loop = true
backgroundMusic.loop = true

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
let animationId
let player
let powerUps = []
let particles = []
let enemies = []
let projectiles = []
let backgroundParticles = []
let frame = 0
let score = 0
let level = 1
let combo = 0
let particleCount
let litCount

function init() {
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
    alternateMusic.currentTime = 0
    alternateMusic.volume = 0.5
    alternateMusic.play()
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
    for (var i = spacing/2; i < canvas.width; i += spacing) {
        for (let j = spacing/2; j < canvas.height; j += spacing) {
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
        setLevel(score)
        spawnEnemies(level)
    }
    if (frame % 750 === 0) spawnPowerUp()
    c.fillStyle = 'rgba(0, 0, 0, 0.2)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    backgroundParticles.forEach(bp => {
        const dist = Math.hypot(player.x - bp.x, player.y - bp.y)
        const hideRadius = 125
        if (dist < hideRadius) {
            if (dist < 70) {
                bp.alpha = 0
                if (!bp.touched) {
                    litCount += 1
                    bp.touched = true
                    if (litCount / particleCount > 0.50 && player.leashed) {
                        player.unleash()
                        backgroundParticles.forEach(bp => bp.alpha = Math.random())
                    }
                }
            } else {
                bp.alpha = 0.5
            }
        } else if (dist >= hideRadius && bp.alpha > bp.initialAlpha) {
            bp.alpha -= 0.10
        } else if (bp.alpha < bp.initialAlpha) {
            bp.alpha += 0.25
        }
        bp.update(c)
    })
    player.update(c, keys)
    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y)
        if (dist - player.radius - powerUp.width / 2 < 1) {
            let obtainSound = obtainPowerupAudio.cloneNode() as HTMLAudioElement
            obtainSound.play()
            player.powerUp = 'Automatic'
            player.color = '#FFF500'
            powerUps.splice(index, 1)
            setTimeout(() => {
                player.powerUp = ''
                player.color = '#FFF'
            }, 5000)
        } else {
            powerUp.update(c)
        }
    })
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update(c)
        }
    })
    if (player.powerUp === 'Automatic' && mouse.down) {
        if (frame % 4 === 0) {
            projectiles.push(player.shoot(mouse))
        }
    }
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

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            // when projectile touches an enemy
            if (dist - enemy.radius - projectile.radius < 0.25) {
                hitSplash(projectile, enemy)
                if (enemy.radius - projectile.power > 10) {
                    let hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
                    hitSound.volume = 0.33
                    hitSound.play()
                    score += 100
                    scoreEl.innerHTML = score.toString()
                    createScoreLabel(projectile, 100)
                    enemy.hit(projectile.power)
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                } else {
                    let destroySound = destroyEnemy.cloneNode() as HTMLAudioElement
                    destroySound.volume = 0.9
                    destroySound.play()
                    let multiplier = 1
                    let points = enemy.points
                    if (enemy.color === scene.color) {
                        combo += 1
                        if (combo >= 3) {
                            comboContainer.style.display = 'inline'
                            comboEl.innerHTML = combo.toString()
                            multiplier += combo / 10
                        }
                    } else {
                        breakCombo(enemy)
                    }
                    points = Math.floor(points * multiplier)
                    score += points
                    scoreEl.innerHTML = score.toString()
                    createScoreLabel(projectile, points)
                    setTimeout(() => {
                        const enemyFound = enemies.find(enemyValue => {
                            return enemyValue === enemy
                        })
                        if (enemyFound) {
                            enemies.splice(index, 1)
                            projectiles.splice(projectileIndex, 1)
                        }
                    })
                }
            }
        })
    })
}


addEventListener('mousedown', (event) => {
    mouse.down = true
    mouse.x = event.clientX
    mouse.y = event.clientY
})

addEventListener('mousemove', (event) => {
    mouse.x = event.clientX
    mouse.y = event.clientY
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
    event.stopPropagation()
    score = 0
    scoreEl.innerHTML = score.toString()
    bigScoreEl.innerHTML = score.toString()
    init()
    animate()
    startGameAudio.play()
    alternateMusic.play()
    scene.active = true
    gsap.to('#whiteModalEl', {
        opacity: 0,
        scale: 0.75,
        ease: 'expo',
        duration: 0.25,
        onComplete: () => {
            modalEl.style.display = 'none'
        }
    })
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

function createScoreLabel(projectile, score) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = projectile.x + 'px'
    scoreLabel.style.top = projectile.y + 'px'
    document.body.appendChild(scoreLabel)
    gsap.to(scoreLabel, {
        opacity: 0,
        y: -50,
        duration: 1,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

function spawnEnemy(level) {
    enemies.push(new Enemy(canvas.width, canvas.height, level))
}

function spawnBoss() {
    scene.boss = true
    gsap.to(alternateMusic, {
        volume: 0.0,
        duration: 6,
        onComplete: () => {
            alternateMusic.currentTime = 0
            alternateMusic.pause()
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

function spawnEnemies(level) {
    spawnEnemy(1)
    if (level > 1) spawnEnemy(2)
    if (level > 2) spawnEnemy(3)
    if (level > 3) spawnEnemy(4)
    if (level > 4 && !scene.boss) spawnBoss()
}


function setLevel(score) {
    if (score > 5000) level = 2
    if (score > 20000) level = 3
    if (score > 30000) level = 4
    if (score > 100000) level = 5
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

function hitSplash(projectile, enemy) {
    for (let i = 0; i < Math.max(16, enemy.radius); i++) {
        particles.push(
            new Particle(
                projectile.x,
                projectile.y,
                Math.random() * 2,
                enemy.color,
                {
                    x: (Math.random() - 0.5) * Math.random() * 3,
                    y: (Math.random() - 0.5) * Math.random() * 3
                }
            )
        )
    }
}

function breakCombo(enemy) {
    combo = 0
    let breakSound = comboBreak.cloneNode() as HTMLAudioElement
    breakSound.volume = 0.75
    breakSound.play()
    player.leash()
    backgroundParticles.forEach(p => {
        p.color = enemy.color
        gsap.to(p, {
            alpha: 0.25,
            duration: 0.015,
            onComplete: () => {
                gsap.to(p, {
                    alpha: p.initialAlpha,
                    duration: 0.03
                })
            }
        })
    })
    litCount = 0
    scene.color = enemy.color
    comboContainer.style.display = 'none'
}