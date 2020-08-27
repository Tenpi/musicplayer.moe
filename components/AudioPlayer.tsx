import React, {useReducer, useState, useEffect, useRef} from "react"
import Slider from "rc-slider"
import * as Tone from "tone"
import jsmediatags from "jsmediatags"
import encodeWAV from "audiobuffer-to-wav"
import functions from "../structures/Functions"
import searchIcon from "../assets/icons/search-icon.png"
import waveform from "../assets/images/wave-placeholder.png"
import playIcon from "../assets/icons/play.png"
import pauseIcon from "../assets/icons/pause.png"
import stopIcon from "../assets/icons/stop.png"
import reverseIcon from "../assets/icons/reverse.png"
import speedIcon from "../assets/icons/speed.png"
import pitchIcon from "../assets/icons/pitch.png"
import loopIcon from "../assets/icons/loop.png"
import abLoopIcon from "../assets/icons/abloop.png"
import eqIcon from "../assets/icons/eq.png"
import fxIcon from "../assets/icons/fx.png"
import resetIcon from "../assets/icons/clear.png"
import volumeIcon from "../assets/icons/volume.png"
import volumeLowIcon from "../assets/icons/volume-low.png"
import muteIcon from "../assets/icons/mute.png"
import musicNote from "../assets/icons/music-note.png"
import "../styles/audioplayer.less"

