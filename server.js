import path from "path"
import cors from "cors"
import mime from "mime"
import bodyParser from "body-parser"
import express from "express"
import webpack from "webpack"
import middleware from "webpack-dev-middleware"
import hot from "webpack-hot-middleware"
import config from "./webpack.config.cjs"
import favicon from "express-favicon"
import dotenv from "dotenv"
import fs from "fs"
import Youtube from "youtube.ts"
import Soundcloud from "soundcloud.ts"
const __dirname = path.resolve()

dotenv.config()
const app = express()
const compiler = webpack(config({platform: "web"}))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())
app.use(favicon(__dirname + "/assets/icons/favicon.gif"))
app.disable("x-powered-by")
app.set("trust proxy", true)

if (process.env.TESTING === "yes") {
  app.use(middleware(compiler, {
    noInfo: true,
    serverSideRender: true,
    writeToDisk: false
  }))
  app.use(hot(compiler))
}

app.use(express.static(path.join(__dirname, "./public")))
app.use(express.static(path.join(__dirname, "./dist")))
app.use("/assets", express.static(path.join(__dirname, "./assets")))

const youtube = new Youtube.default(process.env.YOUTUBE_API_KEY)
const soundcloud = new Soundcloud.default(process.env.SOUNDCLOUD_CLIENT_ID)

app.delete("/song", async (req, res) => {
  const file = path.join(__dirname, req.body.url)
  if (fs.existsSync(file)) fs.unlinkSync(file)
  res.send("done")
})

app.post("/song", async (req, res) => {
  const url = req.body.url.trim()
  let path = ""
  if (url.includes("soundcloud.com")) {
    path = await soundcloud.util.downloadTrack(url, "assets/music")
  } else if (url.includes("youtube.com") || url.includes("youtu.be")) {
    path = await youtube.util.downloadMP3(url, "assets/music")
  }
  res.send(path)
})

app.get("*", function(req, res) {
  res.setHeader("Content-Type", mime.getType(req.path))
  res.sendFile(path.join(__dirname, "./dist/index.html"))
})

app.listen(process.env.PORT || 8080, () => console.log("Started the website server!"))
