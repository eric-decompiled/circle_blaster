import { Player, Projectile } from './models/player'
import { PowerUp } from './models/powerups'
import { Particles } from './models/particles'
import { Circle, Color, Point } from './models/base'
import { Keys, Mouse } from './input'
import {
    Scene,
    gameStarted,
    startGameBtn,
    continueGameBtn,
    gameContinued,
    canvas,
    ctx,
    topLeft,
    bottomRight,
    center,
    sizeWindow,
    backgroundParticles,
    offSet,
} from './ui'
import { initSpawnPoints, spawnBoss, spawnEnemies, spawnPowerUp } from './spawners'
import { Enemy } from './models/enemies'
import { playBounceSound, playNoAmmoSound, playPowerUpSound } from './sounds'

const playerColor = new Color(0, 0, 100)
let scene: Scene
let animationId: number
let player: Player
let powerUps: PowerUp[]
let particles: Particles
let enemies: any[]
let projectiles: Projectile[]
let mouse: Mouse
let keys: Keys
let frame = 0
let powerupTimeout = setTimeout(() => { }, 0) // let type inference do its thing

function init() {
    mouse = new Mouse(offSet)
    keys = new Keys()
    if (scene) {
        scene = new Scene(scene.bgMusic)
    } else {
        scene = new Scene()
    }
    player = new Player(center.clone(), playerColor, keys)
    projectiles = []
    particles = new Particles()
    enemies = []
    powerUps = []
    initSpawnPoints(topLeft, bottomRight)
}

let fpsTarget = 1000 / 30,
    then = Date.now(),
    now: number,
    elapsed: number
function animate() {
    animationId = requestAnimationFrame(animate)
    now = Date.now()
    elapsed = now - then
    if (elapsed > fpsTarget) {
        ctx.fillStyle = 'rgba(0, 0, 8, 0.5)' // create motion blur effect
        ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x, bottomRight.y)
        frame++
        updateBackgroundParticles()
        updateEnemies()
        updateParticles()
        updatePowerups()
        updateProjectiles()
        updatePlayer()
        handleSpawns()
    }
}

function handleSpawns() {

    if (frame % 32 === 0 && enemies.length === 0) spawnEnemies(enemies, 1, player.center, center)
    if (frame % 1024 === 0) {
        // if (Math.random() < 0.25) spawnPowerUp(powerUps, center)

        scene.setLevel()
        spawnEnemies(enemies, scene.level, player.center, center)
        if (!scene.boss && scene.level >= 5) {
            let b = spawnBoss(enemies, scene, player.center)
            setTimeout(() => enemies.push(b), 11000)
        }
    }
}

function updateParticles() {
    particles.update(ctx)
}

function updatePlayer() {
    player.update(ctx)
    resolveWallCollisions(player)
}

function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (!enemy) return // protect against undefined bug
        const dist = player.distanceBetween(enemy)
        // lose game if touching an enemy
        if (dist < 1) scene.endGame(animationId)
        enemy.update(ctx)
        // check if enemy hit any projectiles
        projectiles.forEach((projectile) => {
            const dist = projectile.distanceBetween(enemy)
            if (dist < 1) {
                const splashAmount = Math.max(8, enemy.radius / 24)
                const splashAngle = -projectile.center.angleTo(enemy.center)
                particles.create(projectile.center, enemy.color, splashAmount, splashAngle)
                particles.create(projectile.center, projectile.color, 4, splashAngle)

                projectile.collide(enemy.color.h)
                projectile.resolveCollision(enemy)
                enemy.velocity.throttle(10)

                const destroyed = enemy.hit(projectile.power)
                if (destroyed) {
                    if (enemy.color !== scene.color) {
                        backgroundParticles.reset(enemy.color)
                        player.leash()
                        scene.color = enemy.color
                    }
                    scene.addScore(enemy.center, enemy.points)

                    // extra splash for kill
                    const splashAmount = Math.random() * 12 + 8
                    const speed = 3
                    particles.create(projectile.center, enemy.color, splashAmount, splashAngle, speed)

                    // win condition
                    if (enemy.isBoss) { scene.winGame(animationId) }

                    removeEnemy(enemy)
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
            enemy.ttl -= 1
            if (enemy.ttl < 0) {
                removeEnemy(enemy)
            }
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
                if (e.velocity.speed > 3 || enemy.velocity.speed > 3) {
                    particles.create(collisionPoint, enemy.color, 2, angle + Math.PI)
                    particles.create(collisionPoint, e.color, 2, angle)
                }
            }
        }
    })
}

function removeEnemy(enemy: Enemy) {
    setTimeout(() => enemies = enemies.filter(e => e && e.id !== enemy.id), 0)
}

function updateBackgroundParticles() {
    backgroundParticles.update(ctx, player.center)
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
            particles.create(projectile.center, projectile.color, 6, Math.random() * Math.PI * 2)
            projectiles = projectiles.filter(p => p.id !== projectile.id)
        }, 0)
        projectile.update(ctx)
    })
}

function updatePowerups() {
    powerUps.forEach((powerUp, index) => {
        if (powerUp.distanceBetween(player) < 1) {
            playPowerUpSound()
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
            powerUp.update(ctx)
        }
        if (powerUp.inPlay) {
            resolveWallCollisions(powerUp)
        } else {
            powerUp.inPlay = !(hitXWall(powerUp) || hitYWall(powerUp))
        }
    })
}

function hitXWall(ctx: Circle): boolean {
    return ctx.center.x - ctx.radius + ctx.velocity.x <= topLeft.x ||
        ctx.center.x + ctx.radius + ctx.velocity.x >= bottomRight.x
}

function hitYWall(ctx: Circle): boolean {
    return ctx.center.y - ctx.radius + ctx.velocity.y < topLeft.y ||
        ctx.center.y + ctx.radius + ctx.velocity.y > bottomRight.y
}

function resolveWallCollisions(ctx: Circle): boolean {
    const hitX = hitXWall(ctx)
    const hitY = hitYWall(ctx)
    if (hitX) {
        playBounceSound()
        // ensure enemies dont merge into the wall by adjusting their position
        if (ctx.velocity.x > 0) {
            ctx.center.x = bottomRight.x - ctx.radius
        } else {
            ctx.center.x = topLeft.x + ctx.radius
        }
        ctx.velocity.x = -ctx.velocity.x
        ctx.collisions++
    }
    if (hitY) {
        playBounceSound()
        if (ctx.velocity.y > 0) {
            ctx.center.y = bottomRight.y - ctx.radius
        } else {
            ctx.center.y = topLeft.y + ctx.radius
        }
        ctx.velocity.y = -ctx.velocity.y
        ctx.collisions++
    }
    return hitX || hitY
}

startGameBtn.addEventListener('click', (event) => {
    init()
    event.stopPropagation()
    gameStarted(scene)
    animate()
})

continueGameBtn.addEventListener('click', (event) => {
    event.stopPropagation()
    gameContinued(scene)
    animate()
})


addEventListener('resize', () => {
    sizeWindow(canvas)
    initSpawnPoints(topLeft, bottomRight)
})

function shoot(isEnter: boolean) {
    if (scene && scene.active) {
        if (projectiles.length < player.maxShots) {
            projectiles.push(player.shoot(mouse, isEnter))
        } else {
            playNoAmmoSound()
        }
    }
}

addEventListener('mousedown', () => shoot(false))
addEventListener('keydown', ({ code, repeat }) => {
    if (repeat) return
    switch (code) {
        case 'Enter':
        case 'ShiftLeft':
        case 'ShiftRight':
        case 'NumpadEnter':
            shoot(true)
    }
})