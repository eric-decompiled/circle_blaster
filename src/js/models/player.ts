import { Circle, Point, Velocity, Color } from './base'
import { Mouse, Keys } from './input'
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
    ) {
        super(
            spawnAt,
            playerRadius,
            color
        )
        this.powerUp = ''
        this.friction = 0.92
        this.speed = 0.50
        this.shotSpeed = 6
        this.power = 10
        this.maxShots = 10
        this.unleashed = false
    }

    get isUnleashed(): boolean {
        return this.unleashed
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
    }

    shoot(mouse: Mouse) {
        const angle = this.center.angleTo(mouse.point)
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
        return new Projectile(spawnAt, 5, this.color.clone(), velocity, this.power)
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        if (this.keys.up) this.velocity.y -= this.speed
        if (this.keys.down) this.velocity.y += this.speed
        if (this.keys.right) this.velocity.x += this.speed
        if (this.keys.left) this.velocity.x -= this.speed
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
    }

    unleash() {
        if (!this.unleashed) {
            this.speed += 0.15
            this.shotSpeed += 2
            this.maxShots += 10
            unleashedAudio.play()
            this.unleashed = true
        }
    }

    leash() {
        if (this.unleashed) {
            this.speed -= 0.15
            this.shotSpeed -= 2
            this.maxShots -= 10
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
        power: number
    ) {
        super(
            center,
            radius,
            color
        )
        this.velocity = velocity
        this.power = power
    }

    collide(h: number = undefined) {
        if (this.color.l > 80) this.color.l = 60
        if (h) this.color.h = h
        if (this.color.s === 0 && h) this.color.s = 80
        this.color.l -= 10
    }
}