const remote = require('electron').remote;
const {app} = require('electron').remote;

function modulo (index, bounds) {
    return (index % bounds + bounds) % bounds;
}

module.exports = function () {
    const self = this;
    this.db;

    this.init = function (readyCallback) {
        self.db = remote.getGlobal('db');
        self.db.loadDatabase(function () {
            self.db.find({type: 'playlist'}, function (err, docs) {
                if (docs.length === 0) {
                    self.db.insert({type: 'playlist', name: 'Default'});
                }
                let folder = app.getPath('music');
                self.db.find({type: 'config', identifier: 'folder'}, function (err, docs) {
                    if (docs.length === 0) {
                        self.db.insert({type: 'config', identifier: 'folder', value: folder});
                    }
                    if (readyCallback) {
                        readyCallback();
                    }
                });
            });
        });
    };
    /*
    [{
     type: 'config'
     identifier:
     value:
    }]
    */

    this.getConfig = function (responseCallback) {
        self.db.find({type: 'config'}).sort({createdAt: 1}).exec(function (err, docs) {
            responseCallback(docs);
        });
    };

    this.changeConfig = function (identifier, value, successCallback) {
        self.db.findOne({type: 'config', identifier: identifier}, function (err, doc) {
            if (doc !== null) {
                self.db.update({_id: doc._id}, {$set: {value: value}}, {}, function () {
                    successCallback();
                });
            } else {
                self.db.insert({type: 'config', identifier: identifier, value: value}, function () {
                    successCallback();
                });
            }
        });
    };

    /*
    [{
     type: 'playlist'
     name:
    }]
    */

    this.getPlayLists = function (responseCallback) {
        self.db.find({type: 'playlist'}).sort({createdAt: 1}).exec(function (err, docs) {
            responseCallback(docs);
        });
    };

    this.addPlayList = function (name, id, successCallback) {
        let obj = {type: 'playlist', name: name};
        if (id) {
            obj._id = id;
        }
        self.db.insert(obj, function () {
            successCallback();
        });
    };

    this.changeNamePlayList = function (_id, name, successCallback) {
        self.db.update({_id: _id}, {$set: {name: name}}, {}, function () {
            successCallback();
        });
    };

    this.deletePlayList = function (_id, successCallback) {
        //delete songs on playlist
        self.db.remove({playlist: _id}, {multi: true}, function (err, numRemoved) {
            // delete playlist
            self.db.remove({_id: _id}, {}, function (err, numRemoved) {
                successCallback();
            });
        });
    };

    /*
    [{
     type: 'song'
     path:
     name:
     playlist:
     duration:
     YtID:
    }]
    */
    this.addSong = function (song) {
        this.db.insert(song);
    };

    this.getSongs = function (playlist, responseCallback) {
        self.db.find({type: 'song', playlist: playlist}).sort({createdAt: 1}).exec(function (err, docs) {
            responseCallback(docs);
        });
    };

    this.getSongsbySong = function (_id, responseCallback) {
        self.getSong(_id, function (song) {
            if (song !== null) {
                self.getSongs(song.playlist, function (songs) {
                    responseCallback(songs);
                });
            }
        });
    };

    this.getSong = function (_id, responseCallback) {
        self.db.findOne({_id: _id}, function (err, docs) {
            responseCallback(docs);
        });
    };

    this.changeNameSong = function (_id, name, successCallback) {
        self.db.update({_id: _id}, {$set: {name: name}}, {}, function () {
            successCallback();
        });
    };

    this.deleteSong = function (_id, successCallback) {
        self.db.remove({_id: _id}, {}, () => {
            successCallback();
        });
    };

    this.deleteSongByYtId = function (ytid, playlist) {
        self.db.remove({YtID: ytid, playlist: playlist}, {});
    };

    this.__getSongs = function (_id, type, successCallback) {
        self.getSong(_id, function (song) {
            if (song !== null) {
                self.getSongs(song.playlist, function (songs) {
                    let index = songs.findIndex(k => k._id === _id);
                    let target;
                    if (type === 'next') {
                        target = modulo(index + 1, songs.length);
                    }
                    if (type === 'prev') {
                        target = modulo(index - 1, songs.length);
                    }
                    if (type === 'rand') {
                        target = Math.floor(Math.random() * songs.length);
                    }
                    if (typeof songs[target] !== 'undefined') {
                        successCallback(songs[target]);
                    }
                });
            }
        });
    };

    this.getArraySongs = function (callback) {
        self.db.find({type: 'playlist'}, (err, playlists) => {
            let res = [];
            self.db.find({type: 'song'}, (err, songs) => {
                playlists.forEach((playlist) => {
                    res.push({
                        id: playlist._id,
                        name: playlist.name,
                        songs: songs.filter((e) => {return e.playlist === playlist._id;}).map((e) => {return e.YtID;}),
                    });
                });
                callback(res);
            });
        });
    };

    this.getNextSong = function (_id, successCallback) {
        this.__getSongs(_id, 'next', successCallback);
    };

    this.getPrevSong = function (_id, successCallback) {
        this.__getSongs(_id, 'prev', successCallback);
    };

    this.getRandomSong = function (_id, successCallback) {
        this.__getSongs(_id, 'rand', successCallback);
    };

    this.updateDuratioSong = function (_id, duration, successCallback) {
        self.db.update({_id: _id}, {$set: {duration: duration}}, {}, function () {
            successCallback();
        });
    };
    /*
        this.setConfig = function (key, value) {
            // this.writeDB('UPDATE config set ' + key + ' = \'' + value + '\'');
        };

        this.getConfig = function (callback) {
            this.db.find({type: 'config'}, function (err, docs) {
                callback(docs);
            });
        };*/

};
