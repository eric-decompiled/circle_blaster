import gsap from 'gsap'
import { Velocity, Color, Point, Circle } from './base'
export { Particles, BackgroundParticles }
const spacing = 30

class Particles {
    private particles: Particle[]
    constructor() {
        this.particles = []
    }

    create(at: Point, color: Color, amount: number, angle: number, speed = 1) {
        // angle determines the direction particles will shoot off in
        const xBias = Math.cos(angle) * 0.5
        const yBias = Math.sin(angle) * 0.5
        for (let i = 0; i < amount; i++) {
            this.particles.push(
                new Particle(
                    new Point(at.x, at.y),
                    Math.random() * 2,
                    color,
                    new Velocity(
                        ((Math.random() - 0.5) + xBias) * speed,
                        ((Math.random() - 0.5) + yBias) * speed
                    )
                )
            )
        }
    }

    update(c: CanvasRenderingContext2D) {
        this.particles = this.particles.filter(p => p.alpha > 0)
        this.particles.forEach(p => p.update(c))
    }
}

class BackgroundParticles {
    private particles: BackgroundParticle[]
    private lit: number
    constructor(topLeft: Point, bottomRight: Point) {
        this.particles = []
        this.lit = 0
        for (var i = topLeft.x; i < bottomRight.x; i += spacing) {
            for (let j = topLeft.y; j < bottomRight.y; j += spacing) {
                this.particles.push(new BackgroundParticle(new Point(i, j), 3, new Color(0, 0, 100)))
            }
        }
    }

    get count(): number {
        return this.particles.length
    }

    get litCount(): number {
        return this.lit
    }

    reset(color: Color) {
        this.particles.forEach(p => {
            p.color = color
            gsap.to(p, {
                alpha: 0.15,
                duration: 0.03,
                onComplete: () => {
                    gsap.to(p, {
                        alpha: p.initialAlpha,
                        touched: false,
                        duration: 0.03
                    })
                }
            })
        })
        this.lit = 0
    }

    update(c: CanvasRenderingContext2D, playerPosition: Point) {
        this.particles.forEach(bp => {
            const dist = Math.hypot(playerPosition.x - bp.center.x, playerPosition.y - bp.center.y)
            const hideRadius = 125
            if (dist < hideRadius) {
                // hide close particles, illuminate radius
                bp.alpha = dist < 70 ? 0 : 0.35
                if (!bp.touched) {
                    this.lit += 1
                    bp.touch()
                }
            }
            bp.update(c)
        })
    }

    touchAll() {
        this.particles.forEach(bp => bp.touch())
    }
}

class Particle {
    public alpha: number
    private friction: number
    constructor(
        public center: Point,
        public radius: number,
        public color: Color,
        public velocity: Velocity
    ) {
        this.alpha = 1
        this.friction = 0.99
    }

    draw(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color.toString()
        c.fill()
        c.restore()
    }

    update(c: CanvasRenderingContext2D) {
        this.center.x += this.velocity.x
        this.center.y += this.velocity.y
        this.velocity.x *= this.friction
        this.velocity.y *= this.friction
        this.alpha -= 0.01
        this.draw(c)
    }
}


class BackgroundParticle extends Circle {
    public alpha: number
    public initialAlpha: number
    private shimmerAlpha: number
    public touched: boolean
    constructor(
        center: Point,
        radius: number,
        color: Color
    ) {
        super(
            center,
            radius,
            color
        )
        this.alpha = 0.075
        this.initialAlpha = this.alpha
        this.shimmerAlpha = this.alpha + 0.2
        this.touched = false
    }

    update(c: CanvasRenderingContext2D) {
        c.save()
        c.globalAlpha = this.alpha
        this.draw(c)
        c.restore()
        // shimmer effect
        if (this.touched) {
            if (this.alpha > this.initialAlpha) {
                this.alpha -= Math.random() * 0.05
            } else if (this.alpha <= this.initialAlpha) {
                this.alpha += Math.random() * 0.10
            }
        }
    }

    touch() {
        this.touched = true
        this.alpha = this.shimmerAlpha
    }
}


// class Bounds {
//     public left: number
//     public right: number
//     public top: number
//     public bottom: number
//     public diagonal: number
//     constructor(
//         public x: number,
//         public y: number,
//         public w: number,
//         public h: number
//     ) {
//         this.left = x - w;
//         this.right = x + w;
//         this.top = y - h;
//         this.bottom = y + h;
//         this.diagonal = (w * w + h * h);
//     }

