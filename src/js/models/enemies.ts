import gsap from 'gsap'
export {
    Enemy,
    Boss
}

const minEnemySize = 12
const enemyHitAudio = new Audio('./audio/hit.mp3')
const enemyColors = [
    `hsl(0, 70%, 30%)`,
    `hsl(90, 70%, 30%)`,
    `hsl(220, 70%, 30%)`,
    `hsl(36, 90%, 30%)`
]
const randomColor = () => {
    return enemyColors[Math.floor((Math.random() * enemyColors.length))]
}

let id = 1
class Enemy {
    public id: number
    private x: number
    private y: number
    public points: number
    public radius: number
    private drawRadius: number
    public color: string
    private type: string
    private radians: number
    private center: Velocity // probably need to rename this / new type
    private baseSpeed: number
    private spinRadius: number
    private spinRate: number
    private velocity: Velocity
    private alpha: number
    private friction: number
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

        this.id = id++
        this.points = 200 + level * 50
        this.radius = radius + level * 10
        this.drawRadius = this.radius
        this.spinRadius = Math.max(30, Math.random() * 100)
        this.spinRate = 0.05
        this.color = randomColor()
        this.velocity = velocity
        this.type = 'homing'
        this.center = { x: this.x, y: this.y }
        this.radians = 0
        this.baseSpeed = level * 0.95 + (Math.random() * 0.35)
        this.alpha = 1
        this.friction = 0.97

        // if (Math.random() < 0.25) {
        //     this.type = 'spinning'
        //     this.points += 50
        // }
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.drawRadius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        if (this.alpha === 1) {
            c.fill()
        } else {
            c.save()
            c.globalAlpha = this.alpha
            c.fill()
            c.restore()
        }
    }

    update(c: CanvasRenderingContext2D, targetX: number, targetY: number) {
        this.draw(c)
        if (this.type === 'simple') {
            this.x += this.velocity.x
            this.y += this.velocity.y
        } else if (this.type === 'homing') {
            const angle = Math.atan2(targetY - this.y, targetX - this.x)
            this.velocity = {
                x: (this.velocity.x * this.friction) + (Math.cos(angle) * this.baseSpeed) * 0.1,
                y: (this.velocity.y * this.friction) + (Math.sin(angle) * this.baseSpeed) * 0.1
            }
            this.x += this.velocity.x
            this.y += this.velocity.y
        } else if (this.type === 'spinning') {
            this.radians += this.spinRate
            const angle = Math.atan2(targetY - this.y, targetX - this.x)
            this.velocity = {
                x: (this.velocity.x * this.friction) + (Math.cos(angle) * this.baseSpeed) * 0.1,
                y: (this.velocity.y * this.friction) + (Math.sin(angle) * this.baseSpeed) * 0.1
            }
            this.center.x += this.velocity.x
            this.center.y += this.velocity.y

            this.x = this.center.x + Math.cos(this.radians) * this.spinRadius
            this.y = this.center.y + Math.sin(this.radians) * this.spinRadius
        }
    }

    hit(amount: number): boolean {
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.33
        hitSound.play()
        this.radius -= amount
        if (this.radius > minEnemySize) {
            gsap.to(this, {
                drawRadius: this.radius,
                duration: 0.3
            })
            return true
        } else {
            gsap.to(this, {
                alpha: 0.0,
                duration: 0.20
            })
            return false
        }
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
    private drawRadius: number
    constructor(width: number, height: number) {
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? 0 - 1000 : width + 1000
            this.y = Math.random() * height
        } else {
            this.x = Math.random() * height
            this.y = Math.random() < 0.5 ? 0 - 1000 : height + 1000
        }
        this.radius = 250
        this.drawRadius = 250
        this.baseSpeed = 1.2
        this.points = 10000
        this.frame = 0
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.x, this.y, this.drawRadius, 0, Math.PI * 2, false)
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
        // boss only take one damage
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.50
        hitSound.play()
        this.radius -= 1
        if (this.radius > minEnemySize) {
            gsap.to(this, {
                drawRadius: this.radius
            })
            return true
        } else {
            gsap.to(this, {
                alpha: 0.0,
                duration: 0.20
            })
            return false
        }
    }
}