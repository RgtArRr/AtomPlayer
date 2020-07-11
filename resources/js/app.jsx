console.log(process.versions.electron);
import React from 'react';
import { render } from 'react-dom';
import SongList from './components/SongList';
import PlayList from './components/PlayList';
import Player from './components/Player';
import YtDownloader from './components/YtDownloader';
import Google from './components/Google';
import ErrorHandler from './components/ErrorHandler';

const {app} = require('electron').remote;
const ipcRenderer = require('electron').ipcRenderer;
const Database = require('./utils/database');
const {strings} = require('./utils/locale');
const log = require('electron-log');
const vex = require('vex-js');

Object.assign(console, log.functions);
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

const db = new Database();
let config = null;

function MenuBoton (props) {
    return (
        <button className={'btn btn-' + props.class} onClick={() => { props.action(); }}>
            <span className={'icon icon-' + props.icon}/> {props.text}
        </button>
    );
}

class App extends React.Component {
    constructor (props) {
        super(props);
        this.state = {playlist: null, window: 'home', isLogin: false};
        this.childPlayList = React.createRef();
        this.childSongList = React.createRef();
        this.childPlayer = React.createRef();
        this.childDownloader = React.createRef();

        this.homeAction = this.homeAction.bind(this);
        this.donwloadAction = this.donwloadAction.bind(this);
        this.settingAction = this.settingAction.bind(this);

        // this.folderAction = this.folderAction.bind(this);
        this.onChangePlayList = this.onChangePlayList.bind(this);
        this.ondblclickSong = this.ondblclickSong.bind(this);
        this.toggleWindowSize = this.toggleWindowSize.bind(this);
    }

    componentDidMount () {
        let conf;

        conf = config.find(o => o.identifier === 'medianexttrack');
        conf = conf ? conf.value : 'medianexttrack';
        ipcRenderer.sendSync('registerShortcut', {'key': conf, 'channel': 'medianexttrack'});

        conf = config.find(o => o.identifier === 'mediaprevioustrack');
        conf = conf ? conf.value : 'mediaprevioustrack';
        ipcRenderer.sendSync('registerShortcut', {'key': conf, 'channel': 'mediaprevioustrack'});

        conf = config.find(o => o.identifier === 'mediaplaypause');
        conf = conf ? conf.value : 'mediaplaypause';
        ipcRenderer.sendSync('registerShortcut', {'key': conf, 'channel': 'mediaplaypause'});

        ipcRenderer.on('medianexttrack', () => {
            this.childPlayer.current.changeSong('next');
        });

        ipcRenderer.on('mediaplaypause', () => {
            this.childPlayer.current.play();
        });

        ipcRenderer.on('mediaprevioustrack', () => {
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

    /*
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
    }*/

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
                            {/*<MenuBoton class="default" action={() => {this.folderAction();}} icon="folder"/>*/}
                            <MenuBoton class="default" action={() => {this.donwloadAction();}} icon="download"/>
                        </div>
                        <Google db={db} strings={strings}
                                playlist={this.childPlayList} downloader={this.childDownloader}/>
                        <MenuBoton class="default pull-right" action={this.toggleWindowSize} icon="popup"/>
                        <MenuBoton class="default pull-right" action={this.settingAction} icon="cog"/>
                    </div>
                </header>,
                <div key={'main_playlist'} className="window-content" style={{height: '470px'}}>
                    <div className="pane-group">
                        <div className="pane pane-sm sidebar">
                            <PlayList db={db} vex={vex} ref={this.childPlayList} playlist={this.state.playlist}
                                      strings={strings}
                                      onChangePlayList={this.onChangePlayList}/>
                        </div>
                        <div className="pane">
                            <SongList db={db} vex={vex} playlist={this.state.playlist} ref={this.childSongList}
                                      strings={strings}
                                      ondblclickSong={this.ondblclickSong}
                                      style={{display: (this.state.window === 'home' ? 'block' : 'none')}}/>
                            <YtDownloader db={db} vex={vex} ref={this.childDownloader} playlist={this.state.playlist}
                                          strings={strings}
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
        render((
                <ErrorHandler>
                    <App/>
                </ErrorHandler>),
            document.getElementById('root'),
        );
    });
});
