import React, {useReducer, useState, useEffect, useRef} from "react"
import Slider from "rc-slider"
import * as Tone from "tone"
import encodeWAV from "audiobuffer-to-wav"
import func from "../structures/Functions"
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
        grainPlayer: true,
        duration: 0,
        song: "",
        songName: ""
    }

    const initialState = {...state}

    let source = new Tone.GrainPlayer().sync().start().toDestination()
    let playerSource = new Tone.Player().sync().start()
    source.grainSize = 0.1

    const duration = () => {
        const current = state.grainPlayer ? source : playerSource
        state.duration = current.buffer.duration / current.playbackRate
        secondsTotal.current!.innerText = func.formatSeconds(state.duration)
    }

    const checkBuffer = () => {
        const current = state.grainPlayer ? source : playerSource
        return current.buffer.loaded
    }

    const play = async () => {
        if (!checkBuffer()) return
        await Tone.start()
        await Tone.loaded()
        duration()
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause()
        } else {
            Tone.Transport.start()
        }
    }

    const stop = () => {
        if (!checkBuffer()) return
        Tone.Transport.stop()
    }

    const volume = (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.volume = Number(event.target.value)
        Tone.Destination.volume.value = func.logSlider(state.volume, 2, 50)
        if (state.volume === 0) {
            Tone.Destination.mute = true
        } else {
            Tone.Destination.mute = false
        }
    }

    const speed = async (event?: React.ChangeEvent<HTMLInputElement>, applyState?: any) => {
        if (event) state.speed = Number(event.target.value)
        let currentSource = source
        let currentPlayer = playerSource
        let current: any
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.playerSource
        }
        if (!state.speedBox) {
            state.grainPlayer = false
            currentPlayer.playbackRate = state.speed
            currentSource.disconnect()
            currentPlayer.disconnect().toDestination()
            current = currentPlayer
        } else {
            state.grainPlayer = true
            currentSource.playbackRate = state.speed
            currentPlayer.disconnect()
            currentSource.disconnect().toDestination()
            current = currentSource
        }
        state.duration  = (current.buffer.duration / current.playbackRate)
        let seconds = Tone.Transport.seconds / current.playbackRate
        if (state.abloop) {
            applyAB(state.duration)
        } else {
            Tone.Transport.loopEnd = state.duration
        }   
        secondsTotal.current!.innerText = func.formatSeconds(state.duration)
        if (state.reverse === true) {
            secondsProgress.current!.innerText = func.formatSeconds(state.duration - seconds)
        } else {
            secondsProgress.current!.innerText = func.formatSeconds(seconds)
        }
    }

    const speedBox = () => {
        state.speedBox = !state.speedBox
        speedCheckbox.current!.checked = state.speedBox
        return speed()
    }

    const reset = () => {
        const duration = state.duration
        const song = state.song
        const songName = state.songName
        state = {...initialState}
        state.duration = duration
        state.song = song
        state.songName = songName
        source.playbackRate = state.speed
        playerSource.playbackRate = state.speed
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = state.speedBox
        source.detune = state.pitch
        pitchBar.current!.value = String(state.pitch)
        source.reverse = state.reverse
        playerSource.reverse = state.reverse
        Tone.Transport.loop = state.loop
        loopButton.current!.innerText = "Loop Off"
        abSlider.current.sliderRef.childNodes[1].style = "left: 0%; right: auto; width: 100%;"
        abSlider.current.sliderRef.childNodes[3].ariaValueNow = "0"
        abSlider.current.sliderRef.childNodes[3].style = "left: 0%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.childNodes[4].ariaValueNow = "100"
        abSlider.current.sliderRef.childNodes[4].style = "left: 100%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.style.display = "none"
        playerSource.disconnect()
        source.disconnect().toDestination()
    }

    const loop = async () => {
        await Tone.loaded()
        if (state.loop === true) {
            state.loop = false
            Tone.Transport.loop = false
            loopButton.current!.innerText = "Loop Off"
        } else {
            state.loop = true
            Tone.Transport.loop = true
            loopButton.current!.innerText = "Loop On"
            Tone.Transport.loopStart = state.abloop ? state.loopStart : 0
            Tone.Transport.loopEnd = state.abloop ? state.loopEnd : state.duration
        }
    }

    const reverse = async (applyState?: any) => {
        let currentSource = source
        let currentPlayer = playerSource
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.playerSource
        }
        let percent = Tone.Transport.seconds / state.duration
        if (state.reverse === true || applyState) {
            if (!applyState) Tone.Transport.seconds = (1-percent) * state.duration
            state.reverse = false
            currentSource.reverse = false
            currentPlayer.reverse = false
        } else {
            if (!applyState) Tone.Transport.seconds = (1-percent) * state.duration
            state.reverse = true
            currentSource.reverse = true
            currentPlayer.reverse = true
        }
        applyAB(state.duration)
    }

    useEffect(() => {
        /*Update Progress*/
        window.setInterval(() => {
            const current = state.grainPlayer ? source : playerSource
            let seconds = Tone.Transport.seconds
            let percent = seconds / state.duration
            if (!Number.isFinite(percent)) return
            if (state.reverse === true) {
                progressBar.current!.value = (1-percent) * 100
                if (Tone.Transport.seconds !== state.duration) {
                    secondsProgress.current!.innerText = func.formatSeconds(state.duration - seconds)
                }
            } else {
                progressBar.current!.value = percent * 100
                if (Tone.Transport.seconds !== state.duration) {
                    secondsProgress.current!.innerText = func.formatSeconds(seconds)
                }
            }
            if (!state.loop && !state.abloop && Tone.Transport.state === "started") {
                const progress = Number(progressBar.current?.value)
                if (state.reverse === true) {
                    if (progress === 0) stop()
                } else {
                    if (progress === 100) stop()
                }
            }
        }, 1000)
        /** Store state */
        window.onbeforeunload = () => {
            localStorage.setItem("state", JSON.stringify(state))
        }
        return window.clearInterval()
    }, [])

    const seek = (event: React.MouseEvent<HTMLProgressElement>) => {
        let percent = event.nativeEvent.offsetX / progressBar.current!.offsetWidth
        let current = state.grainPlayer ? source : playerSource
        progressBar.current!.value = percent * 100
        if (state.reverse === true) {
            Tone.Transport.seconds = (1-percent) * state.duration
            secondsProgress.current!.innerText = func.formatSeconds(state.duration - Tone.Transport.seconds)
        } else {
            Tone.Transport.seconds = percent * state.duration
            secondsProgress.current!.innerText = func.formatSeconds(Tone.Transport.seconds)
        }
    }

    const pitch = async (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.pitch = Number(event.target.value) 
        source.detune = state.pitch * 100
    }

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        window.URL.revokeObjectURL(state.song)
        const file = event.target.files?.[0]
        if (!file) return
        state.songName = file.name
        state.song = window.URL.createObjectURL(file)
        await source.buffer.load(state.song)
        await playerSource.load(state.song)
        await Tone.loaded()
        duration()
        if (Tone.Transport.state === "stopped") {
            play()
        } 
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
        applyAB(state.duration)
        if (Tone.Transport.loopStart === Tone.Transport.loopEnd) Tone.Transport.pause()
        if ((Tone.Transport.seconds >= Tone.Transport.loopStart) && (Tone.Transport.seconds <= Tone.Transport.loopEnd)) return
        Tone.Transport.seconds = Number(Tone.Transport.loopStart)
    }

    const toggleAB = (applyState?: any) => {
        if (abSlider.current.sliderRef.style.display === "none" || applyState) {
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

    const applyState = async (state: any, source: Tone.GrainPlayer, playerSource: Tone.Player, reload?: boolean) => {
        const apply = {state, source, playerSource}
        if (reload && state.song) {
            console.log(state.song)
            const decoded = atob(state.song)
            await source.buffer.load(decoded)
            await playerSource.load(decoded)
            await Tone.loaded()
        }
        if (state.speed !== 1) {
            speed(undefined, apply)
        }
        if (state.reverse !== false) {
            reverse(apply)
        } 
        if (state.pitch !== 0) {
            pitch()
        }
        if (state.abloop !== false) {
            toggleAB(true)
        }
        return state.grainPlayer ? source : playerSource
    }

     /** Renders the same as online */
     const render = async (duration: number) => {
        return Tone.Offline(async ({transport}) => {
            let source = new Tone.GrainPlayer().sync().start().toDestination()
            let playerSource = new Tone.Player().sync().start()
            source.grainSize = 0.1
            const current = await applyState(state, source, playerSource, true)
            current.start()
            transport.start()
        }, duration)
    }

    const download = async () => {
        if (!checkBuffer()) return
        await Tone.loaded()
        const buffer = await render(state.duration)
        const wav = encodeWAV(buffer)
        var anchor = document.createElement("a")
        document.body.appendChild(anchor)
        anchor.style.display = "none"
        const blob = new Blob([new DataView(wav)], {type: "audio/wav"})
        const url = window.URL.createObjectURL(blob)
        anchor.href = url
        anchor.download = `${state.songName.slice(0, -4)}.wav`
        anchor.click()
        window.URL.revokeObjectURL(url)
    }

    /* Apply saved state */
    useEffect(() => {        
        /*
        const savedState = localStorage.getItem("state")
        if (!savedState) return
        const oldSong = state.song
        state = {...JSON.parse(savedState)}
        applyState(state, source, playerSource, oldSong !== state.song)
        loop()
        volume()
        speedCheckbox.current!.checked = state.speedBox
        volumeBar.current!.value = String(state.volume)
        pitchBar.current!.value = String(state.pitch)
        speedBar.current!.value = String(state.speed)
        loopButton.current!.innerText = state.loop ? "Loop On" : "Loop Off"
        */
    }, [])

    return (
        <div>
            <audio ref={player}></audio>
            <button onClick={() => play()}>Play</button>
            <button onClick={() => stop()}>Stop</button>
            <button onClick={() => reverse()}>Reverse</button>
            <button ref={loopButton} onClick={() => loop()}>Loop Off</button>
            <button onClick={() => toggleAB()}>A-B Loop</button>
            <button onClick={() => reset()}>Reset</button>
            <button onClick={() => download()}>Download</button>
            <input type="file" ref={uploadFile} onChange={(event) => upload(event)} style={({display: "none"})} multiple/>
            <button onClick={() => uploadFile.current?.click()}>Upload</button>
            <input type="range" ref={speedBar} onChange={(event) => speed(event)} min="0.5" max="4" step="0.5" defaultValue="1"/>
            <input type="checkbox" ref={speedCheckbox} defaultChecked onChange={() => speedBox()}/>
            <input type="range" ref={volumeBar} onChange={(event) => volume(event)} min="0" max="1" step="0.05" defaultValue="1"/>
            <input type="range" ref={pitchBar} onChange={(event) => pitch(event)} min="-24" max="24" step="12" defaultValue="0"/>
            <br/><br/><progress ref={progressBar} max="100" onClick={(event) => seek(event)} defaultValue="0" value="0"></progress>
            <p><span ref={secondsProgress}>0:00</span> / <span ref={secondsTotal}>0:00</span></p>
            <br/><br/><RangeSlider ref={abSlider} min={0} max={100} defaultValue={[0, 100]} onAfterChange={(value) => abloop(value)} style={({display: "none"})}/>
        </div>
    )
}

export default Main