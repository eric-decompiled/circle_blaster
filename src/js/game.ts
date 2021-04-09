import { Player, Projectile } from './models/player'
import { PowerUp } from './models/powerups'
import { BackgroundParticles, Particles } from './models/particles'
import { Circle, Color, Point } from './models/base'
import { Keys, Mouse } from './input'
import {
    gameStarted,
    inforBarEl,
    startGameBtn,
} from './ui'
import { Scene } from './models/scene'
import { initSpawnPoints, spawnBoss, spawnEnemies, spawnPowerUp } from '../spawners'


const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = innerWidth
canvas.height = innerHeight - inforBarEl.clientHeight
// Sound FX
const obtainPowerupAudio = new Audio('./audio/powerup.mp3')
const maxShotsAudio = new Audio('./audio/cancel.mp3')

const playerColor = new Color(0, 0, 100)
let scene: Scene
let animationId: number
let player: Player
let powerUps: PowerUp[]
let particles: Particles
let enemies: any[]
let projectiles: Projectile[]
let backgroundParticles: BackgroundParticles
let mouse: Mouse
let keys: Keys
let frame = 0
let powerupTimeout = setTimeout(() => { }, 0) // let type inference do its thing
let center: Point
let topLeft: Point
let bottomRight: Point

function init() {
    mouse = new Mouse()
    keys = new Keys()
    if (scene) {
        scene = new Scene(scene.bgMusic)
    } else {
        scene = new Scene()
    }
    player = new Player(center, playerColor, keys)
    projectiles = []
    particles = new Particles()
    enemies = []
    powerUps = []
    sizeWindow()
    initSpawnPoints(canvas.width, canvas.height)
}

sizeWindow()

function sizeWindow() {
    canvas.width = innerWidth
    canvas.height = innerHeight - inforBarEl.clientHeight
    topLeft = new Point(0, 0)
    bottomRight = new Point(canvas.width, canvas.height)
    center = new Point(canvas.width / 2, canvas.height / 2)
    backgroundParticles = new BackgroundParticles(topLeft, bottomRight)
    backgroundParticles.update(c, center)
}

function animate() {
    animationId = requestAnimationFrame(animate)
    c.fillStyle = 'rgba(0, 0, 0, 0.5)' // create motion blur effect
    c.fillRect(0, 0, canvas.width, canvas.height)
    if (frame % 25 && enemies.length === 0) spawnEnemies(enemies, 1, player.center, center)
    if (frame % 750 === 0) {
        scene.setLevel()
        spawnEnemies(enemies, scene.level, player.center, center)
        if (Math.random() < 0.20) spawnPowerUp(powerUps, center)
        if (scene.level >= 5) {
            let b = spawnBoss(enemies, scene, player.center)
            setTimeout(() => enemies.push(b), 11000)
        }
    }
    frame++
    updateBackgroundParticles()
    updateEnemies()
    updateParticles()
    updatePowerups()
    updateProjectiles()
    updatePlayer()
}

function updateParticles() {
    particles.update(c)
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
        if (!enemy) return // protect against undefined bug
        const dist = player.distanceBetween(enemy)
        if (dist < 1) scene.endGame(animationId)
        enemy.update(c)
        // check if enemy hit any projectiles
        projectiles.forEach((projectile) => {
            const dist = projectile.distanceBetween(enemy)
            if (dist < 1) {
                const splashAmount = Math.max(16, enemy.radius / 6)
                const splashAngle = -projectile.center.angleTo(enemy.center)
                particles.create(projectile.center, enemy.color, splashAmount, splashAngle)
                particles.create(projectile.center, projectile.color, 4, splashAngle)

                projectile.collide(enemy.color.h)
                projectile.resolveCollision(enemy)
                enemy.velocity.x *= 0.6
                enemy.velocity.y *= 0.6
                projectile.velocity.x *= 0.9
                projectile.velocity.y *= 0.9
                const destroyed = enemy.hit(projectile.power)
                if (destroyed) {

                    if (enemy.color !== scene.color) {
                        backgroundParticles.reset(enemy.color)
                        player.leash()
                        scene.color = enemy.color
                    }
                    scene.addScore(enemy.center, enemy.points)

                    // extra splash for kill
                    const splashAmount = Math.random() * 12 + 6
                    const speed = 3
                    particles.create(projectile.center, enemy.color, splashAmount, splashAngle, speed)

                    // win condition
                    if (enemy.isBoss) { scene.winGame(animationId) }

                    // remove enemy after some time for it to fade 
                    setTimeout(() => enemies = enemies.filter(e => e && e.id !== enemy.id), 0)
                } else {
                    scene.addScore(projectile.center, 100)
                    projectile.power += 6
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
            if (!e) continue
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
                    particles.create(collisionPoint, enemy.color, 4, angle + Math.PI)
                    particles.create(collisionPoint, e.color, 4, angle)
                }
            }
        }
    })
}

function updateBackgroundParticles() {
    backgroundParticles.update(c, player.center)
    // unlock player speed up if they touch enough dots
    if (backgroundParticles.litCount / backgroundParticles.count > 0.60 && !player.isUnleashed) {
        player.unleash()
        backgroundParticles.touchAll()
    }
}

function updateProjectiles() {
    projectiles.forEach(projectile => {
        resolveWallCollisions(projectile)

        // remove projectiles that have bounced to many times
        if (projectile.collisions > 4) setTimeout(() => {
            particles.create(projectile.center, projectile.color, 24, Math.random() * Math.PI * 2)
            projectiles = projectiles.filter(p => p.id !== projectile.id)
        }, 0)
        projectile.update(c)
    })
}

function updatePowerups() {
    powerUps.forEach((powerUp, index) => {
        if (powerUp.distanceBetween(player) < 1) {
            obtainPowerupAudio.play()
            clearTimeout(powerupTimeout)
            player.powerUp = 'Automatic'
            player.setborder(new Color(46, 65, 52))
            powerUps.splice(index, 1)
            powerupTimeout = setTimeout(() => {
                player.powerUp = ''
                player.setborder(undefined)
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

startGameBtn.addEventListener('click', (event) => {
    init()
    event.stopPropagation()
    scene.active = true
    gameStarted()
    animate()
})


addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight
    init()
})

addEventListener('click', () => {
    if (scene.active) {
        if (projectiles.length < player.maxShots) {
            projectiles.push(player.shoot(mouse))
        } else {
            maxShotsAudio.play()
        }
    }
})