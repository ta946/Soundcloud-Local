#!/bin/bash
url="http://localhost:8080/dashboard.html"
open -a "Chrome" "$url"
cd node_files
node update.js
sleep .1
node server.js
