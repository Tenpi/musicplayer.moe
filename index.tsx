import * as React from "react"
import * as ReactDOM from "react-dom"
import App from "./App"
import * as serviceWorker from "./public/service-worker"

ReactDOM.render(<App/>, document.getElementById("app"))

if (process.env.TESTING === "yes") {
    serviceWorker.unregister()
} else {
    serviceWorker.register("/service-worker.js")
}
