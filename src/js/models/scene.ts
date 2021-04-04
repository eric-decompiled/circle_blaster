import { BackgroundMusic, defaultSong, victoryMusicURL } from "../music"
import { displayStartModal, displayVictoryModal, updateLevel, updateScore } from "../ui"
import { Color, Point } from "./base"
const endGameAudio = new Audio('./audio/altEnd.mp3')
const winGameAudio = new Audio('/audio/activation.mp3')
export { Scene }

class Scene {
    constructor(
        public bgMusic = new BackgroundMusic(),
        public active = false,
        public boss = false,
        public color: Color = undefined,
        public score = 0,
        public level = 1,
        public startTime = Date.now(),
    ) {
        if (this.bgMusic.isBossMusic) {
            bgMusic.fade(2000)
            setTimeout(() => bgMusic.setSong(defaultSong), 2100)
        }
    }

    setLevel() {
        if (this.score > 2500) this.level = 2
        if (this.score > 5000) this.level = 3
        if (this.score > 10000) this.level = 4
        if (this.score > 15000) this.level = 5
        if (this.score > 250000) this.level = 6
        if (this.score > 1000000) this.level = 7
        updateLevel(this.level)
    }

    addScore(position: Point, points: number) {
        this.score += points
        updateScore(position, points, this.score)
    }

    stats() {
        const playTime = Date.now() - this.startTime
        const playTimeString = `${new Date(playTime).toISOString().substr(14, 5)}`
        return {
            'score': this.score,
            'playTime': playTimeString,
        }
    }

    winGame(animationId: number) {
        cancelAnimationFrame(animationId)
        this.active = false
        winGameAudio.play()
        this.bgMusic.setSong(victoryMusicURL)
        displayVictoryModal(this.stats())
    }

    endGame(animationId: number) {
        cancelAnimationFrame(animationId)
        endGameAudio.play()
        this.active = false
        displayStartModal(this.score)
    }
}