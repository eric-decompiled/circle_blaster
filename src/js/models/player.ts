import { Projectile } from './particles'
const shootAudio = new Audio('./audio/altShoot.mp3')
const unleashedAudio = new Audio('./audio/unlock.mp3')
export { Player }

class Player {
    public x: number
    public y: number
    public powerUp: string
    public velocity: Velocity
    private unleashedColor: string
    private speed: number
    private power: number
    private shotSpeed: number
    private friction: number

    constructor(private topLeft: any, private bottomRight: any, public radius: number, public color: string) {
        this.x = (this.topLeft.x + this.bottomRight.x) / 2
        this.y = (this.topLeft.y + this.bottomRight.y) / 2
        this.powerUp = ''
        this.friction = 0.92
        this.velocity = {
            x: 0,
            y: 0
        }
        this.speed = 0.70
        this.shotSpeed = 9
        this.power = 12
        this.unleashedColor = null
    }

    isUnleashed() {
        return !!this.unleashedColor
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
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
        s.volume = 0.5
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
            this.x - this.radius + this.velocity.x > this.topLeft.x &&
            this.x + this.radius + this.velocity.x < this.bottomRight.x
        ) {
            this.x += this.velocity.x
        } else {
            this.velocity.x = 0
        }

        if (
            this.y - this.radius + this.velocity.y > this.topLeft.y &&
            this.y + this.radius + this.velocity.y < this.bottomRight.y
        ) {
            this.y += this.velocity.y
        } else {
            this.velocity.y = 0
        }
    }

    unleash(unleashedColor: string) {
        if (!this.unleashedColor) {
            this.speed += 0.33
            unleashedAudio.play()
            this.unleashedColor = unleashedColor
        }
    }

    leash() {
        if (this.unleashedColor) {
            this.speed -= 0.33
            this.unleashedColor = null
        }
    }
}