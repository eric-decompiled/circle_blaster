import { Circle, Point, Velocity, randomColor, Color } from './base'
export {
    Enemy,
    HomingEnemy,
    OscilatingEnemy,
    Boss
}

const minEnemySize = 16
const enemyHitAudio = new Audio('./audio/hit.mp3')
const enemyDestroyedAudio = new Audio('./audio/destroy.mp3')
enemyDestroyedAudio.volume = 0.33

class Enemy extends Circle {
    public id: number
    public points: number
    public inPlay: boolean
    // give enemy so long to become inPlay
    public ttl: number
    protected baseSpeed: number
    protected target: Point
    constructor(spawnPoint: Point, target: Point, level: number) {
        const radius = Math.max(minEnemySize, Math.random() * (40 - 10))
        super(
            spawnPoint,
            2 * (radius + level * 10),
            randomColor(),
        )
        this.ttl = 150
        this.friction = 0.997
        this.target = target
        this.points = 200 + level * 50
        this.baseSpeed = 0.85 + (Math.random() * 0.25)
        this.inPlay = false
        const angle = this.center.angleTo(target)
        this.velocity = new Velocity(
            Math.cos(angle) * this.baseSpeed * 4,
            Math.sin(angle) * this.baseSpeed * 4
        )
    }

    hit(amount: number): boolean {
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.33
        hitSound.play()
        this.radius -= amount
        const destroyed = this.radius < minEnemySize
        if (destroyed) enemyDestroyedAudio.play()
        return destroyed
    }

    collide() { } // only used for oscilating enemy
}

class HomingEnemy extends Enemy {
    constructor(spawn: Point, target: Point, level: number) {
        super(spawn, target, level)
        this.border = new Color(328, 60, 54)
    }
    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        const angle = this.center.angleTo(this.target)
        this.velocity.x += Math.cos(angle) * this.baseSpeed * .12
        this.velocity.y += Math.sin(angle) * this.baseSpeed * .12
        this.velocity.x *= 0.96
        this.velocity.y *= 0.96
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
    }
}

class OscilatingEnemy extends Enemy {
    private drive: Velocity
    constructor(spawn: Point, target: Point, level: number) {
        super(spawn, target, level)
        this.drive = new Velocity(this.velocity.x, this.velocity.y)
        this.border = new Color(258, 40, 60)
        this.baseSpeed = 1.25 + 0.10 * level
    }
    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.center.x += this.velocity.x * this.baseSpeed
        this.center.y += this.velocity.y * this.baseSpeed
        this.velocity.x += this.drive.x * 0.10
        this.velocity.y += this.drive.y * 0.10
        this.velocity.x *= 0.90
        this.velocity.y *= 0.92
    }

    collide() {
        if (Math.random() < 0.5) {
            this.drive.x = -this.drive.x
        } else {
            this.drive.y = -this.drive.y
        }
        this.velocity.x = 0
        this.velocity.y = 0
    }
}

class Boss extends Enemy {
    public points: number
    public isBoss: true
    private frame: number
    constructor(spawnPoint: Point, protected target: Point) {
        super(
            spawnPoint,
            target,
            8
        )
        this.radius = Math.min(150, this.radius)
        this.baseSpeed = 2.5
        this.points = 1000
        this.frame = 0
        this.isBoss = true
        this.ttl = 99999999 // boss should never be removed because of time
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.frame++
        let h = this.frame % 360
        let s = (this.frame % 20) + 40
        this.color = new Color(h, s, 50)
        const angle = this.center.angleTo(this.target)
        this.velocity = new Velocity(
            Math.cos(angle) * this.baseSpeed,
            Math.sin(angle) * this.baseSpeed
        )
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
    }

    hit(amount: number) {
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.4
        hitSound.play()
        this.radius -= 1
        const destroyed = this.radius < minEnemySize
        if (destroyed) enemyDestroyedAudio.play()
        return destroyed
    }
}