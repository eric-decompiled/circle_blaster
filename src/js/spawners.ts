import gsap from 'gsap'
import { Point } from "./models/base"
import { Boss, Enemy, HomingEnemy, OscilatingEnemy, SpinningEnemy } from "./models/enemies"
import { PowerUp } from "./models/powerups"
import { Scene } from "./ui"
import { bossMusicURL } from './music'

export { spawnEnemies, spawnBoss, initSpawnPoints, spawnPowerUp }

const alarmAudio = new Audio('./audio/warning.mp3')
let spawnPoints = []

const spawnEnemies = (enemies: Enemy[], level: number, target: Point, center: Point) => {
    spawnEnemy(enemies, 1, target, center)
    if (level > 1) spawnEnemy(enemies, 1, target, center)
    if (level > 2) spawnEnemy(enemies, 2, target, center)
    if (level > 3) spawnEnemy(enemies, 2, target, center)
    if (level > 4) spawnEnemy(enemies, 3, target, center)
    if (level > 6) spawnEnemy(enemies, 3, target, center)
    if (level > 7) spawnEnemy(enemies, 3, target, center)
    if (level > 8) spawnEnemy(enemies, 4, target, center)
    if (level > 9) spawnEnemy(enemies, 4, target, center)
}

const spawnEnemy = (enemies: Enemy[], level: number, target: Point, center: Point) => {
    let e: Enemy
    if (Math.random() < 0.35) {
        e = new HomingEnemy(randomSpawnPoint(), target, level)
    } else if (level > 1 && Math.random() < 0.20) {
        e = new OscilatingEnemy(randomSpawnPoint(), target, level)
    } else if (level > 2 && Math.random() < 0.1) {
        e = new SpinningEnemy(randomSpawnPoint(), target, level)
    }
    else {
        e = new Enemy(randomSpawnPoint(), center, level)
    }
    enemies.push(e)
}

const spawnBoss = (enemies: Enemy[], scene: Scene, target: Point) => {
    if (scene.boss) return
    scene.boss = true
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
    setTimeout(() => scene.bgMusic.fade(6000), 0)
    setTimeout(() => scene.bgMusic.setSong(bossMusicURL), 10000)
    return new Boss(randomSpawnPoint(), target)
}

function initSpawnPoints(topLeft: Point, bottomRight: Point) {
    let width = bottomRight.x - topLeft.x
    let height = bottomRight.y - topLeft.y
    spawnPoints = [
        new Point(topLeft.x, topLeft.y),
        new Point(topLeft.x + (width / 4), topLeft.y),
        new Point(topLeft.x + (width / 2), topLeft.y),
        new Point(topLeft.x + (3 * width / 4), topLeft.y),
        new Point(topLeft.x + width, topLeft.y),
        new Point(topLeft.x, topLeft.y + height / 3),
        new Point(topLeft.x, 2 * topLeft.y + height / 3),
        new Point(topLeft.x, topLeft.y + height),
        new Point(topLeft.x + width / 4, topLeft.y + height),
        new Point(topLeft.x + width / 2, topLeft.y + height),
        new Point(topLeft.x + 3 * width / 4, topLeft.y + height),
        new Point(topLeft.x + width, topLeft.y + height / 3),
        new Point(topLeft.x + width, 2 * topLeft.y + height / 3),
        new Point(topLeft.x + width, topLeft.y + height),
    ]
}

function spawnPowerUp(powerUps: PowerUp[], target: Point) {
    console.log('spwnin power')
    powerUps.push(new PowerUp(randomSpawnPoint(), target))
}

let spawnI = 0
function randomSpawnPoint(): Point {
    spawnI++
    return spawnPoints[spawnI % spawnPoints.length].clone()
}