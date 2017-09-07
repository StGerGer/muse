const remote = require('electron').remote;
const shell = require('electron').shell;
const url = require('url');
const fs = require("fs");

let activeLib;
let directory;
let fileDataArray = [];
let groups = [];
let groupString = "";
let contextMenu = document.getElementById("contextMenu");
let Store = require("electron-store");
let settings = new Store({name: "museSettings"});
let contextMenuActive = false;
let groupSelectorActive = false;
let directoryNavDisabled = false;

let contextMenuPrefabs = {
  fileInfo: `
    <div class="p-2 full-width mb-5">
      <h4 class="vert-center-row"><span id="fileName" class="text-editable" onkeydown="saveFile({fileIndex})" contenteditable="true">{file.name}</span> <small class="pull-right clickable ml-auto" onclick="toggleContextMenu()"><i class="material-icons">close</i></small></h4>
      <hr>
      <div class="flex-menu">
        <a href="#" class="small" onclick="openFile('{fileName}')">Open</a> <br>
        <a href="#" class="small" onclick="shell.showItemInFolder('{file.path}')">Show In Folder</a>
      </div>
      <div style="width: 100%" class="text-center py-2" id="previewImgContainer{fileIndex}">
        <img src="{file.path}" id="previewImg" placeholder="">
      </div>
      Group: <span class="badge badge-default clickable" onclick="toggleGroupSelector('{file.group.name}', '{file.group.color}', '{fileIndex}')" style="background-color: {file.group.color}">{file.group.name}</span>
      <div id="groupContainer"></div>
      <small class="text-muted">Creation Date</small>
      <input id="fileDate" class="form-control form-control-sm" type="text" onkeydown="saveFile({fileIndex})" value="{file.createdDate}"></input>
      <small class="text-muted">Description</small>
      <textarea id="fileDescArea" rows="10" class="form-control" onkeydown="saveFile({fileIndex})">{file.desc}</textarea>
    </div>
  `,
  settings: `
    <div class="p-2 full-width mb-4">
      <h4 class="vert-center-row">Settings <small class="pull-right clickable ml-auto" onclick="toggleContextMenu()"><i class="material-icons">close</i></small></h4>
      <hr>
      <small class="form-check">
        <label class="form-check-label" onmousedown="toggleHiddenFiles()">
          <input type="checkbox" class="form-check-input" id="hiddenFilesCheck">
          Show hidden files
        </label>
      </small>
      <h5>Groups</h5>
      {groupString}
      <a href="#" class="btn btn-link btn-sm" onclick="createGroup()">Create Group</a>
    </div>
  `,
}

search.onkeyup = (e) => {
  updateDirectory(e.target.value);
}

function toActiveLib() {
  if(!directoryNavDisabled) {
    updateActiveLib();
    updateDirectory();
  }
}

function toggleHiddenFiles() {
  console.log("here");
  settings.set("showHiddenFiles", !settings.get("showHiddenFiles"));
  updateDirectory();
}

function updateActiveLib() {
  activeLib = settings.get("activeLibrary");
  directory = activeLib;
  let pathArr = activeLib.split(path.sep);
  document.getElementById("activeLib").innerText = pathArr[pathArr.length - 1];
}

