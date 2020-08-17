import React, {useReducer, useState, useEffect, useRef} from "react"
import Slider from "rc-slider"
import * as Tone from "tone"
import encodeWAV from "audiobuffer-to-wav"
import func from "../structures/Functions"
import song from "../assets/music/Irsl - Define (Tenpi Remix).mp3"
const RangeSlider = Slider.Range

const Main: React.FunctionComponent = (props) => {
    const player = useRef(null) as React.RefObject<HTMLAudioElement>
    const progressBar = useRef(null) as React.RefObject<HTMLProgressElement>
    const loopButton = useRef(null) as React.RefObject<HTMLButtonElement>
    const speedBar = useRef(null) as React.RefObject<HTMLInputElement>
    const speedCheckbox = useRef(null) as React.RefObject<HTMLInputElement>
    const pitchBar = useRef(null) as React.RefObject<HTMLInputElement>
    const volumeBar = useRef(null) as React.RefObject<HTMLInputElement>
    const uploadFile = useRef(null) as React.RefObject<HTMLInputElement>
    const secondsProgress = useRef(null) as React.RefObject<HTMLSpanElement>
    const secondsTotal = useRef(null) as React.RefObject<HTMLSpanElement>
    const abSlider = useRef(null) as React.RefObject<any>

    let state = {
        reverse: false,
        pitch: 0,
        speed: 1,
        volume: 0.5,
        speedBox: true,
        loop: false,
        abloop: false,
        loopStart: 0,
        loopEnd: 100,
        song
    }

    const initialState = {...state}

    const source = new Tone.Player(state.song).toDestination().sync().start()
    console.log("render")

    const play = async () => {
        await Tone.start()
        await Tone.loaded()
        const progress = Number(progressBar.current?.value)
        if (state.reverse === true) {
            if (progress === 0) Tone.Transport.stop()
        } else {
            if (progress === 100) Tone.Transport.stop()
        }
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause()
        } else {
            Tone.Transport.start()
            secondsTotal.current!.innerText = func.formatSeconds(source.buffer.duration / source.playbackRate)
        }
    }

    const stop = () => {
        Tone.Transport.stop()
    }

    const volume = (event: React.ChangeEvent<HTMLInputElement>) => {
        state.volume = Number(event.target.value)
        Tone.Destination.volume.value = func.logSlider(state.volume, 2, 50)
        if (state.volume === 0) {
            Tone.Destination.mute = true
        } else {
            Tone.Destination.mute = false
        }
    }

    const speed = (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.speed = Number(event.target.value)
        source.playbackRate = state.speed
        if (!state.speedBox) {
            const shift = new Tone.PitchShift({
                pitch: 12*Math.log2(1/source.playbackRate)
            }).toDestination()
            source.disconnect().connect(shift)
        } else {
            source.disconnect().toDestination()
        }
        const duration = (source.buffer.duration / source.playbackRate)
        if (state.abloop) {
            applyAB(duration)
        } else {
            Tone.Transport.loopEnd = duration
        }   
        secondsProgress.current!.innerText = func.formatSeconds(Tone.Transport.seconds)
        secondsTotal.current!.innerText = func.formatSeconds(duration)
    }

    const speedBox = (event: React.ChangeEvent<HTMLInputElement>) => {
        state.speedBox = !state.speedBox
        speedCheckbox.current!.checked = state.speedBox
        return speed()
    }

    const reset = () => {
        state = {...initialState}
        source.playbackRate = state.speed
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = state.speedBox
        pitchBar.current!.value = String(state.pitch)
        source.reverse = state.reverse
        Tone.Transport.loop = state.loop
        loopButton.current!.innerText = "Loop Off"
        abSlider.current.sliderRef.childNodes[1].style = "left: 0%; right: auto; width: 100%;"
        abSlider.current.sliderRef.childNodes[3].ariaValueNow = "0"
        abSlider.current.sliderRef.childNodes[3].style = "left: 0%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.childNodes[4].ariaValueNow = "100"
        abSlider.current.sliderRef.childNodes[4].style = "left: 100%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.style.display = "none"
        source.disconnect().toDestination()
    }

    const loop = async () => {
        await Tone.loaded()
        if (state.loop === true) {
            state.loop = false
            Tone.Transport.loop = false
            loopButton.current!.innerText = "Loop Off"
        } else {
            const duration =  (source.buffer.duration / source.playbackRate)
            state.loop = true
            Tone.Transport.loop = true
            loopButton.current!.innerText = "Loop On"
            Tone.Transport.loopStart = state.abloop ? state.loopStart : 0
            Tone.Transport.loopEnd = state.abloop ? state.loopEnd : duration
        }
    }

    const reverse = async () => {
        const duration =  (source.buffer.duration / source.playbackRate)
        let percent = Tone.Transport.seconds / duration
        if (state.reverse === true) {
            Tone.Transport.seconds = (1-percent) * duration
            state.reverse = false
            source.reverse = false
        } else {
            Tone.Transport.seconds = (1-percent) * duration
            state.reverse = true
            source.reverse = true
        }
        applyAB(duration)
    }

    useEffect(() => {
        /*Update Progress*/
        window.setInterval(() => {
            const duration = (source.buffer.duration / source.playbackRate)
            let percent = Tone.Transport.seconds / duration
            if (!Number.isFinite(percent)) return
            if (state.reverse === true) {
                progressBar.current!.value = (1-percent) * 100
                secondsProgress.current!.innerText = func.formatSeconds(duration - Tone.Transport.seconds)
            } else {
                progressBar.current!.value = percent * 100
                secondsProgress.current!.innerText = func.formatSeconds(Tone.Transport.seconds)
            }
        }, 1000)
        /** Store state */
        window.onbeforeunload = () => {
            localStorage.setItem("state", JSON.stringify(state))
        }
        return window.clearInterval()
    }, [])

    const seek = (event: React.MouseEvent<HTMLProgressElement>) => {
        const duration = (source.buffer.duration / source.playbackRate)
        let percent = event.nativeEvent.offsetX / progressBar.current!.offsetWidth
        progressBar.current!.value = percent * 100
        if (state.reverse === true) {
            Tone.Transport.seconds = (1-percent) * duration
            secondsProgress.current!.innerText = func.formatSeconds(duration - Tone.Transport.seconds)
        } else {
            Tone.Transport.seconds = percent * duration
            secondsProgress.current!.innerText = func.formatSeconds(Tone.Transport.seconds)
        }
    }

    const pitch = async (event: React.ChangeEvent<HTMLInputElement>) => {
        state.pitch = Number(event.target.value)
        /*const shift = new Tone.PitchShift({
            pitch: document.getElementById("pitch").value
        }).toDestination()
        source.disconnect().connect(shift)*/
        //await Tone.context.addAudioWorkletModule("https://unpkg.com/@soundtouchjs/audio-worklet/dist/soundtouch-worklet.js", "soundtouch")
    }

    /** Renders the same as online */
    const render = (source: Tone.Player) => {
        source.reverse = state.reverse
        source.playbackRate = state.speed
        return source
    }

    const download = async () => {
        await Tone.loaded()
        const duration = (source.buffer.duration / source.playbackRate)
        const buffer = await Tone.Offline(async ({transport}) => {
            let source = new Tone.Player().toDestination().sync()
            await source.load(state.song)
            source = render(source)
            source.start()
            transport.start()
        }, duration)
        const wav = encodeWAV(buffer)
        var anchor = document.createElement("a")
        document.body.appendChild(anchor)
        anchor.style.display = "none"
        const blob = new Blob([new DataView(wav)], {type: "audio/wav"})
        const url = window.URL.createObjectURL(blob)
        anchor.href = url
        console.log(state.song)
        anchor.download = `${decodeURIComponent(state.song.replace("assets/music/", "").slice(0, -4))}-edit.wav`
        anchor.click()
        window.URL.revokeObjectURL(url)
    }

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        window.URL.revokeObjectURL(state.song)
        const file = event.target.files?.[0]
        if (!file) return
        const url = window.URL.createObjectURL(file)
        await source.load(url)
        stop()
        play()
    }

    const applyAB = (duration: number) => {
        let percent = duration / 100.0
        if (state.reverse) {
            Tone.Transport.loopStart = (100 - state.loopEnd) * percent
            Tone.Transport.loopEnd = (100 - state.loopStart) * percent
        } else {
            Tone.Transport.loopStart = state.loopStart * percent
            Tone.Transport.loopEnd = state.loopEnd * percent
        }
    }

    const abloop = (value: [number, number]) => {
        Tone.Transport.loop = true
        if (Tone.Transport.state === "paused") Tone.Transport.start()
        state.loopStart = value[0]
        state.loopEnd = value[1]
        applyAB(source.buffer.duration / source.playbackRate)
        if (Tone.Transport.loopStart === Tone.Transport.loopEnd) Tone.Transport.pause()
        if ((Tone.Transport.seconds >= Tone.Transport.loopStart) && (Tone.Transport.seconds <= Tone.Transport.loopEnd)) return
        Tone.Transport.seconds = Number(Tone.Transport.loopStart)
    }

    const toggleAB = () => {
        if (abSlider.current.sliderRef.style.display === "none") {
            abSlider.current.sliderRef.style.display = "flex"
            state.abloop = true
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.loopStart
            Tone.Transport.loopEnd = state.loopEnd
        } else {
            abSlider.current.sliderRef.style.display = "none"
            state.abloop = false
            Tone.Transport.loop = false
            state.loop = false
            loopButton.current!.innerText = "Loop Off"
        }
    }

    return (
        <div>
            <audio ref={player} src={song}></audio>
            <button onClick={play}>Play</button>
            <button onClick={stop}>Stop</button>
            <button onClick={reverse}>Reverse</button>
            <button ref={loopButton} onClick={loop}>Loop Off</button>
            <button onClick={toggleAB}>A-B Loop</button>
            <button onClick={reset}>Reset</button>
            <button onClick={download}>Download</button>
            <input type="file" ref={uploadFile} onChange={(event) => upload(event)} style={({display: "none"})} multiple/>
            <button onClick={() => uploadFile.current?.click()}>Upload</button>
            <input type="range" ref={speedBar} onChange={(event) => speed(event)} min="0.5" max="4" step="0.5" defaultValue="1"/>
            <input type="checkbox" ref={speedCheckbox} defaultChecked onChange={(event) => speedBox(event)}/>
            <input type="range" ref={volumeBar} onChange={(event) => volume(event)} min="0" max="1" step="0.05" defaultValue="1"/>
            <input type="range" ref={pitchBar} onChange={(event) => pitch(event)} min="-24" max="24" step="12" defaultValue="0"/>
            <br/><br/><progress ref={progressBar} max="100" onClick={(event) => seek(event)} defaultValue="0" value="0"></progress>
            <p><span ref={secondsProgress}>0:00</span> / <span ref={secondsTotal}>0:00</span></p>
            <br/><br/><RangeSlider ref={abSlider} min={0} max={100} defaultValue={[0, 100]} onAfterChange={(value) => abloop(value)} style={({display: "none"})}/>
        </div>
    )
}

export default Main