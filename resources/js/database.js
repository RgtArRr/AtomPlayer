var sql = require('sql.js');
const {app} = require('electron').remote;
/*
var fileDB = "resources/DB.sqlite";
var db;
try {
console.log("Loaded DB");
var filebuffer = fs.readFileSync(fileDB);
db = new database(filebuffer);
}catch (e) {
console.log("Failed DB");
/*
db = new database(new sql.Database());
db.writeDB("CREATE TABLE libreta (id_libreta integer NOT NULL PRIMARY KEY AUTOINCREMENT, titulo	text, contenido	text NOT NULL, created_at	text, update_at	text, delete_at	text);");
}*/

function Database() {
  var self = this;
  var fileDB = app.getAppPath()+"/resources/db/DB.sqlite";
  this.db;

  this.init = function(){
    try {
      var filebuffer = fs.readFileSync(fileDB);
      self.db = new SQL.Database(filebuffer);
      console.log("Loaded DB");
    } catch (e) {
      console.log("Failed DB: " + e);
    }
  };

  this.addSong = function(name, path, Idplaylist){
    this.writeDB("INSERT INTO cancion (nombre, ruta, duracion, id_playlist) VALUES ('" + name + "', '" + path + "', 0, " + Idplaylist + ")");
  };

  this.getSongs = function(id_playlist){
    return this.readDB("SELECT * FROM cancion where id_playlist='"+id_playlist+"'");
  };

  this.getNextSong = function(id_song){
    return this.readDB("select * from cancion where id_cancion > " + id_song + " and id_playlist = (select id_playlist from cancion where id_cancion="+id_song+") limit 1");
  };

  this.getPreviousSong = function(id_song){
    return this.readDB("select * from cancion where id_cancion < " + id_song + " and id_playlist = (select id_playlist from cancion where id_cancion="+id_song+") order by  id_cancion desc limit 1");
  };

  this.getRandomSong = function(id_song){
    var rows = this.readDB("select * from cancion where id_playlist = (select id_playlist from cancion where id_cancion="+id_song+")");
    return rows[0].values[Math.floor(Math.random() * rows[0].values.length)];
  };

  this.updateNameSong = function(id_song, newName){
    this.writeDB("UPDATE cancion SET nombre = ? WHERE id_cancion = ?", [newName, id_song]);
  };

  this.updateDuratioSong = function(id_song, duration){
    var row = this.readDB("SELECT * FROM cancion WHERE id_cancion = '" + id_song + "'");
    if(row[0].values[0][3] == 0){
      this.writeDB("UPDATE cancion SET duracion = ? WHERE id_cancion = ?", [duration, id_song]);
    }
  };

  this.deleteSong = function(id_song){
    this.writeDB("DELETE FROM cancion where id_cancion = '" + id_song + "'");
  };

  this.writeDB = function (query, values) {
    var res = null;
    if(values){
      this.db.run(query, values);
    }else{
        var res = this.db.exec(query);
    }
    var res = this.db.exec(query);
    var data = this.db.export();
    var buffer = new Buffer(data);
    fs.writeFile(fileDB, buffer);
    return res;
  };

  this.readDB = function (query) {
    return this.db.exec(query);
  };
}
