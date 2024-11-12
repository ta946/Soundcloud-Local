const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const {
  oauth_token,
  client_id,
  user_id,
  datadome_clientid,
} = require("../sc_config.js");

const sc_host = "https://api-v2.soundcloud.com";
const port = 8080;

const quick_playlists_path = path.join(
  __dirname,
  "../static/quick_playlists.js",
);
if (!fs.existsSync(quick_playlists_path)) {
  fs.writeFileSync(quick_playlists_path, `var quick_playlists = [];\n`);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const headers = {
  Authorization: `OAuth ${oauth_token}`,
  // "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36`,
  "x-datadome-clientid": datadome_clientid,
};

// static files
app.use("/js", express.static(path.join(__dirname, "../static/js")));
app.use("/css", express.static(path.join(__dirname, "../static/css")));
app.get("/dashboard.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../static/dashboard.html"));
});
app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "../static/favicon.ico"));
});
app.get("/sc_config.js", (req, res) => {
  res.sendFile(path.join(__dirname, "../sc_config.js"));
});
app.get("/config.js", (req, res) => {
  res.sendFile(path.join(__dirname, "../config.js"));
});
app.get("/quick_playlists.js", (req, res) => {
  res.sendFile(quick_playlists_path);
});

app.post("/save_state", function (req, res) {
  console.log(`POST /save_state`);
  const body = req.body;
  if (body.length === 0) {
    error = "state empty!";
    console.log(error);
    res.send(400, error);
    return;
  }
  try {
    fs.writeFileSync(
      path.join(__dirname, "../state.json"),
      JSON.stringify(body),
    );
  } catch (error) {
    console.log(error);
    res.send(500, error);
    return;
  }
  res.sendStatus(200);
});

app.get("/load_state", function (req, res) {
  console.log(`GET /load_state`);
  let data;
  try {
    data = fs.readFileSync("../state.json", "utf8");
  } catch (error) {
    console.log(error);
    res.send(500, error);
    return;
  }
  if (data.length === 0) {
    error = "state empty!";
    console.log(error);
    res.send(400, error);
    return;
  }
  res.json(data);
});

app.post("/save_quick_playlists", function (req, res) {
  console.log(`POST /save_quick_playlists`);
  const body = req.body;
  if (body.length === 0) {
    error = "quick_playlists empty!";
    console.log(error);
    res.send(400, error);
    return;
  }
  const data = JSON.stringify(body, null, 2);
  const text = `var quick_playlists = ${data};\n`;
  try {
    fs.writeFileSync(quick_playlists_path, text);
  } catch (error) {
    console.log(error);
    res.send(500, error);
    return;
  }
  res.sendStatus(200);
});

// catchall
app.all("/*", async function (req, res, next) {
  console.log(`${req.method} ${req.url}`);
  let body;
  if (req.method !== "GET") {
    body = JSON.stringify(req.body);
  }
  // console.log(body);

  let url = `${sc_host}${req.url}`;
  const response = await fetch(url, {
    method: req.method,
    cache: "no-store",
    headers,
    body,
  });
  const data = await response.json();
  res.send(data);
});

app.listen(port, () => {
  console.log(`Soundcloud-Local running at http://localhost:${port}/`);
});
