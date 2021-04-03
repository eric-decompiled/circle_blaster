import gsap from 'gsap'
import { Circle, Point, Velocity, randomColor, Color } from './base'
import { Player } from './player'
export {
    Enemy,
    HomingEnemy,
    OscilatingEnemy,
    Boss
}

const minEnemySize = 12
const enemyHitAudio = new Audio('./audio/hit.mp3')

class Enemy extends Circle {
    public id: number
    public points: number
    public inPlay: boolean
    protected baseSpeed: number
    protected target: Point
    constructor(spawnPoint: Point, target: Point, level: number) {
        const radius = Math.max(minEnemySize, Math.random() * (40 - 10))
        super(
            spawnPoint,
            2 * (radius + level * 10),
            randomColor(),
        )
        this.target = target
        this.points = 200 + level * 50
        this.baseSpeed = 0.75 + (Math.random() * 0.25)
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
        return this.radius > minEnemySize
    }

    collide() { }
}

class HomingEnemy extends Enemy {
    constructor(spawn: Point, target: Point, level: number) {
        super(spawn, target, level)
        this.border = new Color(328, 60, 54)
    }
    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        const angle = this.center.angleTo(this.target)
        this.velocity.x += Math.cos(angle) * 0.11 * this.baseSpeed
        this.velocity.y += Math.sin(angle) * 0.11 * this.baseSpeed
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
        this.drive = this.velocity
        this.border = new Color(258, 40, 60)
    }
    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x += this.drive.x * 0.05
        this.velocity.y += this.drive.y * 0.05
        this.velocity.x *= 0.95
        this.velocity.y *= 0.95
    }

    collide() {
        this.drive.x = -this.drive.x
        this.drive.y = -this.drive.y
    }
}

class Boss extends Enemy {
    public points: number
    public isBoss: true
    private frame: number
    private drawRadius: number
    constructor(spawnPoint: Point, private player: Player) {
        super(
            spawnPoint,
            player.center,
            8
        )
        this.radius = Math.min(150, this.radius)
        this.drawRadius = this.radius
        this.baseSpeed = 1.2
        this.points = 10000
        this.frame = 0
        this.isBoss = true
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.drawRadius, 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
        c.stroke()
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.frame++
        let h = this.frame % 360
        let s = (this.frame % 20) + 40
        this.color = new Color(h, s, 50)
        const angle = this.center.angleTo(this.player.center)
        this.velocity = new Velocity(
            Math.cos(angle) * this.baseSpeed,
            Math.sin(angle) * this.baseSpeed
        )
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
    }

    hit(amount: number) {
        // boss only take one damage
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.50
        hitSound.play()
        this.radius -= 25
        if (this.radius > minEnemySize) {
            gsap.to(this, {
                drawRadius: this.radius
            })
            return true
        } else {
            gsap.to(this, {
                alpha: 0.0,
                duration: 0.20
            })
            return false
        }
    }

    collide() { }
}