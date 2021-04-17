import { Circle, Point, Velocity, Color } from './base'
import { Mouse, Keys } from '../input'
const shootAudio = new Audio('./audio/altShoot.mp3')
const unleashedAudio = new Audio('./audio/unlock.mp3')
export { Player, Projectile }
const playerRadius = 10
class Player extends Circle {
    public powerUp: string
    private unleashed: boolean
    private speed: number
    private power: number
    private shotSpeed: number
    public maxShots: number

    constructor(
        spawnAt: Point,
        color: Color,
        private keys: Keys,
        private mouse: Mouse,
    ) {
        super(
            spawnAt,
            playerRadius,
            color
        )
        this.powerUp = ''
        this.friction = 0.90
        this.speed = 0.55
        this.shotSpeed = 14
        this.power = 12
        this.maxShots = 98
        this.unleashed = false
    }

    get isUnleashed(): boolean {
        return this.unleashed
    }

    draw(c: CanvasRenderingContext2D): void {
        c.beginPath()
        c.arc(this.center.x, this.center.y, Math.max(1, this.radius), 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
        if (this.border) {
            c.lineWidth = 3
            c.strokeStyle = this.border.toString()
            c.stroke()
        }
        // draw direction arrow
        if (this.velocity.speed > 0) {
            const d = this.velocity.direction
            let tip = new Point(
                this.center.x + Math.cos(d) * this.radius * 2.8,
                this.center.y + Math.sin(d) * this.radius * 2.8
            )
            c.beginPath()
            c.moveTo(tip.x, tip.y)
            c.lineTo(tip.x - Math.cos(d + 0.75) * 5, tip.y - Math.sin(d + 0.75) * 5)
            c.lineTo(tip.x - Math.cos(d - 0.75) * 5, tip.y - Math.sin(d - 0.75) * 5)
            c.closePath()
            c.fillStyle = 'yellow'
            c.fill()
        }
    }

    setborder(color: Color) {
        this.border = color
    }

    shoot(mouse: Mouse) {
        const angle = this.velocity.direction
        const velocity = new Velocity(
            Math.cos(angle) * this.shotSpeed,
            Math.sin(angle) * this.shotSpeed
        )
        let s = shootAudio.cloneNode() as HTMLAudioElement
        s.volume = 0.5
        s.play()
        const spawnAt = new Point(
            this.center.x + velocity.x,
            this.center.y + velocity.y
        )
        return new Projectile(spawnAt, 5, this.color.clone(), velocity, this.power, this.border)
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        if (this.mouse.down) {
            const angle = this.center.angleTo(this.mouse.point)
            if (this.center.distanceTo(this.mouse.point) > 32) {
                this.velocity.x += Math.cos(angle) * this.speed
                this.velocity.y += Math.sin(angle) * this.speed
            }
        } else {
            if (this.keys.up) this.velocity.y -= this.speed
            if (this.keys.down) this.velocity.y += this.speed
            if (this.keys.right) this.velocity.x += this.speed
            if (this.keys.left) this.velocity.x -= this.speed
        }
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
    }

    unleash() {
        if (!this.unleashed) {
            this.speed += 0.15
            this.shotSpeed += 2
            this.maxShots += 8
            unleashedAudio.play()
            this.unleashed = true
        }
    }

    leash() {
        if (this.unleashed) {
            this.speed -= 0.15
            this.shotSpeed -= 2
            this.maxShots -= 7
            this.unleashed = false
        }
    }
}

class Projectile extends Circle {
    public radius: number
    public power: number
    constructor(
        center: Point,
        radius: number,
        color: Color,
        velocity: Velocity,
        power: number,
        border: Color = undefined
    ) {
        super(
            center,
            radius,
            color
        )
        this.velocity = velocity
        this.power = power
        this.border = border
    }

    collide(h: number = undefined) {
        if (this.color.l > 80) this.color.l = 60
        if (h) this.color.h = h
        if (this.color.s === 0 && h) this.color.s = 25
        this.color.l -= 10
    }
}