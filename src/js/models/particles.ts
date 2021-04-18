import gsap from 'gsap'
import { Velocity, Color, Point, Circle } from './base'
export { Particles, BackgroundParticles }

class Particles {
    private particles: Particle[]
    constructor() {
        this.particles = []
    }

    create(at: Point, color: Color, amount: number, angle: number, speed = 2) {
        // angle determines the direction particles will shoot off in
        const xBias = Math.cos(angle) * 0.5
        const yBias = Math.sin(angle) * 0.5
        for (let i = 0; i < amount; i++) {
            this.particles.push(
                new Particle(
                    new Point(at.x, at.y),
                    Math.random() * 2,
                    color,
                    new Velocity(
                        ((Math.random() - 0.5) + xBias) * speed,
                        ((Math.random() - 0.5) + yBias) * speed
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

const aura = 125
const hideAura = 70
const minSpace = 50
class BackgroundParticles {
    private particles: BackgroundParticle[]
    private lit: number
    constructor(topLeft: Point, bottomRight: Point, maxWidth: number, maxHeight: number) {
        this.particles = []
        this.lit = 0
        const width = bottomRight.x - topLeft.x
        const height = bottomRight.y - topLeft.y
        let isMaxWidth = (width >= maxWidth)
        let isMaxHeight = (height >= maxHeight)
        let space = Math.max(30, gcd(width, height))
        while (space > minSpace) space *= 0.5
        for (var i = topLeft.x; i <= bottomRight.x; i += space) {
            for (let j = topLeft.y; j <= bottomRight.y; j += space) {
                let isBorder =
                    (isMaxWidth && (i === 0 || i === bottomRight.x)) ||
                    (isMaxHeight && (j === 0 || j === bottomRight.y))
                let p = new BackgroundParticle(new Point(i, j), 3, new Color(0, 0, 100), isBorder)
                this.particles.push(p)
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
        this.lit = 0
        this.particles.forEach(p => {
            p.color = color
            p.touched = false
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
    }

    update(c: CanvasRenderingContext2D, playerPosition: Point) {
        this.particles.forEach(bp => {
            const dist = Math.hypot(playerPosition.x - bp.center.x, playerPosition.y - bp.center.y)
            if (dist < aura) {
                // hide close particles, illuminate radius
                bp.alpha = dist < hideAura ? 0 : 0.35
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
        this.alpha -= 0.02
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
        color: Color,
        private isBorder: Boolean,
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
        c.globalAlpha = this.alpha + (this.isBorder ? 0.15 : 0)
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

// helper for tiling
function gcd(x, y) {
    x = Math.abs(x);
    y = Math.abs(y);
    while (y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}