import React from "react"
import ReactDOM from "react-dom"
import App from "./App"
import * as serviceWorker from "./service-worker"

ReactDOM.render(<App/>, document.getElementById("app"))

if (process.env.TESTING === "yes") {
    serviceWorker.unregister()
} else {
    serviceWorker.register()
}
