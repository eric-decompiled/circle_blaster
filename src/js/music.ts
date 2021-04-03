import gsap from 'gsap'

const albatrossSongURL = './audio/albatross.mp3'
const movingMiamiSongURL = './audio/moving_to_miami.mp3'
const inCloudsSongURL = './audio/in_clouds.mp3'
export const bossMusicURL = './audio/boss.mp3'
export const victoryMusicURL = './audio/rising_stars.mp3'
export const defaultSong = albatrossSongURL

// normalize song volume
const volumes = {
    [albatrossSongURL]: 0.5,
    [movingMiamiSongURL]: 0.4,
    [inCloudsSongURL]: 0.33,
    [bossMusicURL]: 1.0,
    [victoryMusicURL]: 1.0
}


export { BackgroundMusic }

class BackgroundMusic {
    audio: HTMLAudioElement
    constructor(startingSong = defaultSong) {
        this.audio = new Audio()
        this.setSong(startingSong)
        this.audio.addEventListener('ended', this.nextSong.bind(this))
    }

    setSong(songURL: string) {
        this.audio.src = songURL
        this.audio.volume = volumes[songURL]
        if (songURL === bossMusicURL) {
            this.audio.loop = true
        } else {
            this.audio.loop = false
        }
        this.audio.pause()
        this.audio.load()
        this.audio.play()
    }

    get isBoss(): boolean {
        return this.audio.src === bossMusicURL
    }

    fade(over: number) {
        gsap.to(this.audio, {
            volume: 0.0,
            duration: over / 1000, // so the time is consistent with JS setTimeout
        })
    }

    nextSong() {
        switch (this.audio.src) {
            case albatrossSongURL: default:
                this.setSong(movingMiamiSongURL)
                break
            case movingMiamiSongURL:
                this.setSong(inCloudsSongURL)
                break
            case inCloudsSongURL:
                this.setSong(albatrossSongURL)
                break
        }
    }

    // fadeout boss music after a win
    // gsap.to(bossMusic, {
    //     volume: 0.0,
    //     duration: 4,
    //     onComplete: () => {
    //         bossMusic.pause()
    //         bossMusic.currentTime = 0
    //         bossMusic.volume = 1.0
    //     }
    // })
    // backgroundMusic.volume = 0.5
    // backgroundMusic.play()
}