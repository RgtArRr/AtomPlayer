console.log(process.versions.electron);
import React from 'react';
import { render } from 'react-dom';
import SongList from './components/SongList';
import PlayList from './components/PlayList';
import Player from './components/Player';
import YTdownloader from './components/YTdownloader';

const https = require('https');
const {dialog} = require('electron').remote;
const {app} = require('electron').remote;
const {clipboard} = require('electron');
const ipcRenderer = require('electron').ipcRenderer;
const Database = require('./utils/database');
const {strings} = require('./utils/locale');
const vex = require('vex-js');
const semver = require('semver');
const os = require('os');
const isDev = require('electron-is-dev');
const unzipper = require('unzipper');
const mkdir = require('mkdirp');
const fs = require('fs');
const path = require('path');

vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

const db = new Database();
let config = null;

function MenuBoton (props) {
    return (
        <button className={'btn btn-' + props.class} onClick={() => { props.action(); }}>
            <span className={'icon icon-' + props.icon}></span> {props.text}
        </button>
    );
}

function updater () {
    if (!isDev) {
        https.get(
            {
                host: 'api.github.com',
                path: '/repos/RgtArRr/AtomPlayer/releases/latest',
                headers: {'user-agent': 'atomplayer'},
            }, (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    data = JSON.parse(data);
                    if (semver.gt(data.tag_name.substr(1), app.getVersion())) {
                        let update = data.assets.find((o) => o.name.indexOf(os.platform()) !== -1);
                        if (update) {
                            let file_tmp = app.getPath('downloads') + '/temp_atomplayer_update.zip';
                            let file = fs.createWriteStream(file_tmp);
                            https.get(update.browser_download_url, function (redirect) {
                                https.get(redirect.headers.location, function (response) {
                                    response.on('data', function (data) {
                                        file.write(data);
                                    }).on('end', function () {
                                        file.close(function () {
                                            let appPath = app.getPath('exe').split('/');
                                            appPath.pop();
                                            appPath = appPath.join('/');
                                            fs.createReadStream(file_tmp).
                                                pipe(unzipper.Parse()).
                                                on('entry', function (entry) {
                                                    let fileName = entry.path;
                                                    let type = entry.type;
                                                    if (type === 'File' && fileName.indexOf('resources/app') !== -1) {
                                                        let fullPath = appPath + path.dirname(fileName);
                                                        fileName = path.basename(fileName);
                                                        mkdir.sync(fullPath);
                                                        entry.pipe(fs.createWriteStream(fullPath + '/' + fileName));
                                                    } else {
                                                        entry.autodrain();
                                                    }
                                                }).
                                                promise().
                                                then(function () {
                                                    vex.dialog.alert(strings.restart_required);
                                                }, function (e) {
                                                    console.log('error', e);
                                                });
                                        });
                                    });
                                });
                            });
                        }

                    }
                });
            },
        ).on('error', (err) => {
            console.log('Error: ' + err.message);
        });
    }
}

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {playlist: null, window: 'home'};
        this.config = null;
        this.childSongList = React.createRef();
        this.childPlayer = React.createRef();

        this.homeAction = this.homeAction.bind(this);
        this.donwloadAction = this.donwloadAction.bind(this);
        this.settingAction = this.settingAction.bind(this);

        this.folderAction = this.folderAction.bind(this);
        this.onChangePlayList = this.onChangePlayList.bind(this);
        this.ondblclickSong = this.ondblclickSong.bind(this);
        this.toggleWindowSize = this.toggleWindowSize.bind(this);
    }

    componentDidMount () {
        ipcRenderer.on('medianexttrack', function () {
            this.childPlayer.current.changeSong('next');
        });

        ipcRenderer.on('mediaplaypause', function () {
            this.childPlayer.current.play();
        });

        ipcRenderer.on('mediaprevioustrack', function () {
            this.childPlayer.current.changeSong('prev');
        });
    }

    homeAction () {
        let state = this.state;
        state.window = 'home';
        this.setState(state);
    }

    donwloadAction () {
        let state = this.state;
        state.window = 'download';
        this.setState(state);
    }

    settingAction () {
        ipcRenderer.sendSync('openSettings', {});
    }

    folderAction () {
        let self = this;
        if (self.state.playlist !== null) {
            dialog.showOpenDialog({
                title: strings.choose_song,
                properties: ['openFile', 'multiSelections'],
                filters: [{name: strings.song, extensions: ['mp3']}],
            }, function (e) {
                if (e) {
                    let temp = [];
                    e.forEach(function (k) {
                        //TODO: support more audio extensions files
                        //Check extension file
                        if (k.substr(k.length - 4) === '.mp3') {
                            let name = k.split(/(\\|\/)/g).pop();
                            name = name.substr(0, name.length - 4);
                            temp.push({type: 'song', path: k, name: name, playlist: self.state.playlist});
                        }
                    });
                    db.addSongs(temp);
                    self.childSongList.current.updateSongs();
                }
            });
        } else {
            vex.dialog.alert(strings.select_playlist);
        }
    }

    onChangePlayList (_id) {
        let state = this.state;
        state.playlist = _id;
        this.setState(state, function () {
            //trigger for update song list
            this.childSongList.current.updateSongs();
        });
    }

    ondblclickSong (_id) {
        this.childPlayer.current.loadSong(_id);
    }

    toggleWindowSize () {
        ipcRenderer.sendSync('toogleMode', {});
    }

    render () {
        console.log('render app');
        return (
            [
                <header key={'main_toolbar'} className="toolbar toolbar-header" style={{WebkitAppRegion: 'drag'}}>
                    <h1 className="title">AtomPlayer</h1>
                    <div className="toolbar-actions">
                        <div className="btn-group">
                            <MenuBoton class="default" action={() => {this.homeAction();}} icon="home"/>
                            <MenuBoton class="default" action={() => {this.folderAction();}} icon="folder"/>
                            <MenuBoton class="default" action={() => {this.donwloadAction();}} icon="download"/>
                        </div>
                        <MenuBoton class="default pull-right" action={updater} icon="arrows-ccw" text={strings.update}/>
                        <MenuBoton class="default pull-right" action={this.toggleWindowSize} icon="popup"/>
                        <MenuBoton class="default pull-right" action={this.settingAction} icon="cog"/>
                    </div>
                </header>,
                <div key={'main_playlist'} className="window-content" style={{height: '470px'}}>
                    <div className="pane-group">
                        <div className="pane pane-sm sidebar">
                            <PlayList db={db} vex={vex} playlist={this.state.playlist} strings={strings}
                                      onChangePlayList={this.onChangePlayList}/>
                        </div>
                        <div className="pane">
                            <SongList db={db} vex={vex} playlist={this.state.playlist} ref={this.childSongList}
                                      strings={strings}
                                      ondblclickSong={this.ondblclickSong}
                                      style={{display: (this.state.window === 'home' ? 'block' : 'none')}}/>
                            <YTdownloader db={db} vex={vex} playlist={this.state.playlist} strings={strings}
                                          style={{display: (this.state.window === 'download' ? 'block' : 'none')}}
                                          folder_download={config.find(o => o.identifier === 'folder').value}
                                          folder_ffmpeg={app.getAppPath()}/>
                        </div>
                    </div>
                </div>,
                <footer key={'main_footer'} className="toolbar toolbar-footer"
                        style={{minHeight: '75px', WebkitAppRegion: 'no-drag'}}>
                    {/*<button className="btn" id="toggleLyrics">*/}
                    {/*<span className="icon icon-note-beamed"></span>&nbsp;Letras*/}
                    {/*</button>*/}
                    <div className="toolbar-actions player">
                        <Player db={db} ref={this.childPlayer} toggleWindowSize={this.toggleWindowSize}
                                songlist={this.childSongList}/>
                    </div>
                </footer>,
            ]

        );
    }
}

db.init(function () {
    db.getConfig(function (data) {
        config = data;
        render((<App></App>),
            document.getElementById('root'),
        );
    });
});
