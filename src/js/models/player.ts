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
    public leashed: boolean
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
        this.friction = 0.94
        this.velocity = {
            x: 0,
            y: 0
        }
        this.speed = 0.75
        this.shotSpeed = 6
        this.power = 15
        this.leashed = true
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

    unleash() {
        this.leashed = false
        this.power += 5
        this.speed += 0.5
        unleashedAudio.play()
    }

    leash() {
        if (!this.leashed) {
            this.power -= 5
            this.speed -= 0.5
        }
        this.leashed = true
    }
}

class Projectile {
    public x: number
    public y: number
    public radius: number
    public color: string
    public power: number
    private velocity: Velocity
    constructor(x: number, y: number, radius: number, color: string, velocity: Velocity, power: number) {
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = velocity
        this.power = power
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}