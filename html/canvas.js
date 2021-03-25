const canvas = document.querySelector('canvas')
const scoreEl = document.querySelector('#scoreEl')
const levelEl = document.querySelector('#levelEl')
const modalEl = document.querySelector('#modalEl')
const bigScoreEl = document.querySelector('#bigScoreEl')
const startGameBtn = document
    .querySelector('#startGameBtn')
const startGameAudio = new Audio('./audio/start.mp3')
const endGameAudio = new Audio('./audio/end.mp3')
const shootAudio = new Audio('./audio/shoot.mp3')
const enemyHitAudio = new Audio('./audio/hit.mp3')
const explodeEnemyAudio = new Audio('./audio/explode.mp3')
const obtainPowerupAudio = new Audio('./audio/powerup.mp3')
const backgroundMusic = new Audio('./audio/background.mp3')
const alternateMusic = new Audio('./audio/alternate.mp3')
const bossMusic = new Audio('./audio/boss.mp3')
backgroundMusic.loop = true
const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'

const scene = {
    active: false,
    midpoint: false
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

class Player {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.powerUp = ''
        this.color = color
        this.friction = 0.96
        this.velocity = {
            x: 0,
            y: 0
        }
        this.speed = 0.25
        this.power = 15
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    shoot({ x, y }, color = 'white') {
        const angle = Math.atan2(y - this.y, x - this.x)
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }
        shootAudio.cloneNode().play()
        const projectile = new Projectile(this.x, this.y, 5, color, velocity)
        projectiles.push(projectile)
    }

    update() {
        this.draw()
        if (keys.up) this.velocity.y -= this.speed
        if (keys.down) this.velocity.y += this.speed
        if (keys.right) this.velocity.x += this.speed
        if (keys.left) this.velocity.x -= this.speed
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        if (this.x - this.radius + this.velocity.x > 0 && this.x + this.radius + this.velocity.x < canvas.width) {
            this.x += this.velocity.x
        } else {
            this.velocity.x = 0
        }

        if (this.y - this.radius + this.velocity.y > 0 && this.y + this.radius + this.velocity.y < canvas.height) {
            this.y += this.velocity.y
        } else {
            this.velocity.y = 0
        }
    }
}

class PowerUp {
    constructor(x, y, velocity) {
        this.x = x
        this.y = y
        this.velocity = velocity
        this.width = 14
        this.height = 19
        this.radians = 0
    }

    draw() {
        c.save()
        // rotate effect
        // c.translate(this.x + this.width / 2, this.y + this.height / 2)
        // c.rotate(this.radians)
        // c.translate(-this.x - this.width / 2, -this.y - this.height / 2)
        c.drawImage(powerUpImg, this.x, this.y, 14, 18)
        // c.restore()
    }

    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
        this.friction = 0.99
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= 0.01
        this.draw()
    }
}

class BackgroundParticle {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.alpha = 0.05
        this.initialAlpha = this.alpha
    }

    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update() {
        this.draw()
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity, level) {
        this.x = x
        this.y = y
        this.level = level
        this.bounsPoints = 0
        this.radius = radius + level * 10
        this.spinRadius = (Math.random() * 50) + 25
        this.spinRate = 0.05
        this.color = color
        this.velocity = velocity
        this.type = 'linear'
        this.center = { x, y }
        this.radians = 0
        this.baseSpeed = level * 0.95

        if (Math.random() < 0.35) {
            this.type = 'homing'
            if (Math.random() < 0.25) {
                this.type = 'spinning'
                if (Math.random() < 0.3) {
                    this.type = 'homingSpinning'
                    this.bounsPoints += 250
                }
            }
        }
    }

    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    update() {
        this.draw()
        if (this.type === 'homing') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x)
            this.velocity = {
                x: Math.cos(angle) * this.baseSpeed,
                y: Math.sin(angle) * this.baseSpeed
            }
            this.x += this.velocity.x
            this.y += this.velocity.y
        } else if (this.type === 'spinning') {
            this.radians += this.spinRate
            this.x = this.center.x + Math.cos(this.radians) * this.spinRadius
            this.y = this.center.y + Math.sin(this.radians) * this.spinRadius
            this.center.x += this.velocity.x * this.baseSpeed
            this.center.y += this.velocity.y * this.baseSpeed
        } else if (this.type === 'homingSpinning') {
            this.radians += this.spinRate
            const angle = Math.atan2(player.y - this.y, player.x - this.x)
            this.velocity = {
                x: Math.cos(angle) * this.baseSpeed,
                y: Math.sin(angle) * this.baseSpeed
            }
            this.center.x += this.velocity.x
            this.center.y += this.velocity.y

            this.x = this.center.x + Math.cos(this.radians) * this.spinRadius
            this.y = this.center.y + Math.sin(this.radians) * this.spinRadius
        }

    }
}

function init() {
    frame = 0
    level = 1
    levelEl.innerHTML = level
    player = new Player(canvas.width / 2, canvas.height / 2, 10, 'white')
    projectiles = []
    particles = []
    enemies = []
    powerUps = []
    backgroundParticles = []
    let spacing = 30
    let xDots = Array(Math.trunc(canvas.width / spacing)).keys()
    for (const x in [...xDots]) {
        let yDots = Array(Math.trunc(canvas.height / spacing)).keys()
        for (const y in [...yDots]) {
            backgroundParticles.push(new BackgroundParticle(x * spacing, y * spacing, 3, 'blue'))
        }
    }
}

