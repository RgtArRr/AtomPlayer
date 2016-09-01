var sql = require('sql.js');
const {app} = require('electron').remote;

function Database() {
  var self = this;
  var fileDB = app.getAppPath()+"/resources/db/DB.sqlite";
  this.db;

  this.init = function(readyCallback){
    try {
      var filebuffer = fs.readFileSync(fileDB);
      self.db = new SQL.Database(filebuffer);
      console.log("Loaded DB");
    } catch (e) {
      self.db = new sql.Database();
      self.writeDB("CREATE TABLE config ( medianexttrack TEXT, mediaprevioustrack TEXT, mediaplaypause TEXT, shuffle TEXT, volume INTEGER ); CREATE TABLE playlist ( id_playlist INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, nombre TEXT ); CREATE TABLE cancion ( id_cancion INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, nombre TEXT, ruta TEXT, duracion INTEGER, id_playlist INTEGER, FOREIGN KEY(id_playlist) REFERENCES playlist(id_playlist) ); INSERT INTO config VALUES ('0', '0', '0', '0', 10)");
      console.log("No se puede obtener la bd, creando una nueva");
    }
    if(readyCallback){
      readyCallback();
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

  var listSong = [];

  this.getRandomSong = function(id_song){
    var rows = this.readDB("select * from cancion where id_playlist = (select id_playlist from cancion where id_cancion="+id_song+")");
    if(listSong.length == rows[0].values.length){
      listSong = [];
    }
    var b = true;
    var returnSong;
    while(b){
      returnSong = rows[0].values[Math.floor(Math.random() * rows[0].values.length)];
      if(listSong.indexOf(returnSong[0]) == -1){
        listSong.push(returnSong[0]);
        b = false;
      }
    }
    return returnSong;
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

  this.setConfig = function(key, value){
    this.writeDB("UPDATE config set "+key+" = '"+value+"'");
  };

  this.getConfig = function(){
    return this.readDB("SELECT * FROM config where 1 = 1");
  }

  this.getLyrics = function(id_song){
    return this.readDB("SELECT * FROM lyrics where id_cancion='"+id_song+"'");
  }

  this.setLyrics = function(id_song, url){
    this.writeDB("INSERT OR REPLACE INTO lyrics(id_cancion, url_lyrics) VALUES('"+id_song+"', '"+url+"')");
  }

  this.createTableLyrics = function(){
    this.writeDB("CREATE table IF NOT EXISTS lyrics (id_cancion	INTEGER UNIQUE,url_lyrics TEXT)");
  }

  this.writeDB = function (query, values) {
    var res = null;
    if(values){
      this.db.run(query, values);
    }else{
      var res = this.db.exec(query);
    }
    var data = this.db.export();
    var buffer = new Buffer(data);
    fs.writeFile(fileDB, buffer);
    return res;
  };

  this.readDB = function (query) {
    return this.db.exec(query);
  };
}
