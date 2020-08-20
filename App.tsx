import React, {Component} from "react"
import {BrowserRouter as Router, Switch, Route} from "react-router-dom"
import AudioPlayer from "./components/AudioPlayer"
import "./index.less"

const App: React.FunctionComponent = () => {
    return (
      <div onTouchStart={() => ""}>
        <Router>
          <Switch>
            <Route path="*"><AudioPlayer/></Route>
          </Switch>
        </Router>
      </div>
    )
}

export default App