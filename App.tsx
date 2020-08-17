import React, {Component} from "react"
import {BrowserRouter as Router, Switch, Route, Redirect} from "react-router-dom"
import Main from "./components/Main"
import ScrollToTop from "./components/ScrollToTop"
import "./index.less"

const App: React.FunctionComponent = () => {
    return (
      <div onTouchStart={() => ""}>
        <Router>
          <ScrollToTop>
            <Switch>
              <Route path="*"><Main/></Route>
            </Switch>
          </ScrollToTop>
        </Router>
      </div>
    )
}

export default App