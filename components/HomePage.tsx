import React from "react"
import AudioPlayer from "./AudioPlayer"
import Header from "./Header"
import Footer from "./Footer"

const HomePage: React.FunctionComponent = (props) => {
    return (
        <>
        <Header/>
        <AudioPlayer/>
        <Footer/>
        </>
    )
}

export default HomePage