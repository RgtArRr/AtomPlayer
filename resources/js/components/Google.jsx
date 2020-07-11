import React from 'react';

const ipcRenderer = require('electron').ipcRenderer;

Array.prototype.contains = function (needle) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == needle) {
            return true;
        }
    }
    return false;
};

Array.prototype.diff = function (compare) {
    return this.filter(function (elem) {return !compare.contains(elem);});
};

export default class Google extends React.Component {
    constructor (props) {
        super(props);
        this.state = {isLogin: false};
        this.clickHandler = this.clickHandler.bind(this);
        this.SyncAndBackup = this.SyncAndBackup.bind(this);
    }

    componentDidMount () {
        console.log('google drive preparing');
        let self = this;
        let state = self.state;
        let login = ipcRenderer.sendSync('checkLogin');
        state.isLogin = login;
        self.setState(state);
        if (login) {
            this.SyncAndBackup();
        }

        ipcRenderer.on('login', (e, message) => {
            let state = self.state;
            state.isLogin = message;
            self.setState(state);
        });
    }

    SyncAndBackup () {
        let data = ipcRenderer.sendSync('getDataFromDrive');
        if (data !== null) {
            this.props.db.getArraySongs((actual) => {
                let playlistToAdd = data.map((r) => {return r.id;}).diff(actual.map((r) => {return r.id;}));
                let playlistToRemove = actual.map((r) => {return r.id;}).diff(data.map((r) => {return r.id;}));
                playlistToAdd.forEach((ele) => {
                    let temp = data.find((e) => {return e.id === ele;});
                    this.props.db.addPlayList(temp.name, temp.id, () => {});
                });
                playlistToRemove.forEach((ele) => {
                    this.props.db.deletePlayList(ele, () => {});
                });
                setTimeout(() => {
                    this.props.playlist.current.updatePlayLists();
                    data.forEach((playlist) => {
                        let playlist_actual = actual.find((e) => {return e.id === playlist.id;});
                        let songstoAdd = playlist.songs.diff(playlist_actual.songs);
                        let songstoRemove = playlist_actual.songs.diff(playlist.songs);
                        songstoAdd.forEach((ytid) => {
                            this.props.downloader.current.addQueueManually(ytid, playlist.id);
                        });
                        songstoRemove.forEach((ytid) => {
                            this.props.db.deleteSongByYtId(ytid, playlist.id);
                        });
                    });
                }, 200);
            });
        } else {
            this.props.db.getArraySongs((res) => {
                ipcRenderer.sendSync('saveDataToDrive', {data: res});
            });
        }
    }

    clickHandler () {
        if (this.state.isLogin) {
            ipcRenderer.sendSync('logout');
            let state = this.state;
            state.isLogin = false;
            this.setState(state);
        } else {
            ipcRenderer.sendSync('AuthWithGoogle');
        }
    };

    render () {
        return (
            <button className={'btn btn-default pull-right'} onClick={this.clickHandler}
                    title={(this.state.isLogin ? this.props.strings.logout : this.props.strings.login_with_google)}>
                <span className={'icon icon-' + (this.state.isLogin ? 'logout' : 'login')}/>
                {this.state.isLogin ? 'Logout' : 'Login'}
            </button>
        );
    }
}
