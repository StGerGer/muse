const dexie = require("dexie");
const path = require("path");

let db;

function createDatabase() {
  db = new Dexie("FileData");

  db.version(4).stores({
    files: "++id, path, libraryPath, name, groupId, subgroupId, desc, createdDate",
    groups: "++id, groupName, color"
  }).upgrade((trans) => {
    trans.files.toCollection().modify((file) => {
      file.createdDate = new Date();
    })
  });

  db.version(3).stores({
    files: "++id, path, libraryPath, name, groupId, subgroupId, desc",
    groups: "++id, groupName, color"
  }).upgrade((trans) => {
    trans.files.toCollection().modify((file) => {
      file.desc = "";
    })
  });

  db.version(2).stores({
     files: "++id, path, libraryPath, name, groupId, subgroupId",
     groups: "++id, groupName, color",
     subgroups: "++id, subgroupName, color"
   }).upgrade((trans) => {
     trans.files.toCollection().modify((file) => {
        let fileArr = file.path.split(path.sep);
        fileArr.pop();
        file.libraryPath = fileArr.join(path.sep);
    })
  });

  db.version(1).stores({
     files: "++id, path, name, groupId, subgroupId",
     groups: "++id, groupName, color",
     subgroups: "++id, subgroupName, color"
   });

   db.on("populate", () => {
     db.groups.add({name: "None", color: "#CCC"});
   })

   db.open();
}

function addFile(path, libraryPath, name, groupId, subgroupId) {
  console.log("file added");
  db.files.add({
    path: path,
    libraryPath: libraryPath,
    name: name,
    groupId: groupId,
    subgroupId: subgroupId,
    createdDate: new Date(),
    desc: ""
  }).catch((e) => console.error(e));
}

function addGroup(name, color) {
  db.groups.add({
    name: name,
    color: color
  }).catch((e) => console.error(e));
}

function setGroup(group, file, callback) {
  db.files.update(file, {groupId: group}).then(function(updated) {
    try {
      callback();
    } catch(e) {}

  }).catch((e) => console.error(e));
}

function removeGroup(id) {
  db.groups.delete(id);
}

function updateGroupName(id, name) {
  db.groups.update(id, {name: name}).then(function(updated) {
  }).catch((e) => console.error(e));
}

function isInDatabase(path) {
  return db.files.where("path").equals(path).count().then((res) => {
    return res != 0;
  }).catch((e) => console.error(e));
}

function getLibraryData(lib) {
  return db.files.where("libraryPath").equals(lib).toArray().then((res) => {
    return res;
  }).catch((e) => console.error(e));
}

function getFileData(file) {
  return db.files.where("name").equals(file).toArray().then((res) => {
    return res;
  }).catch((e) => console.error(e));
}

function updateFileName(id, name) {
  db.files.update(id, {name: name}).then(function(updated) {
  }).catch((e) => console.error(e));
}

function updateFileDate(id, date) {
  let createdDate = new Date(date);
  db.files.update(id, {createdDate: createdDate}).then(function(updated) {
  }).catch((e) => console.error(e));
}

function updateFileDesc(id, desc) {
  db.files.update(id, {desc: desc}).then(function(updated) {
  }).catch((e) => console.error(e));
}

function getGroupData() {
  return db.groups.toArray().then((res) => {
    return res;
  }).catch((e) => console.error(e));
}

function delDB() {
  db.delete()
}

createDatabase();

db.files.toArray(function(res) { console.log(res)});
