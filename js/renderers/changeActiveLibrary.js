const remote = require('electron').remote;
const fs = require("fs");
const url = require("url");
const path = require("path");

let Store = require("electron-store");
let settings = new Store({name: "museSettings"});

const dropper = document.getElementById("dropper");

dropper.ondragover = () => {
    return false;
  };
  dropper.ondragleave = dropper.ondragend = () => {
    return false;
  };
  dropper.ondrop = (e) => {
    e.preventDefault();
    settings.set("activeLibrary", e.dataTransfer.files[0].path);
    remote.getCurrentWindow().loadURL(url.format({
      pathname: path.join(__dirname, 'home.html'),
      protocol: 'file:',
      slashes: true
    }));
    return false;
  };
