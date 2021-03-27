export { PowerUp }

const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'

class PowerUp {
    constructor({ width, height }) {
        if (Math.random() < 0.5) {
            this.x = Math.random() < 0.5 ? 0 - 7 : width - 7
            this.y = Math.random() * height
        } else {
            this.x = Math.random() * height
            this.y = Math.random() < 0.5 ? 0 - 9 : height - 9
        }
        const angle = Math.atan2(height / 2 - this.y, width / 2 - this.x)
        const velocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        this.velocity = velocity
        this.width = 14
        this.height = 19
        this.radians = 0
    }

    draw(c) {
        c.drawImage(powerUpImg, this.x, this.y, 14, 18)
    }

    update(c) {
        this.draw(c)
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}