const AudioPlayer: React.FunctionComponent = (props) => {
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
    const searchBox = useRef(null) as React.RefObject<HTMLInputElement>
    const reverbMix = useRef(null) as React.RefObject<HTMLInputElement>
    const playButton = useRef(null) as React.RefObject<HTMLImageElement>
    const volumePopup = useRef(null) as React.RefObject<HTMLDivElement>
    const volumeRef = useRef(null) as React.RefObject<HTMLImageElement>
    const speedPopup = useRef(null) as React.RefObject<HTMLDivElement>
    const pitchPopup = useRef(null) as React.RefObject<HTMLDivElement>
    const speedImg = useRef(null) as React.RefObject<HTMLImageElement>
    const pitchImg = useRef(null) as React.RefObject<HTMLImageElement>
    const songCover = useRef(null) as React.RefObject<HTMLImageElement>
    const metadataText = useRef(null) as React.RefObject<HTMLDivElement>
    const songTitle = useRef(null) as React.RefObject<HTMLHeadingElement>
    const reverseMeta = useRef(null) as React.RefObject<HTMLDivElement>
    const loopMeta = useRef(null) as React.RefObject<HTMLDivElement>
    const abLoopMeta = useRef(null) as React.RefObject<HTMLDivElement>

    let state = {
        reverse: false,
        pitch: 0,
        speed: 1,
        volume: 1,
        muted: false,
        speedBox: true,
        loop: false,
        abloop: false,
        loopStart: 0,
        loopEnd: 0,
        grainPlayer: true,
        duration: 0,
        song: "",
        songName: "",
        songCover: "",
        editCode: "",
        download: "",
        effects: [] as {type: string, node: Tone.ToneAudioNode}[],
        reverb: false,
        reverbMix: 0,
        reverbDecay: 1.5,
        reverbPreDelay: 0.01
    }

    const initialState = {...state}

    let source = new Tone.GrainPlayer().sync().start().toDestination()
    let player = new Tone.Player().sync().start()
    source.grainSize = 0.1
    source.overlap = 0.1

    const removeEffect = (type: string) => {
        const index = state.effects.findIndex((e) => e.type === type)
        if (index !== -1) {
            state.effects[index] = null as any
            state.effects = state.effects.filter(Boolean)
        }
    }

    const pushEffect = (type: string, node: Tone.ToneAudioNode) => {
        const obj = {type, node}
        const index = state.effects.findIndex((e) => e.type === type)
        if (index !== -1) {
            state.effects[index] = obj
        } else {
            state.effects.push(obj)
        }
    }
    
    const applyEffects = (applyState?: any) => {
        let currentSource = source
        let currentPlayer = player 
        if (applyState) {
            currentSource = applyState.source 
            currentPlayer = applyState.player
        }
        currentSource.disconnect()
        currentPlayer.disconnect()
        const nodes = state.effects.map((e) => e.node)
        currentSource.chain(...nodes)
        currentPlayer.chain(...nodes)
        const current = state.grainPlayer ? currentSource : currentPlayer
        if (state.effects[0]) {
            nodes[nodes.length - 1].toDestination()
        } else {
            current.toDestination()
        }
    }

    const duration = () => {
        const current = state.grainPlayer ? source : player
        state.duration = current.buffer.duration / current.playbackRate
        secondsTotal.current!.innerText = functions.formatSeconds(state.duration)
    }

    const checkBuffer = () => {
        const current = state.grainPlayer ? source : player
        return current.buffer.loaded
    }

    const play = async () => {
        if (!checkBuffer()) return
        await Tone.start()
        await Tone.loaded()
        duration()
        const progress = Math.round(Number(progressBar.current?.value))
        if (state.reverse === true) {
            if (progress === 0) stop()
        } else {
            if (progress === 100) stop()
        }
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause()
        } else {
            Tone.Transport.start()
        }
    }

    const stop = () => {
        if (!checkBuffer()) return
        if (Tone.Transport.state === "stopped") return
        Tone.Transport.stop()
    }

    const mute = () => {
        if (state.muted === true) {
            state.muted = false
            Tone.Destination.mute = false
            if (state.volume === 0) state.volume = 1
            volumeBar.current!.value = String(state.volume)
            Tone.Destination.volume.value = functions.logSlider(state.volume, 2, 50)
            if (state.volume <= 0.5) {
                volumeRef.current!.src = volumeLowIcon
            } else {
                volumeRef.current!.src = volumeIcon
            }
        } else {
            state.muted = true
            Tone.Destination.mute = true
            volumeRef.current!.src = muteIcon
            volumeBar.current!.value = "0"
        }
    }

    const volume = (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.volume = Number(event.target.value)
        Tone.Destination.volume.value = functions.logSlider(state.volume, 2, 50)
        if (state.volume === 0) {
            Tone.Destination.mute = true
            state.muted = true
            volumeRef.current!.src = muteIcon
        } else {
            Tone.Destination.mute = false
            state.muted = false
            if (state.volume <= 0.5) {
                volumeRef.current!.src = volumeLowIcon
            } else {
                volumeRef.current!.src = volumeIcon
            }
        }
    }

    const speed = async (event?: React.ChangeEvent<HTMLInputElement>, applyState?: any) => {
        if (event) state.speed = Number(event.target.value)
        let currentSource = source
        let currentPlayer = player
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.player
        }
        if (!state.speedBox) {
            state.grainPlayer = false
            currentPlayer.playbackRate = state.speed
            applyEffects()
        } else {
            state.grainPlayer = true
            currentSource.playbackRate = state.speed
            applyEffects()
        }
        let percent = Tone.Transport.seconds / state.duration
        state.duration  = (source.buffer.duration / state.speed)
        Tone.Transport.seconds = percent * state.duration
        if (state.abloop) {
            applyAB(state.duration)
        } else {
            Tone.Transport.loopEnd = state.duration
        }   
        secondsTotal.current!.innerText = functions.formatSeconds(state.duration)
        if (state.reverse === true) {
            secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
        } else {
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
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
        const songCover = state.songCover
        state = {...initialState}
        state.duration = duration
        state.song = song
        state.songName = songName
        state.songCover = songCover
        source.playbackRate = state.speed
        player.playbackRate = state.speed
        speedBar.current!.value = String(state.speed)
        speedCheckbox.current!.checked = state.speedBox
        source.detune = state.pitch
        pitchBar.current!.value = String(state.pitch)
        source.reverse = state.reverse
        player.reverse = state.reverse
        Tone.Transport.loop = state.loop
        abSlider.current.sliderRef.childNodes[1].style = "left: 0%; right: auto; width: 100%;"
        abSlider.current.sliderRef.childNodes[3].ariaValueNow = "0"
        abSlider.current.sliderRef.childNodes[3].style = "left: 0%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.childNodes[4].ariaValueNow = "100"
        abSlider.current.sliderRef.childNodes[4].style = "left: 100%; right: auto; transform: translateX(-50%);"
        abSlider.current.sliderRef.style.display = "none"
        player.disconnect()
        source.disconnect().toDestination()
        updateMetadata()
    }

    const loop = async () => {
        await Tone.loaded()
        if (state.loop === true) {
            state.loop = false
            Tone.Transport.loop = false
            if (state.abloop) toggleAB()
        } else {
            state.loop = true
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.abloop ? state.loopStart : 0
            Tone.Transport.loopEnd = state.abloop ? state.loopEnd : state.duration
        }
        updateMetadata()
    }

    const reverse = async (applyState?: any) => {
        let currentSource = source
        let currentPlayer = player
        let skip = false
        if (applyState) {
            currentSource = applyState.source
            currentPlayer = applyState.player
            skip = true
        }
        let percent = Tone.Transport.seconds / state.duration
        if (state.reverse === true && !skip) {
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
        if (!applyState) updateMetadata()
    }

    useEffect(() => {
        /*Update Progress*/
        window.setInterval(() => {
            let percent = (Tone.Transport.seconds / state.duration)
            if (!Number.isFinite(percent)) return
            if (state.reverse === true) {
                progressBar.current!.value = (1-percent) * 100
                secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
            } else {
                progressBar.current!.value = percent * 100
                secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
            }
            if (!state.loop) {
                if (Tone.Transport.seconds > state.duration - 1) {
                    Tone.Transport.pause()
                    Tone.Transport.seconds = Math.round(state.duration) - 1
                }
                if (Tone.Transport.seconds === Math.round(state.duration) - 1) Tone.Transport.seconds = Math.round(state.duration)
            }
        }, 1000)
        /** Store state
        window.onbeforeunload = () => {
            localStorage.setItem("state", JSON.stringify(state))
        } */

        /*Change play button image*/
        Tone.Transport.on("pause", () => {
            if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
        })
        Tone.Transport.on("stop", () => {
            if (playButton.current?.src !== playIcon) playButton.current!.src = playIcon
        })
        Tone.Transport.on("start", () => {
            if (playButton.current?.src !== pauseIcon) playButton.current!.src = pauseIcon
        })

        /* Close speed and pitch boxes */
        window.onclick = (event: any) => {
            if (speedPopup.current?.style.display === "flex") {
                if (!(speedPopup.current?.contains(event.target) || speedImg.current?.contains(event.target))) {
                    if (event.target !== speedPopup.current) speedPopup.current!.style.display = "none"
                }
            }
            if (pitchPopup.current?.style.display === "flex") {
                if (!(pitchPopup.current?.contains(event.target) || pitchImg.current?.contains(event.target))) {
                    if (event.target !== pitchPopup.current) pitchPopup.current!.style.display = "none"
                }
            }
        }

        /* Precision on ctrl click */
        window.onkeydown = (event: KeyboardEvent) => {
            if (event.ctrlKey) {
                speedBar.current!.step = "0.01"
                pitchBar.current!.step = "1"
            }
        }
        window.onkeyup = (event: KeyboardEvent) => {
            if (!event.ctrlKey) {
                if (Number(speedBar.current!.value) % 0.5 !== 0) speedBar.current!.value = String(functions.round(Number(speedBar.current!.value), 0.5))
                if (Number(pitchBar.current!.value) % 12 !== 0) pitchBar.current!.value = String(functions.round(Number(pitchBar.current!.value), 12))
                speedBar.current!.step = "0.5"
                pitchBar.current!.step = "12"
            }
        }

        return window.clearInterval()
    }, [])

    const seek = (event: React.MouseEvent<HTMLProgressElement>) => {
        let percent = event.nativeEvent.offsetX / progressBar.current!.offsetWidth
        progressBar.current!.value = percent * 100
        if (state.reverse === true) {
            Tone.Transport.seconds = (1-percent) * state.duration
            secondsProgress.current!.innerText = functions.formatSeconds(state.duration - Tone.Transport.seconds)
        } else {
            Tone.Transport.seconds = percent * state.duration
            secondsProgress.current!.innerText = functions.formatSeconds(Tone.Transport.seconds)
        }
        if (Tone.Transport.state === "paused") play()
    }

    const pitch = async (event?: React.ChangeEvent<HTMLInputElement>) => {
        if (event) state.pitch = Number(event.target.value) 
        source.detune = state.pitch * 100
    }

    const updateMetadata = () => {
        if (checkBuffer() && metadataText.current!.style.display === "none") metadataText.current!.style.display = "flex"
        songTitle.current!.innerText = state.songName
        songCover.current!.src = state.songCover
        reverseMeta.current!.style.display = state.reverse ? "flex" : "none"
        loopMeta.current!.style.display = state.loop ? "flex" : "none"
        abLoopMeta.current!.style.display = state.abloop ? "flex" : "none"
    }

    const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        //window.URL.revokeObjectURL(state.song)
        const file = event.target.files?.[0]
        if (!file) return
        const tagInfo = await new Promise((resolve, reject) => {
            new jsmediatags.Reader(file).read({onSuccess: (tagInfo: any) => resolve(tagInfo), onError: (error: any) => reject(error)})   
        }).catch(() => null) as any
        const picture = tagInfo?.tags.picture
        if (picture) {
            let b64 = ""
            for (let i = 0; i < picture.data.length; i++) {
                b64 += String.fromCharCode(picture.data[i])
            }
            state.songCover = `data:${picture.format};base64,${btoa(b64)}`
        } else {
            state.songCover = ""
        }
        state.songName = file.name.replace(".mp3", "").replace(".wav", "")
        state.song = window.URL.createObjectURL(file)
        await source.buffer.load(state.song)
        await player.load(state.song)
        await Tone.loaded()
        duration()
        if (Tone.Transport.state === "stopped") {
            play()
        }
        updateMetadata()
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

    const toggleAB = () => {
        if (abSlider.current.sliderRef.style.display === "none") {
            abSlider.current.sliderRef.style.display = "flex"
            state.abloop = true
            state.loop = true
            if (!state.loopEnd) state.loopEnd = state.duration
            Tone.Transport.loop = true
            Tone.Transport.loopStart = state.loopStart
            Tone.Transport.loopEnd = state.loopEnd
        } else {
            abSlider.current.sliderRef.style.display = "none"
            Tone.Transport.loop = false
            state.abloop = false
            state.loop = false
        }
        updateMetadata()
    }

    const reverb = async (event: React.ChangeEvent<HTMLInputElement>, action: string) => {
        switch (action) {
            case "mix":
                state.reverbMix = Number(event.target.value)
                break
            case "delay":
                state.reverbDecay = Number(event.target.value)
                break
            case "predelay":
                state.reverbPreDelay = Number(event.target.value)
                break
        }
        if (state.reverb && state.reverbMix === 0) {
            state.reverb = false
            removeEffect("reverb")
            return
        }
        state.reverb = true
        const reverb = new Tone.Reverb({wet: state.reverbMix, decay: state.reverbDecay, preDelay: state.reverbPreDelay})
        pushEffect("reverb", reverb)
        applyEffects()
    }

    const applyState = async (state: any, source: Tone.GrainPlayer, player: Tone.Player, reload?: boolean) => {
        const apply = {state, source, player}
        if (reload && state.song) {
            await source.buffer.load(state.song)
            await player.load(state.song)
            await Tone.loaded()
        }
        console.log("loaded!")
        let editCode = ""
        if (state.speed !== 1) {
            speed(undefined, apply)
            editCode += "-speed"
        }
        if (state.reverse !== false) {
            reverse(apply)
            editCode += "-reverse"
        } 
        if (state.pitch !== 0) {
            pitch()
            editCode += "-pitch"
        }
        if (state.abloop !== false) {
            editCode += "-loop"
        }
        state.editCode = editCode
        return state.grainPlayer ? source : player
    }

     /** Renders the same as online */
     const render = async (start: number, duration: number) => {
        return Tone.Offline(async ({transport}) => {
            let source = new Tone.GrainPlayer().sync()
            let player = new Tone.Player().sync()
            source.grainSize = 0.1
            const current = await applyState(state, source, player, true)
            current.start().toDestination()
            transport.start(start)
        }, duration)
    }

    const download = async () => {
        if (!checkBuffer()) return
        await Tone.loaded()
        window.URL.revokeObjectURL(state.download)
        let duration = state.duration
        let start = 0
        if (state.abloop) {
            start = state.loopStart
            duration = state.loopEnd - state.loopStart
        }
        const buffer = await render(start, duration)
        const wav = encodeWAV(buffer)
        console.error(wav)
        const blob = new Blob([new DataView(wav)], {type: "audio/wav"})
        state.download = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        document.body.appendChild(a)
        a.style.display = "none"
        a.href = state.download
        a.download = `${functions.decodeEntities(state.songName)}${state.editCode}.wav`
        a.click()
        document.body.removeChild(a)
    }

    /* Apply saved state
    useEffect(() => {
        const savedState = localStorage.getItem("state")
        if (!savedState) return
        const oldSong = state.song
        state = {...JSON.parse(savedState)}
        applyState(state, source, player, oldSong !== state.song)
        loop()
        volume()
        speedCheckbox.current!.checked = state.speedBox
        volumeBar.current!.value = String(state.volume)
        pitchBar.current!.value = String(state.pitch)
        speedBar.current!.value = String(state.speed)
    }, [])*/

    const submit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault()
        const value = searchBox.current?.value
        if (!value) return
        const response = await fetch("/song", {method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: value})}).then((r) => r.text())
        if (response) {
            const imageResponse = await fetch("/picture", {method: "post", headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: value})}).then((r) => r.text())
            window.URL.revokeObjectURL(state.song)
            window.URL.revokeObjectURL(state.songCover)
            const arrayBuffer = await fetch(response).then((r) => r.arrayBuffer())
            const imageBuffer = await fetch(imageResponse).then((r) => r.arrayBuffer())
            const blob = new Blob([new DataView(arrayBuffer)], {type: "audio/mpeg"})
            const imageBlob = new Blob([new DataView(imageBuffer)], {type: "image/png"})
            state.songName = response.replace("assets\\music\\", "").replace("assets/music/", "").replace(".mp3", "")
            state.song = window.URL.createObjectURL(blob)
            state.songCover = window.URL.createObjectURL(imageBlob)
            await source.buffer.load(state.song)
            await player.load(state.song)
            await Tone.loaded()
            duration()
            updateMetadata()
            if (Tone.Transport.state === "stopped") {
                play()
            } 
            await fetch("/delete", {method: "delete", headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: response})})
            await fetch("/delete", {method: "delete", headers: {"Content-Type": "application/json"}, body: JSON.stringify({url: imageResponse})})
        }
        searchBox.current!.value = ""
    }

    /* JS Media Queries */
    useEffect(() => {
        const phoneMediaQuery = (query: MediaQueryListEvent | MediaQueryList) => {
            if (query.matches) {
                searchBox.current!.placeholder = "YT or SC link..."
            } else {
                searchBox.current!.placeholder = "Youtube or Soundcloud link..."
            }
        }
        const media = window.matchMedia("(max-width: 30rem)")
        media.addListener(phoneMediaQuery)
        phoneMediaQuery(media)
    }, [])

    return (
        <main className="audio-player">
            {/* Top Buttons */}
            <section className="player-top-buttons">
                <input type="file" ref={uploadFile} onChange={(event) => upload(event)} style={({display: "none"})} multiple/>
                <button onClick={() => uploadFile.current?.click()} className="upload-button"><span>Upload</span></button>
                <button onClick={() => download()} className="download-button"><span>Download</span></button>
                <form className="search-bar">
                    <input type="text" ref={searchBox} placeholder="Youtube or Soundcloud link..." className="search-box" spellCheck="false"/>
                    <button onClick={(event) => submit(event)} className="search-button"><img src={searchIcon} width="40" height="40" className="search-icon"/></button>
                </form>
            </section>

            {/* Metadata */}
            <section className="metadata">
                <div className="metadata-container">
                    <div className="metadata-text" ref={metadataText} style={({display: "none"})}>
                        <div className="meta-row">
                            <img src={musicNote}/><h2 ref={songTitle} className="meta-text"></h2>
                        </div>
                        <div ref={reverseMeta} className="meta-row" style={({display: "none"})}>
                            <img src={reverseIcon} width="60" height="60"/><h3 className="meta-text-small">Reverse Mode</h3>
                        </div>
                        <div ref={loopMeta} className="meta-row" style={({display: "none"})}>
                            <img src={loopIcon} width="60" height="60"/><h3 className="meta-text-small">Loop Mode</h3>
                        </div>
                        <div ref={abLoopMeta} className="meta-row" style={({display: "none"})}>
                            <img src={abLoopIcon} width="60" height="60"/><h3 className="meta-text-small">AB Loop Mode</h3>
                        </div>
                    </div>
                    <img ref={songCover} className="song-cover"/>
                </div>
            </section>

            {/* Player */}
            <section className="player">
                <div className="player-container">
                    <progress ref={progressBar} max="100" onClick={(event) => seek(event)} defaultValue="0" value="0">
                        <img src={waveform}/>
                    </progress>
                    <Slider.Range ref={abSlider} min={0} max={100} defaultValue={[0, 100]} onAfterChange={(value) => abloop(value)} style={({display: "none"})}/>
                    <div className="player-buttons">
                        <img src={playIcon} ref={playButton} onClick={() => play()} width="60" height="60"/>
                        <img src={stopIcon} onClick={() => stop()} width="60" height="60"/>
                        <img src={reverseIcon} onClick={() => reverse()} width="60" height="60"/>
                        <div className="speed-popup-container" ref={speedPopup} style={({display: "none"})}>
                            <div className="speed-popup">
                                <input type="range" ref={speedBar} onChange={(event) => speed(event)} min="0.5" max="4" step="0.5" defaultValue="1" className="speed-bar"/>
                                <div className="speed-checkbox-container">
                                <p className="speed-text">Pitch?</p><input type="checkbox" ref={speedCheckbox} defaultChecked onChange={() => speedBox()} className="speed-checkbox"/>
                                </div>       
                            </div>
                        </div>
                        <img src={speedIcon} ref={speedImg} onClick={() => speedPopup.current!.style.display === "flex" ? speedPopup.current!.style.display = "none" : speedPopup.current!.style.display = "flex"} width="60" height="60"/>
                        <div className="pitch-popup" ref={pitchPopup} style={({display: "none"})}>
                            <input type="range" ref={pitchBar} onChange={(event) => pitch(event)} min="-24" max="24" step="12" defaultValue="0" className="pitch-bar"/>
                        </div>
                        <img src={pitchIcon} ref={pitchImg} onClick={() => pitchPopup.current!.style.display === "flex" ? pitchPopup.current!.style.display = "none" : pitchPopup.current!.style.display = "flex"} width="60" height="60"/>
                        <img src={loopIcon} onClick={() => loop()} width="60" height="60"/>
                        <img src={abLoopIcon} onClick={() => toggleAB()} width="60" height="60"/>
                        {/*<img src={eqIcon} onClick={() => ""} width="60" height="60"/>
                        <img src={fxIcon} onClick={() => ""} width="60" height="60"/>*/}
                        <img src={resetIcon} onClick={() => reset()} width="60" height="60"/>
                        <div onMouseLeave={() => volumePopup.current!.style.display = "none"}>
                            <div className="volume-popup" ref={volumePopup} style={({display: "none"})}>
                                <input type="range" ref={volumeBar} onChange={(event) => volume(event)} min="0" max="1" step="0.05" defaultValue="1" className="volume-range"/>
                            </div>
                            <img src={volumeIcon} ref={volumeRef} onClick={() => mute()} onMouseEnter={() => volumePopup.current!.style.display = "flex"} width="60" height="60"/>
                        </div>
                        <p className="player-text"><span ref={secondsProgress}>0:00</span> <span>/</span> <span ref={secondsTotal}>0:00</span></p>
                    </div>
                </div>
            </section>
            {/*
            <aside>
                <p>Reverb</p>
                <label htmlFor="reverb-mix">Mix</label>
                <input type="range" id="reverb-mix" onBlur={(event) => reverb(event, "mix")} min="0" max="1" step="0.01" defaultValue="0"/><br/>
                <label htmlFor="reverb-decay">Decay</label>
                <input type="range" id="reverb-decay" onBlur={(event) => reverb(event, "decay")} min="1" max="10" step="0.1" defaultValue="1.5"/><br/>
                <label htmlFor="reverb-predelay">Predelay</label>
                <input type="range" id="reverb-predelay" onBlur={(event) => reverb(event, "predelay")} min="0.01" max="1" step="0.1" defaultValue="0.01"/><br/>
            </aside>*/}
        </main>
    )
}

export default AudioPlayer