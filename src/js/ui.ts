import gsap from 'gsap'
import { Point } from "./models/base"

export {
    displayVictoryModal,
    displayStartModal,
    updateLevel,
    updateScore,
    gameStarted,
}

export const inforBarEl = document.querySelector('#infoBar')
export const startGameBtn = document.querySelector('#startGameBtn')
const scoreEl = document.querySelector('#scoreEl')
const levelEl = document.querySelector('#levelEl')
const modalEl = document.querySelector('#modalEl') as HTMLElement
const bigScoreEl = document.querySelector('#bigScoreEl')
const runtimeEl = document.querySelector('#timeEl')
const victoryEl = document.querySelector('#victoryEl') as HTMLElement


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

const gameStarted = () => {
    scoreEl.innerHTML = '0'
    levelEl.innerHTML = '1'
    gsap.to(modalEl, {
        opacity: 0,
        scale: 0.75,
        ease: 'expo',
        duration: 0.25,
        onComplete: () => modalEl.style.display = 'none'
    })
}

const updateLevel = (level: number) => {
    levelEl.innerHTML = level.toString()
}