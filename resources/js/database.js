const Datastore = require('nedb');
const {app} = require('electron').remote;

module.exports = function () {
	const self = this;
	var fileDB = app.getAppPath() + '/resources/db/data.store';
	this.db;

	this.init = function (readyCallback) {
		self.db = new Datastore({filename: fileDB, autoload: true});
		if (readyCallback) {
			readyCallback();
		}
	};

	/*
	[{
	 type: 'song'
	 path:
	 name:
	 playlist:
	}]
	*/
	this.addSongs = function (songs) {
		this.db.insert(songs);
	};

	this.getSongs = function (id_playlist) {
		// return this.readDB('SELECT * FROM cancion where id_playlist=\'' + id_playlist + '\'');
	};

	this.getNextSong = function (id_song) {
		// return this.readDB('select * from cancion where id_cancion > ' + id_song +
		// 	' and id_playlist = (select id_playlist from cancion where id_cancion=' + id_song + ') limit 1');
	};

	this.getPreviousSong = function (id_song) {
		// return this.readDB('select * from cancion where id_cancion < ' + id_song +
		// 	' and id_playlist = (select id_playlist from cancion where id_cancion=' + id_song +
		// 	') order by  id_cancion desc limit 1');
	};

	var listSong = [];

	this.getRandomSong = function (id_song) {
		// var rows = this.readDB(
		// 	'select * from cancion where id_playlist = (select id_playlist from cancion where id_cancion=' + id_song
		// + ')'); if (listSong.length == rows[0].values.length) { listSong = []; } var b = true; var returnSong; while
		// (b) { returnSong = rows[0].values[Math.floor(Math.random() * rows[0].values.length)]; if
		// (listSong.indexOf(returnSong[0]) == -1) { listSong.push(returnSong[0]); b = false; } } return returnSong;
	};

	this.updateNameSong = function (id_song, newName) {
		// this.writeDB('UPDATE cancion SET nombre = ? WHERE id_cancion = ?', [newName, id_song]);
	};

	this.updateDuratioSong = function (id_song, duration) {
		// var row = this.readDB('SELECT * FROM cancion WHERE id_cancion = \'' + id_song + '\'');
		// if (row[0].values[0][3] == 0) {
		// 	this.writeDB('UPDATE cancion SET duracion = ? WHERE id_cancion = ?', [duration, id_song]);
		// }
	};

	this.deleteSong = function (id_song) {
		// this.writeDB('DELETE FROM cancion where id_cancion = \'' + id_song + '\'');
	};

	this.setConfig = function (key, value) {
		// this.writeDB('UPDATE config set ' + key + ' = \'' + value + '\'');
	};

	this.getConfig = function (callback) {
		this.db.find({type: 'config'}, function (err, docs) {
			callback(docs);
		});
	};

	this.getLyrics = function (id_song) {
		// return this.readDB('SELECT * FROM lyrics where id_cancion=\'' + id_song + '\'');
	};

	this.setLyrics = function (id_song, url) {
		// this.writeDB(
		// 	'INSERT OR REPLACE INTO lyrics(id_cancion, url_lyrics) VALUES(\'' + id_song + '\', \'' + url + '\')');
	};

	this.writeDB = function (query, values) {
		// let res = null;
		// if (values) {
		// 	this.db.run(query, values);
		// } else {
		// 	res = this.db.exec(query);
		// }
		// let data = this.db.export();
		// let buffer = new Buffer(data);
		// fs.writeFileSync(fileDB, buffer);
		// return res;
	};

	this.readDB = function (query) {
		return this.db.exec(query);
	};
};
