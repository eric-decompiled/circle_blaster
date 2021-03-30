import { Circle, Point } from "./base"
import { Velocity } from './base'
export { Projectile, Particle, BackgroundParticle }

class Projectile extends Circle {
    public radius: number
    public color: string
    public power: number
    constructor(x: number, y: number, radius: number, color: string, velocity: Velocity, power: number) {
        super(
            new Point(x, y),
            radius,
            color
        )
        this.velocity = velocity
        this.power = power
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
    }
}

class Particle {
    private x: number
    private y: number
    private radius: number
    public color: string
    public alpha: number
    private velocity: Velocity
    private friction: number
    constructor(x: number, y: number, radius: number, color: string, velocity: Velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
        this.friction = 0.99
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update(c: CanvasRenderingContext2D) {
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= 0.01
        this.draw(c)
    }
}

class BackgroundParticle {
    public x: number
    public y: number
    public color: string
    public alpha: number
    public initialAlpha: number
    private shimmerAlpha: number
    public touched: boolean
    private radius: number
    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.alpha = 0.075
        this.initialAlpha = this.alpha
        this.shimmerAlpha = this.alpha + 0.2
        this.touched = false
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        // shimmer effect
        if (this.touched) {
            if (this.alpha > this.initialAlpha) {
                this.alpha -= Math.random() * 0.05
            } else if (this.alpha < this.initialAlpha) {
                this.alpha += Math.random() * 0.10
            }
        }
    }

    touch() {
        this.touched = true
        this.alpha = this.shimmerAlpha
    }
}