function createScoreLabel(projectile, score) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.right = projectile.x
    scoreLabel.style.bottom = projectile.y
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
    const radius = Math.random() * (60 - 10) + 10
    let x
    let y
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
        y = Math.random() * canvas.height
    } else {
        x = Math.random() * canvas.height
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
    }
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    const color = `hsl(${Math.random() * 360}, 50%, 50%`
    enemies.push(new Enemy(x, y, radius, color, velocity, level))
}

function spawnPowerups() {
    let x
    let y
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - 7 : canvas.width - 7
        y = Math.random() * canvas.height
    } else {
        x = Math.random() * canvas.height
        y = Math.random() < 0.5 ? 0 - 9 : canvas.height - 9
    }
    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }
    powerUps.push(new PowerUp(x, y, velocity))
}

function animate() {
    animationId = requestAnimationFrame(animate)
    frame++
    // if (!scene.midpoint && level > 1) {
    //     scene.midpoint = true
    //     gsap.to(alternateMusic, {
    //         volume: 0,
    //         duration: 8,
    //         onComplete: () => {
    //             alternateMusic.pause()
    //         }
    //     })
    //     backgroundMusic.play()
    //     backgroundMusic.volume = 0
    //     gsap.to(backgroundMusic, {
    //         volume: 1.0,
    //         duration: 8
    //     })
    // }
    if (frame % 250 === 0) {
        if (score > 500) level = 2
        if (score > 20000) level = 3
        if (score > 50000) level = 4
        if (score > 100000) level = 5
        if (score > 250000) level = 6
        if (score > 1000000) level = 7
        levelEl.innerHTML = level
        spawnEnemy(1)
        if (level > 1) spawnEnemy(1)
        if (level > 2) spawnEnemy(2)
        if (level > 3) spawnEnemy(3)
        if (level > 4 && frame % 500 === 0) spawnEnemy(3)
        if (level > 5 && frame % 500 === 0) spawnEnemy(4)
        if (level > 6) spawnEnemy(4)
        if (level > 7) spawnEnemy(5)

    }
    if (frame % 750 === 0) spawnPowerups()
    c.fillStyle = 'rgba(0, 0, 0, 0.2)'
    c.fillRect(0, 0, canvas.width, canvas.height)
    backgroundParticles.forEach(p => {
        const dist = Math.hypot(player.x - p.x, player.y - p.y)
        const hideRadius = 100
        if (dist < hideRadius) {
            if (dist < 70) {
                p.alpha = 0
            } else {
                p.alpha = 0.5
            }
        } else if (dist >= hideRadius && p.alpha > p.initialAlpha) {
            p.alpha -= 0.01
        } else if (p.alpha < p.initialAlpha) {
            p.alpha += 0.1
        }
        p.update()
    })
    player.update()
    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y)
        if (dist - player.radius - powerUp.width / 2 < 1) {
            obtainPowerupAudio.cloneNode().play()
            player.powerUp = 'Automatic'
            player.color = '#FFF500'
            powerUps.splice(index, 1)
            setTimeout(() => {
                player.powerUp = ''
                player.color = '#FFF'
            }, 5000)
        } else {
            powerUp.update()
        }
    })
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1)
        } else {
            particle.update()
        }
    })
    if (player.powerUp === 'Automatic' && mouse.down) {
        if (frame % 4 === 0) {
            player.shoot(mouse, '#FFF500')
        }
    }
    projectiles.forEach((projectile, index) => {
        projectile.update()
        // gc
        if (
            projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height
        ) {
            setTimeout(() => {
                projectiles.splice(index, 1)
            }, 0)
        }
    })
    enemies.forEach((enemy, index) => {
        enemy.update()

        // end game
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y)
        if (dist - enemy.radius - player.radius < 1) {
            cancelAnimationFrame(animationId)
            modalEl.style.display = 'flex'
            bigScoreEl.innerHTML = score
            endGameAudio.play()
            scene.active = false
            gsap.to('#whiteModalEl', {
                opacity: 1,
                scale: 1,
                duration: 0.35,
            })
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
            // when projectile touches an enemy
            if (dist - enemy.radius - projectile.radius < 0.25) {
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(
                        new Particle(
                            projectile.x,
                            projectile.y,
                            Math.random() * 2,
                            enemy.color,
                            {
                                x: (Math.random() - 0.5) * Math.random(),
                                y: (Math.random() - 0.5) * Math.random()
                            }
                        )
                    )
                }
                // shrink
                if (enemy.radius - player.power > 10) {
                    enemyHitAudio.cloneNode().play()
                    score += 100
                    scoreEl.innerHTML = score
                    createScoreLabel(projectile, 100)
                    gsap.to(enemy, {
                        radius: enemy.radius - player.power
                    })
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1)
                    }, 0)
                } else {
                    explodeEnemyAudio.cloneNode().play()
                    let points = 250 + enemy.bounsPoints
                    if (points === 1) console.log(enemy)
                    score += points
                    scoreEl.innerHTML = score
                    createScoreLabel(projectile, points)
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

const mouse = {
    down: false,
    x: undefined,
    y: undefined,
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
    if (scene.active) player.shoot(mouse, player.color)
})

const keys = {
    up: false,
    down: false,
    right: false,
    left: false
}
startGameBtn.addEventListener('click', () => {
    score = 0
    scoreEl.innerHTML = score
    bigScoreEl.innerHTML = score
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
            // player.velocity.y -= playAcceleration
            break
        case 'KeyA': case 'ArrowLeft':
            keys.left = true
            // player.velocity.x -= playAcceleration
            break
        case 'KeyS': case 'ArrowDown':
            keys.down = true
            // player.velocity.y += playAcceleration
            break
        case 'KeyD': case 'ArrowRight':
            keys.right = true
            // player.velocity.x += playAcceleration
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