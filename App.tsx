import React, {useEffect} from "react"
import {Switch, Route} from "react-router-dom"
import HomePage from "./components/HomePage"
import $404 from "./components/404"
import functions from "./structures/Functions"

const App: React.FunctionComponent = () => {
  useEffect(() => {
    functions.preventDragging()
  }, [])

  return (
      <Switch>
        <Route exact path="/"><HomePage/></Route>
        <Route path="*"><$404/></Route>
      </Switch>
  )
}

export default App