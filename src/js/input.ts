import { Point } from "./models/base";

const MaxDelay = 20
export class Keys {
    private releaseTimes: Object
    constructor(
        public up = false,
        public down = false,
        public right = false,
        public left = false,
    ) {
        this.releaseTimes = {}
        addEventListener('keydown', ({ code }) => {
            let time = new Date().getTime()
            if (this.releaseTimes[code] && time < this.releaseTimes[code] + MaxDelay) return
            switch (code) {
                case 'KeyW': case 'ArrowUp':
                    this.up = true
                    break
                case 'KeyA': case 'ArrowLeft':
                    this.left = true
                    break
                case 'KeyS': case 'ArrowDown':
                    this.down = true
                    break
                case 'KeyD': case 'ArrowRight':
                    this.right = true
                    break
            }
        })

        addEventListener('keyup', ({ code }) => {
            this.releaseTimes[code] = new Date().getTime()
            switch (code) {
                case 'KeyW': case 'ArrowUp':
                    this.up = false
                    break
                case 'KeyA': case 'ArrowLeft':
                    this.left = false
                    break
                case 'KeyS': case 'ArrowDown':
                    this.down = false
                    break
                case 'KeyD': case 'ArrowRight':
                    this.right = false
                    break
            }
        })
        addEventListener('blur', () => {
            this.up = false
            this.left = false
            this.down = false
            this.right = false
        })
    }
}

export class Mouse {
    moveDelay = setTimeout(() => { }, 0)
    constructor(
        private offSet: Point,
        public down = false,
        public point = new Point(undefined, undefined),
    ) {
        window.addEventListener('mousedown', (event) => {
            this.moveDelay = setTimeout(() => this.down = true, 75)
        })

        addEventListener('mousemove', ({ clientX, clientY }) => {
            this.point.x = clientX - this.offSet.x
            this.point.y = clientY - this.offSet.y
        })

        addEventListener('mouseup', () => {
            clearTimeout(this.moveDelay)
            this.down = false
        })

        addEventListener('touchstart', (event) => {
            this.down = true
            this.point.x = event.touches[0].clientX
            this.point.y = event.touches[0].clientY
        })

        addEventListener('touchmove', (event) => {
            this.point.x = event.touches[0].clientX
            this.point.y = event.touches[0].clientY
        })

        addEventListener('touchend', () => {
            this.down = false
        })
        addEventListener('blur', () => {
            this.down = false
            point.x = undefined
            point.y = undefined
        })

    }
}