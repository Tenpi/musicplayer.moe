import React, {Component} from "react"
import Tone from "tone"
import encodeWAV from "audiobuffer-to-wav"
import func from "../structures/Functions"
import song from "../assets/music/Irsl - Define (Tenpi Remix).mp3"

export default class Main extends Component {
    private player: React.RefObject<HTMLAudioElement>
    private progressBar: React.RefObject<HTMLProgressElement>
    private loopButton: React.RefObject<HTMLButtonElement>
    private speedBar: React.RefObject<HTMLInputElement>
    private speedCheckbox: React.RefObject<HTMLInputElement>
    private pitchBar: React.RefObject<HTMLInputElement>
    private volumeBar: React.RefObject<HTMLInputElement>
    private source: Tone.Player
    public constructor(props: any) {
        super(props)
        this.player = React.createRef()
        this.progressBar = React.createRef()
        this.loopButton = React.createRef()
        this.speedBar = React.createRef()
        this.speedCheckbox = React.createRef()
        this.pitchBar = React.createRef()
        this.volumeBar = React.createRef()
        this.source = new Tone.Player(song).toDestination().sync()
        this.source.autostart = true
    }

    public play = async () => {
        const source = this.source
        await Tone.start()
        if (source.reverse === true) {
            if (this.progressBar.current?.value === 0) Tone.Transport.stop()
        } else {
            if (this.progressBar.current?.value === 100) Tone.Transport.stop()
        }
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause()
        } else {
            Tone.Transport.start()
        }
    }

    public stop = () => {
        Tone.Transport.stop()
    }

    public volume = () => {
        const volumeBar = this.volumeBar.current!
        const position = Number(volumeBar.value)
        Tone.Destination.volume.value = func.logSlider(position, 2, 50)
        if (position === 0) {
            Tone.Destination.mute = true
        } else {
            Tone.Destination.mute = false
        }
    }

    public speed = () => {
        const source = this.source
        const speedBar = this.speedBar.current!
        const speedCheckbox = this.speedCheckbox.current!
        source.playbackRate = Number(speedBar.value)
        if (!speedCheckbox.checked) {
            const shift = new Tone.PitchShift({
                pitch: 12*Math.log2(1/source.playbackRate)
            }).toMaster()
            source.disconnect().connect(shift)
        } else {
            source.disconnect().toMaster()
        }
        Tone.Transport.loopEnd = (source.buffer.duration / source.playbackRate)
    }

    public reset = () => {
        const source = this.source
        //(document.getElementById("speed") as HTMLInputElement).value = "1"
        source.playbackRate = 1
        source.reverse = false
        Tone.Transport.loop = false
        loopButton!.innerText = "Loop Off"
    }

    public loop = async () => {
        const source = this.source
        await Tone.loaded()
        if (Tone.Transport.loop === true) {
            loopButton!.innerText = "Loop Off"
            Tone.Transport.loop = false
        } else {
            loopButton!.innerText = "Loop On"
            Tone.Transport.loop = true
            Tone.Transport.loopStart = 0
            Tone.Transport.loopEnd = (source.buffer.duration / source.playbackRate)
        }
    }

    public reverse = async () => {
        const source = this.source
        let percent = Tone.Transport.seconds / (source.buffer.duration / source.playbackRate)
        if (source.reverse === true) {
            Tone.Transport.seconds = (1-percent) * (source.buffer.duration / source.playbackRate)
            source.reverse = false
        } else {
            Tone.Transport.seconds = (1-percent) * (source.buffer.duration / source.playbackRate)
            source.reverse = true
        }
    }

    public seek = (event: MouseEvent) => {
        const source = this.source
        const progressBar = this.progressBar.current!
        let percent = event.offsetX / progressBar.offsetWidth
        progressBar.value = percent * 100
        if (source.reverse === true) percent = (1-percent)
        Tone.Transport.seconds = percent * (source.buffer.duration / source.playbackRate)
    }

    public pitch = async () => {
        const source = this.source
        /*const shift = new Tone.PitchShift({
            pitch: document.getElementById("pitch").value
        }).toMaster()
        source.disconnect().connect(shift)*/
        //await Tone.context.addAudioWorkletModule("https://unpkg.com/@soundtouchjs/audio-worklet/dist/soundtouch-worklet.js", "soundtouch")
    }

    public download = async () => {
        const source = this.source
        const player = this.player.current!
        await Tone.loaded()
        const duration = (source.buffer.duration / source.playbackRate)
        const offline = new Tone.OfflineContext(2, duration, 44100)
        new Tone.Player({url: player.src, context: offline})
        const buffer = await offline.render()
        const wav = encodeWAV(buffer)
        var anchor = document.createElement("a")
        document.body.appendChild(anchor)
        anchor.style.display = "none"
        const blob = new Blob([new DataView(wav)], {type: "audio/wav"})
        const url = window.URL.createObjectURL(blob)
        anchor.href = url
        console.log(player.src)
        anchor.download = `${decodeURIComponent(player.src.replace(/(http)(.*?)(assets\/)/, "").slice(0, -4))}-edit.wav`
        anchor.click()
        window.URL.revokeObjectURL(url)
    }

    public componentDidMount = () => {
        const source = this.source
        const progressBar = this.progressBar.current!
        /*Update Progress*/
        window.setInterval(() => {
            let percent = Tone.Transport.seconds / (source.buffer.duration / source.playbackRate)
            if (!Number.isFinite(percent)) return
            if (source.reverse === true) percent = (1-percent)
            progressBar.value = percent * 100
        }, 1000)
    }

    public render = () => {
        return (
            <div>
                <audio ref={this.player} src={song}></audio>
                <button onClick={play}>Play</button>
                <button onClick={stop}>Stop</button>
                <button onClick={reverse}>Reverse</button>
                <button ref={this.loopButton} onClick={loop}>Loop Off</button>
                <button onClick={reset}>Reset</button>
                <button onClick={download}>Download</button>
                <input type="range" ref={this.speedBar} onInput={speed} min="0.5" max="4" step="0.5" value="1"/>
                <input type="checkbox" ref={this.speedCheckbox} checked onClick={speed}/>
                <input type="range" ref={this.volumeBar} onInput={volume} min="0" max="1" step="0.05" value="0.5"/>
                <br/><br/><progress ref={this.progressBar} value="0" max="100" onClick={seek}></progress>
                <input type="range" ref={this.pitchBar} onInput={pitch} min="-24" max="24" step="12" value="0"/>
            </div>
        )
    }
}