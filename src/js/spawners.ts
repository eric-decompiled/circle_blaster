import gsap from 'gsap'
import { Point } from "./models/base"
import { Boss, Enemy, HomingEnemy, OscilatingEnemy } from "./models/enemies"
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
}

const spawnEnemy = (enemies: Enemy[], level: number, target: Point, center: Point) => {
    let e: Enemy
    if (Math.random() < 0.30) {
        e = new HomingEnemy(randomSpawnPoint(), target, level)
    } else if (Math.random() < 0.20) {
        e = new OscilatingEnemy(randomSpawnPoint(), target, level)
    } else {
        e = new Enemy(randomSpawnPoint(), center, level,)
    }
    e = new Enemy(randomSpawnPoint(), center, level,)
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

function initSpawnPoints(width: number, height: number) {
    spawnPoints = [
        new Point(0, 0),
        new Point(width / 4, 0),
        new Point(width / 2, 0),
        new Point(3 * width / 4, 0),
        new Point(width, 0),
        new Point(0, height / 3),
        new Point(0, 2 * height / 3),
        new Point(0, height),
        new Point(width / 4, height),
        new Point(width / 2, height),
        new Point(3 * width / 4, height),
        new Point(width, height / 3),
        new Point(width, 2 * height / 3),
        new Point(width, height),
    ]
}

function spawnPowerUp(powerUps: PowerUp[], target: Point) {
    powerUps.push(new PowerUp(randomSpawnPoint(), target))
}

let spawnI = 0
function randomSpawnPoint(): Point {
    spawnI++
    return spawnPoints[spawnI % spawnPoints.length].clone()
}