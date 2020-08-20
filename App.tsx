import React, {Component} from "react"
import {BrowserRouter as Router, Switch, Route} from "react-router-dom"
import Main from "./components/Main"
import "./index.less"

const App: React.FunctionComponent = () => {
    return (
      <div onTouchStart={() => ""}>
        <Router>
          <Switch>
            <Route path="*"><Main/></Route>
          </Switch>
        </Router>
      </div>
    )
}

export default App