function updateDirectory(filter) {
  let contentDisplay = document.getElementById("contentList");
  document.getElementById("refreshButton").classList.add("spin");

  if(directory != activeLib) {
    directoryNavDisabled = false;
    document.getElementById("toRoot").classList.add("emphasized", "clickable");
    document.getElementById("toRoot").classList.remove("disabled");
    document.getElementById("back").classList.add("clickable");
    document.getElementById("back").classList.remove("disabled");
  } else {
    directoryNavDisabled = true;
    document.getElementById("toRoot").classList.remove("emphasized", "clickable");
    document.getElementById("toRoot").classList.add("disabled");
    document.getElementById("back").classList.remove("clickable");
    document.getElementById("back").classList.add("disabled");
  }

  contentDisplay.innerHTML = `
    <thead>
      <th>
        File
      </th>
      <th>
        Group
      </th>
      <th>
        Date
      </th>
    </thead>
  `;

  updateGroupData(() => {
    getDirectoryFiles(() => {
      updateFileMetadata(() => {
        try {
          filter = filter.toUpperCase();
        } catch(e) {};
        let index = 0;
        let fileName;
        for(let file of fileDataArray) {
          try {
            fileName = file.path.split(path.sep);
            fileName = fileName[fileName.length - 1];
          } catch(e) {
            fileName = file.name;
          }
          if((!filter || file.name.toUpperCase().includes(filter) || file.desc.toUpperCase().includes(filter) || new Date(file.createdDate) == filter) && (fileName[0] != "." || settings.get("showHiddenFiles"))) {
            if(fs.lstatSync(path.join(directory, fileName)).isDirectory()) {
              contentDisplay.innerHTML += `
                <tr class="clickable no-select" ondblclick="gotoSubdir('${fileName}')">
                  <td class="clickable vert-center-row flex-left no-select">
                    <i class="material-icons pr-2">folder</i>
                    ${file.name}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
              `;
            } else {
              try {
                contentDisplay.innerHTML += `
                  <tr id="row${fileDataArray.indexOf(file)}" class="no-select clickable" onclick="previewFile('${fileDataArray.indexOf(file)}')" ondblclick="openFile('${fileName}')">
                    <td>
                      ${file.name}
                    </td>
                    <td>
                      <span class="badge badge-default" style="background-color: ${file.group.color}">${file.group.name}</span>
                    </td>
                    <td>${((file.createdDate.getMonth()+1)+"/"+file.createdDate.getDate()+"/"+file.createdDate.getFullYear())}</td>
                  </tr>
                `;
              } catch(e) {
                console.log(e);
                addFile(path.join(directory, fileName), directory, fileName, 1, 1);
                setTimeout(()=> {
                  updateFileMetadata(() => {
                    console.log(fileDataArray);
                    for(let fileSearch of fileDataArray) {
                      fileSearch.name = file.name ? file = fileSearch : null;
                    }
                    file.createdDate = new Date();
                    contentDisplay.innerHTML += `
                      <tr id="row${fileDataArray.indexOf(file)}" class="no-select clickable" onclick="previewFile('${fileDataArray.indexOf(file)}')" ondblclick="openFile('${fileName}')">
                        <td>
                          ${file.name}
                        </td>
                        <td>
                          <span class="badge badge-default" style="background-color: #CCC">None</span>
                        </td>
                        <td>${((file.createdDate.getMonth()+1)+"/"+file.createdDate.getDate()+"/"+file.createdDate.getFullYear())}</td>
                      </tr>
                    `;
                  })
                })
              }
            }
          }
          index++;
        }
      });
    });
  });
  setTimeout(() => {
    document.getElementById("refreshButton").classList.remove("spin");
  }, 1500);
}

function getDirectoryFiles(callback) {
  fileDataArray = [];
  fs.readdir(directory, (err, files) => {
    if(!err) {
      for(let index in files) {
        fileDataArray.push({name: files[index], createdDate: new Date()}); // Temporary placeholder
        isInDatabase(path.join(directory, files[index])).then((res) => {
          if(!res) {
            addFile(path.join(directory, files[index]), directory, files[index], 1, 1);
          }
          if(index == files.length - 1) {
            callback();
          }
        });
      }
    } else {
      console.error(err);
    }
  })
}

function updateFileMetadata(callback) {
  let fileName;
  getLibraryData(directory).then((res) => {
    for(let fileMeta of res) {
      for(let file in fileDataArray) {
        fileName = fileMeta.path.split(path.sep);
        fileName = fileName[fileName.length - 1];
        if(fileDataArray[file].name == fileName) {
          fileDataArray[file] = fileMeta;
          for(let group of groups) {
            if(fileDataArray[file].groupId == group.id) {
              fileDataArray[file].group = group;
            }
          }
        }
      }
    }
    setTimeout(() => {
      fileDataArray.sort(function(a, b) {
        if(a.createdDate - b.createdDate == 0) {
          if(a.group.name.localeCompare(b.group.name) == 0) {
            return a.name.localeCompare(b.name);
          } else {
            return a.group.name.localeCompare(b.group.name);
          }
        } else {
          return a.createdDate - b.createdDate;
        }
      })
      callback();
    });
  });
}

function updateGroupData(callback) {
  getGroupData().then((res) => {
    groups = res;
    callback();
  })
}

function changeActiveLibrary() {
  remote.getCurrentWindow().loadURL(url.format({
    pathname: path.join(__dirname, 'changeLibrary.html'),
    protocol: 'file:',
    slashes: true
  }));
}

function gotoSubdir(subdir) {
  directory = path.join(directory, subdir);
  updateDirectory();
}

function backDirectory() {
  if(!directoryNavDisabled) {
    directory = path.join(directory, "../");
    updateDirectory();
  }
}

function openFile(file) {
  shell.openItem(path.join(directory, file));
}

function setFileFocus(fileIndex) {
  let tableEntry = document.getElementById("row"+fileIndex);
  let table = document.getElementById("contentList");
  let rows = table.childNodes;
  for(let row of rows) {
    if(row.nodeName != '#text') {
      row.style.backgroundColor = "#FFF";
    }
  }
  tableEntry.style.backgroundColor = "#cde7ff";
}

