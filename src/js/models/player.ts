import { Circle, Point, Velocity } from './base'
const shootAudio = new Audio('./audio/altShoot.mp3')
const unleashedAudio = new Audio('./audio/unlock.mp3')
export { Player, Projectile }
const playerRadius = 10

class Player extends Circle {
    public powerUp: string
    public velocity: Velocity
    private unleashedColor: string
    private speed: number
    private power: number
    private shotSpeed: number
    public maxShots: number

    constructor(
        private topLeft: any,
        private bottomRight: any,
        public color: string,
        private keys: Keys,
    ) {
        super(
            new Point(
                (topLeft.x + bottomRight.x) / 2,
                (topLeft.y + bottomRight.y) / 2,
            ),
            playerRadius,
            color
        )
        this.powerUp = ''
        this.friction = 0.94
        this.speed = 0.50
        this.shotSpeed = 6
        this.power = 12
        this.maxShots = 10
        this.unleashedColor = null
    }

    isUnleashed() {
        return !!this.unleashedColor
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    shoot({ x, y }) {
        let target = new Point(x, y)
        const angle = this.center.angleTo(target)
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
        return new Projectile(spawnAt, 5, this.color, velocity, this.power)
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        if (this.keys.up) this.velocity.y -= this.speed
        if (this.keys.down) this.velocity.y += this.speed
        if (this.keys.right) this.velocity.x += this.speed
        if (this.keys.left) this.velocity.x -= this.speed
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        if (
            this.center.x - this.radius + this.velocity.x > this.topLeft.x &&
            this.center.x + this.radius + this.velocity.x < this.bottomRight.x
        ) {
            this.center.x += this.velocity.x
        } else {
            this.velocity.x = 0
        }

        if (
            this.center.y - this.radius + this.velocity.y > this.topLeft.y &&
            this.center.y + this.radius + this.velocity.y < this.bottomRight.y
        ) {
            this.center.y += this.velocity.y
        } else {
            this.velocity.y = 0
        }
    }

    unleash(unleashedColor: string) {
        if (!this.unleashedColor) {
            this.speed += 0.15
            this.shotSpeed += 2
            this.maxShots += 10
            unleashedAudio.play()
            this.unleashedColor = unleashedColor
        }
    }

    leash() {
        if (this.unleashedColor) {
            this.speed -= 0.15
            this.shotSpeed -= 2
            this.maxShots -= 10
            this.unleashedColor = null
        }
    }
}

class Projectile extends Circle {
    public radius: number
    public color: string
    public power: number
    constructor(center: Point, radius: number, color: string, velocity: Velocity, power: number) {
        super(
            center,
            radius,
            color
        )
        this.velocity = velocity
        this.power = power
    }
}