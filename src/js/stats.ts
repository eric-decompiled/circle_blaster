export { Stats }

const sessionID = `${Date.now()}_${Math.random()}`
const endPoint = '/.netlify/functions/game'
class Stats {
    private gameTime: number
    private resizeCount: number
    constructor(
        private screenWidth: number,
        private screenHeight: number,
        public level = 1,
        public score = 0,
        private startTime = Date.now(),
        private gameCount = 0,
    ) {
        this.resizeCount = 0
    }

    resize(width: number, height: number) {
        this.resizeCount += 1
        this.screenWidth = width
        this.screenHeight = height
    }


    get playTime() {
        if (this.gameTime) return this.playTime
        return Date.now() - this.startTime
    }

    get playTimeString() {
        return `${new Date(this.gameTime).toISOString().substr(14, 5)}`
    }

    startGame() {
        this.score = 0
        this.resizeCount = 0
        this.startTime = Date.now()
        this.gameCount += 1
        this.post(this.startParams())
    }

    endGame() {
        this.gameTime = Date.now() - this.startTime
        this.post(this.endParams())
    }

    addPoints(points: number) {
        this.score += points
        this.setLevel()
    }

    private post(params: Object) {
        if (location.hostname === 'localhost') return // dont track dev
        const queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        const url = endPoint + `?${queryString}`
        const request = new XMLHttpRequest()
        request.open("GET", url)
        request.send()
    }


    private setLevel() {
        if (this.score > 2500) this.level = 2
        if (this.score > 5000) this.level = 3
        if (this.score > 10000) this.level = 4
        if (this.score > 15000) this.level = 5
        if (this.score > 25000) this.level = 6
        if (this.score > 50000) this.level = 7
        if (this.score > 100000) this.level = 8
        if (this.score > 150000) this.level = 9
    }

    private startParams(): Object {
        return {
            'event': 'Game Started',
            sessionID,
            'gameCount': this.gameCount,
            'screenWidth': this.screenWidth,
            'screenHeight': this.screenHeight,
        }
    }

    private endParams(): Object {
        return {
            'event': 'Game Ended',
            'playTime': this.playTimeString,
            sessionID,
            'score': this.score,
            'level': this.level,
            'gameCount': this.gameCount,
            'screenWidth': this.screenWidth,
            'screenHeight': this.screenHeight,
            'resizeCount': this.resizeCount
        }
    }
}