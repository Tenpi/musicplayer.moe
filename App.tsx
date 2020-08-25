import React from "react"
import {BrowserRouter as Router, Switch, Route} from "react-router-dom"
import HomePage from "./components/HomePage"
import $404 from "./components/404"

const App: React.FunctionComponent = () => {
    return (
        <Router>
          <Switch>
            <Route exact path="/"><HomePage/></Route>
            <Route path="*"><$404/></Route>
          </Switch>
        </Router>
    )
}

export default App