function previewFile(fileIndex) {
  let file = fileDataArray[fileIndex];
  setFileFocus(fileIndex);
  fs.readFile(file.path || path.join(directory, file.name), 'utf8', (err, data) => {
    if(err) {
      console.error(err);
    }
    let fileName = file.path.split(path.sep);
    fileName = fileName[fileName.length - 1];
    contextMenu.innerHTML = contextMenuPrefabs.fileInfo
      .replace(/{fileName}/g, fileName)
      .replace(/{file.name}/g, file.name)
      .replace(/{file.path}/g, file.path)
      .replace(/{file.preview}/g, data)
      .replace(/{file.createdDate}/g, (file.createdDate.getMonth()+1)+"/"+file.createdDate.getDate()+"/"+file.createdDate.getFullYear())
      .replace(/{file.desc}/g, file.desc)
      .replace(/{file.group.name}/g, file.group.name || "None")
      .replace(/{file.group.color}/g, file.group.color || "#CCC")
      .replace(/{fileIndex}/g, fileDataArray.indexOf(file));
    toggleContextMenu();
    if(fileName.split(".")[1] != "jpg" && fileName.split(".")[1] != "png" && fileName.split(".")[1] != "jpeg") {
      document.getElementById("previewImgContainer"+fileDataArray.indexOf(file)).style.display = "none";
    }
    if(!contextMenuActive) {
      setTimeout(() => {toggleContextMenu()}, 200);
    }
  });
}

function openSettings() {
  contextMenu.innerHTML = contextMenuPrefabs.settings
    .replace("{groupString}", groupString);
  toggleContextMenu(true);
  if(settings.get("showHiddenFiles")) {
    document.getElementById("hiddenFilesCheck").checked = true;
  }
}

function showGroups() {
  groupString = "";
  getGroupData().then((groups) => {
    for(let group of groups) {
      if(group.name != "None") {
        groupString += `
          <div class="group-select">
            <div class="badge badge-default clickable" style="background-color:${group.color}" onclick="swapGroupElements(${group.id})">
              <span id="groupName${group.id}">${group.name}</span>
              <input id="groupInput${group.id}" type="text" placeholder="${group.name}" class="hide form-control form-control-sm" onclick="event.stopPropagation()" onkeyup="checkGroupInput(${group.id})" ></input>
            </div>
            <span class="material-icons float-right text-danger clickable very-small" onclick="removeGroup(${group.id}); showGroups();">
              remove_circle_outline
            </span>
          </div>
          `;
      }
    }
    if(!groupString) {
      groupString = "<div class='text-muted small'>No groups created</div>"
    }
    contextMenu.innerHTML = contextMenuPrefabs.settings
      .replace("{groupString}", groupString);
    return groupString;
  })
}

function createGroup() {
  let hue = Math.floor(Math.random()*360);
  addGroup("New Group", "hsl("+hue+", 60%, 80%)");
  showGroups();
}

function swapGroupElements(id) {
  let groupName = document.getElementById("groupName"+id);
  let groupInput = document.getElementById("groupInput"+id);
  groupName.classList.toggle("hide");
  if(!groupInput.classList.toggle("hide")) {
    groupInput.focus();
  };
}

function checkGroupInput(id) {
  if(event.keyCode == 13) {
    updateGroupName(id, document.getElementById("groupInput"+id).value);
    swapGroupElements(id);
    showGroups();
    updateDirectory();
  };
}

function toggleContextMenu(state) {
  if(!contextMenuActive || state) {
    contextMenu.style.webkitTransform = "translateX(0px)";
  } else {
    contextMenu.style.webkitTransform = "translateX(301px)";
  }
  contextMenuActive = !contextMenuActive;
}

function saveFile(fileIndex) {
  if(event.keyCode == 13) {
    let file = fileDataArray[fileIndex];
    let name = document.getElementById("fileName").textContent;
    let date = document.getElementById("fileDate").value;
    let desc = document.getElementById("fileDescArea").value;
    updateFileName(file.id, name);
    updateFileDate(file.id, date);
    updateFileDesc(file.id, desc);
    updateDirectory();
    toggleContextMenu();
  }
}

function toggleGroupSelector(name, color, fileIndex) {
  groupSelectorActive = !groupSelectorActive;
  let file = fileDataArray[fileIndex];
  let groupContainer = document.getElementById("groupContainer");
  if(groupSelectorActive) {
    getGroupData().then((groups) => {
      let addedGroups = 0;
      for(let group of groups) {
        if(group.name != name && group.name != "None") {
          if(addedGroups != 0) {
            groupContainer.innerHTML += '<br>';
          }
          groupContainer.innerHTML += `<div class="badge badge-default clickable" style="background-color:${group.color}" onclick="setGroup(${group.id}, ${file.id}, changeGroupSuccess())"><span id="groupName${group.id}">${group.name}</span></div>`;
          addedGroups++;
        }
      }
    });
  } else {
    groupContainer.innerHTML = "";
  }
}

function changeGroupSuccess() {
  toggleContextMenu();
  toggleGroupSelector();
  updateDirectory();
}

showGroups();
updateActiveLib();
updateDirectory();
