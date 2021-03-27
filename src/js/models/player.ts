import { Projectile } from './particles'
const shootAudio = new Audio('./audio/altShoot.mp3')
const unleashedAudio = new Audio('./audio/unlock.mp3')
export { Player }

class Player {
    public x: number
    public y: number
    public radius: number
    public color: string
    public powerUp: string
    public velocity: Velocity
    private unleashedColor: string
    private speed: number
    private power: number
    private shotSpeed: number
    private friction: number
    private xEdge: number
    private yEdge: number

    constructor(canvas: any, radius: number, color: string) {
        this.x = canvas.width / 2
        this.y = canvas.height / 2
        this.xEdge = canvas.width
        this.yEdge = canvas.height
        this.radius = radius
        this.powerUp = ''
        this.color = color
        this.friction = 0.92
        this.velocity = {
            x: 0,
            y: 0
        }
        this.speed = 0.75
        this.shotSpeed = 6
        this.power = 15
        this.unleashedColor = null
    }

    isUnleashed() {
        return !!this.unleashedColor
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        if (this.unleashedColor) {
            c.save()
            c.strokeStyle = this.unleashedColor
            c.lineWidth = 5
            c.globalAlpha = 0.5
            c.stroke()
            c.restore()
        }
        c.fillStyle = this.color
        c.fill()
    }

    shoot({ x, y }) {
        const angle = Math.atan2(y - this.y, x - this.x)
        const velocity = {
            x: Math.cos(angle) * this.shotSpeed,
            y: Math.sin(angle) * this.shotSpeed
        }
        let s = shootAudio.cloneNode() as HTMLAudioElement
        s.volume = 0.4
        s.play()
        return new Projectile(this.x, this.y, 5, this.color, velocity, this.power)
    }

    update(c: CanvasRenderingContext2D, keys: Keys) {
        this.draw(c)
        if (keys.up) this.velocity.y -= this.speed
        if (keys.down) this.velocity.y += this.speed
        if (keys.right) this.velocity.x += this.speed
        if (keys.left) this.velocity.x -= this.speed
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        if (
            this.x - this.radius + this.velocity.x > 0 &&
            this.x + this.radius + this.velocity.x < this.xEdge
        ) {
            this.x += this.velocity.x
        } else {
            this.velocity.x = 0
        }

        if (
            this.y - this.radius + this.velocity.y > 0 &&
            this.y + this.radius + this.velocity.y < this.yEdge
        ) {
            this.y += this.velocity.y
        } else {
            this.velocity.y = 0
        }
    }

    unleash(unleashedColor: string) {
        if (!this.unleashedColor) {
            this.power += 5
            this.speed += 0.5
            unleashedAudio.play()
            this.unleashedColor = unleashedColor
        }
    }

    leash() {
        if (this.unleashedColor) {
            this.power -= 5
            this.speed -= 0.5
            this.unleashedColor = null
        }
    }
}