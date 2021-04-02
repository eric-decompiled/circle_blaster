import { Velocity, Color, Point, Circle } from './base'
export { Particle, BackgroundParticle }

class Particle {
    public alpha: number
    private friction: number
    constructor(
        public center: Point,
        public radius: number,
        public color: Color,
        public velocity: Velocity
    ) {
        this.alpha = 1
        this.friction = 0.99
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
        c.restore()
    }

    update(c: CanvasRenderingContext2D) {
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.alpha -= 0.01
        this.draw(c)
    }
}

class BackgroundParticle extends Circle {
    public alpha: number
    public initialAlpha: number
    private shimmerAlpha: number
    public touched: boolean
    constructor(
        center: Point,
        radius: number,
        color: Color
    ) {
        super(
            center,
            radius,
            color
        )
        this.alpha = 0.075
        this.initialAlpha = this.alpha
        this.shimmerAlpha = this.alpha + 0.2
        this.touched = false
    }

    update(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        this.draw(c)
        c.restore()
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
