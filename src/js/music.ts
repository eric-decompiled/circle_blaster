import gsap from 'gsap'

const albatrossSongURL = './audio/albatross.mp3'
const movingMiamiSongURL = './audio/moving_to_miami.mp3'
const inCloudsSongURL = './audio/in_clouds.mp3'
export const bossMusicURL = './audio/boss.mp3'
export const victoryMusicURL = './audio/paint_the_wall.mp3'
export const defaultSong = albatrossSongURL

// normalize song volume
const volumes = {
    [albatrossSongURL]: 0.5,
    [movingMiamiSongURL]: 0.4,
    [inCloudsSongURL]: 0.33,
    [bossMusicURL]: 1.0,
    [victoryMusicURL]: 0.66,
}

export { BackgroundMusic }

class BackgroundMusic {
    private audio: HTMLAudioElement
    private isBoss: boolean
    constructor(startingSong = defaultSong) {
        this.audio = new Audio()
        this.setSong(startingSong)
        this.audio.addEventListener('ended', this.nextSong.bind(this))
        this.audio.addEventListener('load', () => { if (this.audio.pause) this.audio.play() })
    }

    setSong(songURL: string) {
        this.audio.src = songURL
        this.audio.volume = volumes[songURL]
        if (songURL === bossMusicURL) {
            this.isBoss = true
            this.audio.loop = true
        } else {
            this.audio.loop = false
            this.isBoss = false
        }
        this.audio.pause()
        this.audio.load()
        this.audio.play()
    }

    get isBossMusic(): boolean {
        return this.isBoss
    }

    fade(over: number) {
        gsap.to(this.audio, {
            volume: 0.0,
            duration: over / 1000, // so the time is consistent with JS setTimeout
        })
    }

    nextSong() {
        let path = `./${this.audio.src.split('/').slice(3).join('/')}`
        switch (path) {
            case albatrossSongURL: default:
                this.setSong(movingMiamiSongURL)
                break
            case movingMiamiSongURL:
                this.setSong(inCloudsSongURL)
                break
            case inCloudsSongURL: case victoryMusicURL:
                this.setSong(albatrossSongURL)
                break
        }
    }
}