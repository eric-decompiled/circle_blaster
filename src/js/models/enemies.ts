import gsap from 'gsap'
export {
    Enemy,
    Boss
}

const enemyColors = [
    `hsl(0, 50%, 50%)`,
    `hsl(90, 50%, 50%)`,
    `hsl(180, 50%, 50%)`,
    `hsl(270, 50%, 50%)`,
]
const randomColor = () => {
    return enemyColors[Math.floor((Math.random() * enemyColors.length))]
}

class Enemy {
    private x: number
    private y: number
    private level: number
    public points: number
    public radius: number
    private type: string
    private radians: number
    private center: Velocity // probably need to rename this / new type
    private baseSpeed: number
    private spinRadius: number
    private spinRate: number
    private color: string
    private velocity: Velocity
    constructor(width: number, height: number, level: number) {
        const radius = Math.random() * (60 - 10) + 10
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? 0 - radius : width + radius
            this.y = Math.random() * height
        } else {
            this.x = Math.random() * height
            this.y = Math.random() < 0.5 ? 0 - radius : height + radius
        }
        const angle = Math.atan2(height / 2 - this.y, width / 2 - this.x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        this.level = level
        this.points = 200 + level * 50
        this.radius = radius + level * 10
        this.spinRadius = Math.random() * 40
        this.spinRate = 0.05
        this.color = randomColor()
        this.velocity = velocity
        this.type = 'homing'
        this.center = { x: this.x, y: this.y }
        this.radians = 0
        this.baseSpeed = level * 0.95

        if (Math.random() < (0.35 + this.level * 0.1)) {
            this.type = 'homing'
            if (Math.random() < 0.25) {
                this.type = 'spinning'
                this.points += 50
            }
        }
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }

    update(c: CanvasRenderingContext2D, targetX: number, targetY: number) {
        this.draw(c)
        if (this.type === 'homing') {
            const angle = Math.atan2(targetY - this.y, targetX - this.x)
            this.velocity = {
                x: Math.cos(angle) * this.baseSpeed,
                y: Math.sin(angle) * this.baseSpeed
            }
            this.x += this.velocity.x
            this.y += this.velocity.y
        } else if (this.type === 'spinning') {
            this.radians += this.spinRate
            const angle = Math.atan2(targetY - this.y, targetX - this.x)
            this.velocity = {
                x: Math.cos(angle) * this.baseSpeed,
                y: Math.sin(angle) * this.baseSpeed
            }
            this.center.x += this.velocity.x
            this.center.y += this.velocity.y

            this.x = this.center.x + Math.cos(this.radians) * this.spinRadius
            this.y = this.center.y + Math.sin(this.radians) * this.spinRadius
        }

    }

    hit(amount: number) {
        gsap.to(this, {
            radius: this.radius - amount
        })
    }
}

class Boss {
    private x: number
    private y: number
    public points: number
    public radius: number
    private baseSpeed: number
    private color: string
    private velocity: Velocity
    private frame: number
    constructor(width: number, height: number) {
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? 0 - 1000 : width + 1000
            this.y = Math.random() * height
        } else {
            this.x = Math.random() * height
            this.y = Math.random() < 0.5 ? 0 - 1000 : height
        }
        this.radius = 250
        this.baseSpeed = 1.2
        this.points = 10000
        this.frame = 0
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.stroke()
    }

    update(c: CanvasRenderingContext2D, targetX: number, targetY: number) {
        this.draw(c)
        this.frame++
        let h = this.frame % 360
        let s = (this.frame % 20) + 40
        this.color = `hsl(${h}deg,${s}%,50%)`
        const angle = Math.atan2(targetY - this.y, targetX - this.x)
        this.velocity = {
            x: Math.cos(angle) * this.baseSpeed,
            y: Math.sin(angle) * this.baseSpeed
        }
        this.x += this.velocity.x
        this.y += this.velocity.y
    }

    hit(amount: number) {
        this.radius -= 1
    }
}