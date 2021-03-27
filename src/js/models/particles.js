export { Particle, BackgroundParticle }

class Particle {
    constructor(x, y, radius, color, velocity) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.alpha = 1
        this.friction = 0.99
    }

    draw(c) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update(c) {
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= 0.01
        this.draw(c)
    }
}

class BackgroundParticle {
    constructor(x, y, radius, color) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.alpha = 0.05
        this.initialAlpha = this.alpha
        this.touched = false
    }

    draw(c) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update(c) {
        this.draw(c)
    }
}
