const {app, BrowserWindow} = require("electron");
const path = require('path');
const url = require('url');
const fs = require("fs")

let mainWindow;
let Store = require("electron-store");
let settings = new Store({name: "museSettings"});

settings.set('activeLibrary', settings.get('activeLibrary', null));
settings.set('showHiddenFiles', settings.get('showHiddenFiles', false));

function createWindow() {
  mainWindow = new BrowserWindow({width: 800, height: 600, titleBarStyle: 'hiddenInset', show: false})
  if(!settings.get("activeLibrary")) {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'views/firstUse.html'),
      protocol: 'file:',
      slashes: true
    }))
  } else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'views/home.html'),
      protocol: 'file:',
      slashes: true
    }))
  }

  mainWindow.on('ready-to-show', function() {
      mainWindow.show();
      mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  })

  // let jQuery = require(path.resolve(__dirname, "./bootstrap/js/jquery-3.2.1.min.js"));
  // require(path.resolve(__dirname, "./bootstrap/js/bootstrap.js"));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
})
