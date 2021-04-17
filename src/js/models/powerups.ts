export { PowerUp }
import { Circle, Point, randomColor, Velocity } from './base'

const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'
const imgwidth = 14
const imgHeight = 19

// ideas
// force field
// wrap around
class PowerUp extends Circle {
    public velocity: Velocity
    public inPlay: boolean
    constructor(spawnPoint: Point, target: Point) {
        super(spawnPoint, (14 + 19) / 2, randomColor() )
        const angle = Math.atan2(target.y / 2 - this.center.y, target.x - this.center.x)
        this.velocity = new Velocity(
            Math.cos(angle) + Math.random(),
            Math.sin(angle) + Math.random()
        )
        this.inPlay = false
    }

    draw(c: CanvasRenderingContext2D) {
        c.drawImage(powerUpImg, this.center.x, this.center.y, imgwidth, imgHeight)
    }

    update(c: CanvasRenderingContext2D) {
        super.update(c)
    }
}