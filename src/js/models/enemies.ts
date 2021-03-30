import gsap from 'gsap'
import { Circle, Point, Velocity } from './base'
import { Player } from './player'
export {
    Enemy,
    Boss
}

const minEnemySize = 20
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

class Enemy extends Circle {
    public id: number
    public points: number
    public inPlay: boolean
    private baseSpeed: number
    constructor(spawnPoint: Point, target: Point, level: number) {
        const radius = Math.random() * (60 - 10) + 10
        super(
            spawnPoint,
            2 * (radius + level * 10),
            randomColor(),
        )
        this.points = 200 + level * 50
        this.color = randomColor()
        this.baseSpeed = 0.75 + (level * 0.15) + (Math.random() * 0.15)
        this.inPlay = false
        const angle = this.center.angleTo(target)
        this.velocity = new Velocity(
            Math.cos(angle) * this.baseSpeed * 2,
            Math.sin(angle) * this.baseSpeed * 2
        )
    }

    hit(amount: number): boolean {
        const hitSound = enemyHitAudio.cloneNode() as HTMLAudioElement
        hitSound.volume = 0.33
        hitSound.play()
        this.radius -= amount
        return this.radius > minEnemySize
        // if (this.radius > minEnemySize) {
        //     gsap.to(this, {
        //         radius: this.radius - amount,
        //         duration: 0.3
        //     })
        //     return true
        // } else {
        //     gsap.to(this, {
        //         alpha: 0.0,
        //         duration: 0.20
        //     })
        //     return false
        // }
    }
}

class Boss extends Circle {
    public points: number
    public radius: number
    public isBoss: true
    private baseSpeed: number
    private frame: number
    private drawRadius: number
    constructor(spawnPoint: Point, private player: Player) {
        super(
            spawnPoint,
            250,
            'deeppurple'
        )
        this.drawRadius = 250
        this.baseSpeed = 1.2
        this.points = 10000
        this.frame = 0
        this.isBoss = true
    }

    draw(c: CanvasRenderingContext2D) {
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.drawRadius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.stroke()
    }

    update(c: CanvasRenderingContext2D) {
        this.draw(c)
        this.frame++
        let h = this.frame % 360
        let s = (this.frame % 20) + 40
        this.color = `hsl(${h}deg,${s}%,50%)`
        const angle = this.center.angleTo(this.player.center)
        this.velocity = new Velocity(
            Math.cos(angle) * this.baseSpeed,
            Math.sin(angle) * this.baseSpeed
        )
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
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