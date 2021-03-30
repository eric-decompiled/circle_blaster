let id = 1
const absorbtion = 0.50
export abstract class Circle {
    readonly id: number
    public velocity: Velocity
    private mass: number
    constructor(
        public center: Point,
        public radius: number,
        public color: string,
        public collisions = 0,
        protected friction = 0.99995
    ) {
        this.id = id++
        this.velocity = new Velocity(0, 0)
        this.mass = this.radius // probably should be reduced with radius
    }

    protected draw(c: CanvasRenderingContext2D): void {
        c.beginPath()
        c.arc(this.center.x, this.center.y, Math.max(1, this.radius), 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
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

            // Swap particle velocities for realistic bounce effect
            this.velocity = vFinal1;
            other.velocity = vFinal2;
            this.collisions++
            other.collisions++
        }
    }

}
function rotate(velocity: Velocity, angle: number): Velocity {
    return new Velocity(
        velocity.x * Math.cos(angle) - velocity.y * Math.sin(angle),
        velocity.x * Math.sin(angle) + velocity.y * Math.cos(angle)
    )
}

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

}

export class Velocity {
    constructor(
        public x: number,
        public y: number
    ) { }

    speed(): number {
        return Math.hypot(this.x, this.y)
    }
}