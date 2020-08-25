import React from "react"
import logo from "../assets/icons/logo.gif"
import "../styles/header.less"

const Header: React.FunctionComponent = (props) => {
    return (
        <header className="header">
            <section className="header-container" onClick={() => window.location.href = "/"}>
                <img src={logo} className="header-img"/>
                <h1 className="header-text">Music Player</h1>
            </section>
        </header>
    )
}

export default Header