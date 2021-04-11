let id = 1
const absorbtion = 1

export class Point {
    constructor(
        public x: number,
        public y: number
    ) { }

    angleTo(p: Point): number {
        return Math.atan2(p.y - this.y, p.x - this.x)
    }

    distanceTo(p: Point): number {
        return Math.hypot(this.x - p.x, this.y - p.y)
    }

    clone() {
        return new Point(this.x, this.y)
    }

}

export class Velocity {
    constructor(
        public x: number,
        public y: number
    ) { }

    get speed(): number { return Math.hypot(this.x, this.y) }

    public throttle(limit: number) {
        if (this.speed > limit) {
            const direction = Math.atan2(this.y, this.x)
            const adjustment = limit / this.speed
            this.x = Math.cos(direction) * Math.abs(this.x) * adjustment
            this.y = Math.sin(direction) * Math.abs(this.y) * adjustment
        }
    }
}


export class Color {
    constructor(
        public h: number,
        public s: number,
        public l: number
    ) { }
    clone(): Color { return new Color(this.h, this.s, this.l) }
    toString() { return `hsl(${this.h}deg, ${this.s}%, ${this.l}%)` }
}

const colors = [
    new Color(1, 70, 30),
    new Color(90, 70, 30),
    new Color(220, 70, 30),
    new Color(36, 70, 30),
]
export const randomColor = () => colors[Math.floor((Math.random() * colors.length))]

export abstract class Circle {
    readonly id: number
    public velocity: Velocity
    protected border: Color
    private mass: number
    constructor(
        public center: Point,
        public radius: number,
        public color: Color,
        public collisions = 0,
        protected friction = 0.9995
    ) {
        this.id = id++
        this.velocity = new Velocity(0, 0)
        this.mass = Math.PI * this.radius * this.radius
    }

    protected draw(c: CanvasRenderingContext2D): void {
        c.beginPath()
        c.arc(this.center.x, this.center.y, Math.max(1, this.radius), 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
        if (this.border) {
            c.lineWidth = 3
            c.strokeStyle = this.border.toString()
            c.stroke()
        }
    }

    public update(c: CanvasRenderingContext2D): void {
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.draw(c)
    }

    public distanceBetween(other: Circle) {
        return this.center.distanceTo(other.center) - (this.radius + other.radius)
    }

    public resolveCollision(other: Circle) {
        const xVelocityDiff = this.velocity.x - other.velocity.x;
        const yVelocityDiff = this.velocity.y - other.velocity.y;

        const xDist = other.center.x - this.center.x;
        const yDist = other.center.y - this.center.y;
        // Prevent accidental overlap of particles
        if (xVelocityDiff * xDist + yVelocityDiff * yDist >= 0) {

            // Grab angle between the two colliding particles
            const angle = -this.center.angleTo(other.center)

            // Store mass in var for better readability in collision equation
            const m1 = this.mass;
            const m2 = other.mass;


            // Velocity before equation
            const u1 = rotate(this.velocity, angle);
            const u2 = rotate(other.velocity, angle);

            // Velocity after 1d collision equation
            const v1 = new Velocity(
                u1.x * (m1 - m2) / (m1 + m2) + u2.x * 2 * m2 / (m1 + m2),
                u1.y
            )
            const v2 = new Velocity(
                u2.x * (m1 - m2) / (m1 + m2) + u1.x * 2 * m2 / (m1 + m2),
                u2.y
            )
            v1.x *= absorbtion
            v1.y *= absorbtion
            v2.x *= absorbtion
            v2.y *= absorbtion

            // Final velocity after rotating axis back to original location
            const vFinal1 = rotate(v1, -angle);
            const vFinal2 = rotate(v2, -angle);

            this.collisions++
            other.collisions++
            // Swap particle velocities for realistic bounce effect
            this.velocity = vFinal1;
            other.velocity = vFinal2;
        }
    }
}

function rotate(velocity: Velocity, angle: number): Velocity {
    return new Velocity(
        velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    )
}
