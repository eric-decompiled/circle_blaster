export { Particle, BackgroundParticle }

class Particle {
    private x: number
    private y: number
    private radius: number
    private color: string
    private velocity: Velocity
    private alpha: number
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
    private x: number
    private y: number
    private radius: number
    private color: string
    private alpha: number
    public initialAlpha: number
    public touched: boolean
    constructor(x: number, y: number, radius: number, color: string) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.alpha = 0.05
        this.initialAlpha = this.alpha
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
    }

    touch() {
        this.touched = true
        this.alpha = 0.5
    }
}
