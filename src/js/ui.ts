import gsap from 'gsap'
import { Point, Color } from "./models/base"
import { BackgroundMusic, defaultSong, victoryMusicURL } from "./music"

export {
    Scene,
    gameStarted,
    gameContinued,
    infoBarEl,
    startGameBtn,
    continueGameBtn
}

const endGameAudio = new Audio('./audio/altEnd.mp3')
const winGameAudio = new Audio('/audio/activation.mp3')
const infoBarEl = document.querySelector('#infoBar')
const startGameBtn = document.querySelector('#startGameBtn') as HTMLElement
const continueGameBtn = document.querySelector('#continueGameBtn') as HTMLElement
const scoreEl = document.querySelector('#scoreEl')
const levelEl = document.querySelector('#levelEl')
const modalEl = document.querySelector('#modalEl') as HTMLElement
const bigScoreEl = document.querySelector('#bigScoreEl')
const runtimeEl = document.querySelector('#timeEl')
const victoryEl = document.querySelector('#victoryEl') as HTMLElement
const startGameAudio = new Audio('./audio/start.mp3')

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

const updateScore = (position: Point, points: number, currentScore: number) => {
    scoreEl.innerHTML = currentScore.toString()
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = points.toString()
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = position.x + 'px'
    scoreLabel.style.top = position.y + 'px'
    document.body.appendChild(scoreLabel)
    gsap.to(scoreLabel, {
        opacity: 0,
        y: -30,
        duration: 1,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

const displayVictoryModal = (stats) => {
    bigScoreEl.innerHTML = stats.score.toString()
    modalEl.style.display = 'flex'
    victoryEl.style.display = 'block'
    bigScoreEl.innerHTML = stats.score.toString()
    runtimeEl.innerHTML = stats.playTime

    startGameBtn.style.display = 'none'
    continueGameBtn.style.display = 'block'
    displayModal()
}
const dismissModal = () => {
    gsap.to(modalEl, {
        opacity: 0,
        scale: 0.75,
        ease: 'expo',
        duration: 0.25,
        onComplete: () => modalEl.style.display = 'none'
    })
}

const displayModal = () => {
    gsap.to(modalEl, {
        opacity: 1,
        scale: 1,
        duration: 0.35,
    })
}

const displayStartModal = (score: number) => {
    modalEl.style.display = 'flex'
    victoryEl.style.display = 'none'
    bigScoreEl.innerHTML = score.toString()
    gsap.to(modalEl, {
        opacity: 1,
        scale: 1,
        duration: 0.35,
    })
}

const gameStarted = (scene: Scene) => {
    scene.active = true
    startGameAudio.play()
    scoreEl.innerHTML = '0'
    levelEl.innerHTML = '1'
    dismissModal()
}

const gameContinued = (scene: Scene) => {
    scene.active = true
    continueGameBtn.style.display = 'none'
    startGameBtn.style.display = 'block'
    dismissModal()
}

const updateLevel = (level: number) => {
    levelEl.innerHTML = level.toString()
}