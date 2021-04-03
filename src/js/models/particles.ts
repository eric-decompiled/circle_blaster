import gsap from 'gsap'
import { Velocity, Color, Point, Circle } from './base'
export { Particles, BackgroundParticles }
const spacing = 30

class Particles {
    private particles: Particle[]
    constructor() {
        this.particles = []
    }

    create(at: Point, color: Color, amount: number, angle: number) {
        // angle determines the direction particles will shoot off in
        const xBias = Math.cos(angle)
        const yBias = Math.sin(angle)
        for (let i = 0; i < amount; i++) {
            this.particles.push(
                new Particle(
                    new Point(at.x, at.y),
                    Math.random() * 2,
                    color,
                    new Velocity(
                        (Math.random() - 0.5) + xBias,
                        (Math.random() - 0.5) + yBias
                    )
                )
            )
        }
    }

    update(c: CanvasRenderingContext2D) {
        this.particles = this.particles.filter(p => p.alpha > 0)
        this.particles.forEach(p => p.update(c))
    }
}

class BackgroundParticles {
    private particles: BackgroundParticle[]
    private lit: number
    constructor(topLeft: Point, bottomRight: Point) {
        this.particles = []
        this.lit = 0
        for (var i = topLeft.x; i < bottomRight.x; i += spacing) {
            for (let j = topLeft.y; j < bottomRight.y; j += spacing) {
                this.particles.push(new BackgroundParticle(new Point(i, j), 3, new Color(0, 0, 100)))
            }
        }
    }

    get count(): number {
        return this.particles.length
    }

    get litCount(): number {
        return this.lit
    }

    reset(color: Color) {
        this.particles.forEach(p => {
            p.color = color
            gsap.to(p, {
                alpha: 0.15,
                duration: 0.03,
                onComplete: () => {
                    gsap.to(p, {
                        alpha: p.initialAlpha,
                        touched: false,
                        duration: 0.03
                    })
                }
            })
        })
        this.lit = 0
    }

    update(c: CanvasRenderingContext2D, playerPosition: Point) {
        this.particles.forEach(bp => {
            const dist = Math.hypot(playerPosition.x - bp.center.x, playerPosition.y - bp.center.y)
            const hideRadius = 125
            if (dist < hideRadius) {
                // hide close particles, illuminate radius
                bp.alpha = dist < 70 ? 0 : 0.35
                if (!bp.touched) {
                    this.lit += 1
                    bp.touch()
                }
            }
            bp.update(c)
        })
    }

    touchAll() {
        this.particles.forEach(bp => bp.touch())
    }
}

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
            } else if (this.alpha <= this.initialAlpha) {
                this.alpha += Math.random() * 0.10
            }
        }
    }

    touch() {
        this.touched = true
        this.alpha = this.shimmerAlpha
    }
}