//     contains(p) {
//         return (p.x >= this.left && p.x <= this.right && p.y >= this.top && p.y <= this.bottom);
//     }

//     near(c: Circle) {
//         if (!this.contains(c)) {
//             const dx = c.center.x - this.x;
//             const dy = c.center.y - this.y;
//             const dist = (dx * dx + dy * dy) - this.diagonal - c.radius;
//             return dist < 0;
//         }
//         return true;
//     }
// }

// TODO: tie background particles into this to see if it improves performance on large screens
// class QuadTree {
//     public boundary: Bounds
//     public divided: boolean
//     public points: any
//     public pointCount: number
//     public drawn: boolean
//     public depth: number
//     public NE: QuadTree
//     public NW: QuadTree
//     public SE: QuadTree
//     public SW: QuadTree
//     constructor(boundary, canvas, depth = 0) {
//         this.boundary = boundary || new Bounds(canvas.width / 2, canvas.height / 2, canvas.width / 2, canvas.height / 2);
//         this.divided = false;
//         this.points = depth > 1 ? [] : null;
//         this.pointCount = 0
//         this.drawn = false;
//         this.depth = depth;
//         if (depth === 0) {   // BM67 Fix on resize
//             this.subdivide();
//             this.NE.subdivide();
//             this.NW.subdivide();
//             this.SE.subdivide();
//             this.SW.subdivide();
//         }


//     }

//     addPath(ctx: CanvasRenderingContext2D) {
//         const b = this.boundary;
//         ctx.rect(b.left, b.top, b.w * 2, b.h * 2);
//         this.drawn = true;
//     }
//     addToSubQuad(particle) {
//         if (this.NE.insert(particle)) { return true }
//         if (this.NW.insert(particle)) { return true }
//         if (this.SE.insert(particle)) { return true }
//         if (this.SW.insert(particle)) { return true }
//         particle.quad = undefined;
//     }
//     insert(particle) {
//         if (this.depth > 0 && !this.boundary.contains(particle)) { return false }

//         if (this.depth > 1 && this.pointCount < 4) {
//             this.points[this.pointCount++] = particle;
//             particle.quad = this;
//             return true;
//         }
//         if (!this.divided) { this.subdivide() }
//         return this.addToSubQuad(particle);
//     }

//     subdivide() {
//         if (!this.NW) {
//             const x = this.boundary.x;
//             const y = this.boundary.y;
//             const w = this.boundary.w / 2;
//             const h = this.boundary.h / 2;
//             const depth = this.depth + 1;

//             this.NE = new QuadTree(new Bounds(x + w, y - h, w, h), depth);
//             this.NW = new QuadTree(new Bounds(x - w, y - h, w, h), depth);
//             this.SE = new QuadTree(new Bounds(x + w, y + h, w, h), depth);
//             this.SW = new QuadTree(new Bounds(x - w, y + h, w, h), depth);
//         } else {
//             this.NE.pointCount = 0;
//             this.NW.pointCount = 0;
//             this.SE.pointCount = 0;
//             this.SW.pointCount = 0;
//         }

//         this.divided = true;
//     }
//     query(part, fc, found) {
//         var i = this.pointCount;
//         if (this.depth === 0 || this.boundary.near(part)) {
//             if (this.depth > 1) {
//                 while (i--) {
//                     const p = this.points[i];
//                     if (!p.explored && part.near(p)) { found[fc++] = p }
//                 }
//                 if (this.divided) {
//                     fc = this.NE.pointCount ? this.NE.query(part, fc, found) : fc;
//                     fc = this.NW.pointCount ? this.NW.query(part, fc, found) : fc;
//                     fc = this.SE.pointCount ? this.SE.query(part, fc, found) : fc;
//                     fc = this.SW.pointCount ? this.SW.query(part, fc, found) : fc;
//                 }
//             } else if (this.divided) {
//                 fc = this.NE.query(part, fc, found);
//                 fc = this.NW.query(part, fc, found);
//                 fc = this.SE.query(part, fc, found);
//                 fc = this.SW.query(part, fc, found);
//             }
//         }
//         return fc;
//     }

//     close() {
//         if (this.divided) {
//             this.NE.close();
//             this.NW.close();
//             this.SE.close();
//             this.SW.close();
//         }

//         if (this.depth === 2 && this.divided) {
//             this.NE.pointCount = 0;
//             this.NW.pointCount = 0;
//             this.SE.pointCount = 0;
//             this.SW.pointCount = 0;
//         } else if (this.depth > 2) {
//             this.divided = false;
//         }
//     }
// }