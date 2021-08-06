import React, {useRef, useEffect} from "react"
import hibikiChibi from "../assets/images/hibiki-chibi.png"
import light from "../assets/icons/light.png"
import dark from "../assets/icons/dark.png"
import github from "../assets/icons/github.png"
import "../styles/footer.less"

const Footer: React.FunctionComponent = (props) => {
    const themeIcon = useRef(null) as React.RefObject<HTMLImageElement>
    
    const changeTheme = () => {
        const app = document.getElementById("app")
        if (app?.classList.contains("dark-theme")) {
            app.classList.remove("dark-theme")
            themeIcon.current!.src = dark
            localStorage.setItem("theme", "light")
        } else {
            app?.classList.add("dark-theme")
            themeIcon.current!.src = light
            localStorage.setItem("theme", "dark")
        }
    }

    useEffect(() => {
        const theme = localStorage.getItem("theme")
        if (theme === "light") changeTheme()
    }, [])

    return (
       <footer className="footer">
           <section className="footer-container">
                <div className="footer-column">
                    <h3 className="footer-text">Site Theme</h3>
                    <img ref={themeIcon} src={light} onClick={() => changeTheme()} className="footer-img" width="50" height="50"/>
                </div>
                <div className="footer-column">
                        <h3 className="footer-text">Source Code</h3>
                        <img src={github} onClick={() => window.open("https://github.com/Tenpi/Music-Player-Web", "_blank")} className="footer-img" width="30" height="30"/>
                </div>
                <div className="footer-column">
                    <img src={hibikiChibi} className="hibiki-chibi" width="141" height="200"/>
                </div>
           </section>
           <p className="copyright-text">Copyright © {new Date().getFullYear()} Tenpi</p>
       </footer>
    )
}

export default Footer