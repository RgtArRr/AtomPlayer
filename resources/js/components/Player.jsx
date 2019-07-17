import React from 'react';
const {getFirstImageURL} = require('first-image-search-load');


function sectostr (time) {
    return ~~(time / 60) + ':' + (time % 60 < 10 ? '0' : '') + time % 60;
}

function modulo (index, bounds) {
    return (index % bounds + bounds) % bounds;
}

function shuffleArray (array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

export default class Player extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            _id: null,
            _id_playlist: null,
            img_album: null,
            title: null,
            currentTime: 0,
            totalTime: 0,
            shuffle: false,
            playing: false,
            controlVolume: false,
            volume: 1,
        };

        this.shuffle_song_list = [];

        this.seekInfo = {status: 0, value: 0};

        this.audioPlayer = React.createRef();

        this.loadSong = this.loadSong.bind(this);
        this.play = this.play.bind(this);
        this.changeSong = this.changeSong.bind(this);
        this.seek = this.seek.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        this.makeSuffleList = this.makeSuffleList.bind(this);
        this.toggleControlVolume = this.toggleControlVolume.bind(this);
        this.toggleVolume = this.toggleVolume.bind(this);
        this.onChangeVolume = this.onChangeVolume.bind(this);
    }

    componentDidMount () {
        let self = this;
        this.audioPlayer.current.addEventListener('loadedmetadata', function (e) {
            let state = self.state;
            state.totalTime = Math.round(e.target.duration);
            self.setState(state);
            self.props.db.updateDuratioSong(self.state._id, state.totalTime, function () {
                self.props.songlist.current.updateSongs();
            });
        });

        this.audioPlayer.current.addEventListener('timeupdate', function (e) {
            let state = self.state;
            if (self.seekInfo.status === 1) {
                self.audioPlayer.current.currentTime = self.seekInfo.value * state.totalTime;
                self.seekInfo.status = 0;
            }
            state.currentTime = this.currentTime;
            self.setState(state);
        });

        this.audioPlayer.current.addEventListener('ended', function (e) {
            let state = self.state;
            self.state.playing = false;
            self.setState(state);
            self.changeSong(self.state.shuffle ? 'rand' : 'next');
        });
    }

    componentWillUnmount () {
        // this.audioPlayer.current.removeEventListener('loadedmetadata');
    }

    loadSong (_id) {
        let self = this;
        this.props.db.getSong(_id, function (song) {
            if (song !== null) {
                let state = self.state;
                self.audioPlayer.current.src = song.path;
                self.audioPlayer.current.load();
                state.title = song.name;
                state._id = song._id;
                let b = song.playlist !== state._id_playlist && state.shuffle;
                state._id_playlist = song.playlist;
                state.playing = false;
                self.setState(state, function () {
                    if (b) {
                        self.makeSuffleList(song._id);
                    }
                    self.play();
                });
                //update song list
                let _state = self.props.songlist.current.state;
                _state.current = song._id;
                self.props.songlist.current.setState(_state);

                //search for the image
                getFirstImageURL(song.name + ' album').then(function (response) {
                    let state = self.state;
                    state.img_album = response;
                    self.setState(state);
                }).catch(function () {
                    let state = self.state;
                    state.img_album = null;
                    self.setState(state);
                });
            }
        });
    }

    play () {
        let self = this;
        let state = self.state;
        if (self.state.playing) {
            self.audioPlayer.current.pause();
        } else {
            self.audioPlayer.current.play();
        }
        state.playing = !self.state.playing;
        self.setState(state);
    }

    changeSong (type) {
        let self = this;
        let success = function (song) {
            if (song !== null) {
                console.log('Siguiente cancion', song._id);
                self.loadSong(song._id);
            } else {
                console.log('End playlist');
            }
        };

        if (this.state.shuffle) {
            let index = self.shuffle_song_list.findIndex(k => k._id === self.state._id);
            if (index !== -1) {
                success(self.shuffle_song_list[modulo(index + 1, self.shuffle_song_list.length)]);
            }
        } else {
            if (type === 'next') {
                this.props.db.getNextSong(this.state._id, success);
            }
            if (type === 'prev') {
                this.props.db.getPrevSong(this.state._id, success);
            }
        }
    }

    seek (e) {
        let percent = e.nativeEvent.offsetX / e.target.offsetWidth;
        this.seekInfo = {status: 1, value: percent};
    }

    toggleShuffle () {
        let state = this.state;
        state.shuffle = !state.shuffle;
        if (state.shuffle) {
            this.makeSuffleList(state._id);
        }
        this.setState(state);
    }

    makeSuffleList (_id) {
        let self = this;
        this.props.db.getSongsbySongs(_id, function (data) {
            shuffleArray(data);
            self.shuffle_song_list = data;
        });
    }

    onChangeVolume (e) {
        let state = this.state;
        state.volume = e.target.value;
        this.setState(state);
        this.audioPlayer.current.volume = e.target.value;
    }

    toggleVolume () {
        // 	let state = this.state;
        // 	state.volume = !state.volume;
        // 	this.setState(state);
    }

    toggleControlVolume () {
        let state = this.state;
        state.controlVolume = !state.controlVolume;
        this.setState(state);
    }

    render () {
        let img_album = this.state.img_album;
        if (img_album === null) {
            img_album = 'data:image/png;base64,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';
        }
        return (
            [
                <div key={'album'} className={'album'}>
                    <img src={img_album} alt=""/>
                </div>,
                <div key={'div_player'} className="player">
                    <ul id="progress_song">
                        <li>{sectostr(Math.round(this.state.currentTime))}</li>
                        <progress
                            max={'1'}
                            onClick={this.seek}
                            style={{width: '83%'}}
                            value={this.state.currentTime / (this.state.totalTime === 0 ? 1 : this.state.totalTime)}>
                        </progress>
                        <li>{sectostr(Math.round(this.state.totalTime))}</li>
                    </ul>
                    <button className="btn btn-default" onClick={() => {this.changeSong('prev');}}>
                        <span className="icon icon-to-start"></span>
                    </button>
                    <button className="btn btn-default playButton" onClick={this.play}>
						<span className={'icon circle_button' + (this.state.playing ? ' icon-pause' : ' icon-play')}>
						</span>
                    </button>
                    <button className="btn btn-default" onClick={() => {this.changeSong('next');}}>
                        <span className="icon icon-to-end"></span>
                    </button>
                    <button className={'btn btn-default' + (this.state.shuffle ? ' btn-active' : '')}
                            onClick={this.toggleShuffle}>
                        <span className="icon icon-shuffle"></span>
                    </button>
                    <button className="btn btn-default"
                            onMouseOver={this.toggleControlVolume}
                            onMouseOut={this.toggleControlVolume}>
						<span className={'icon' + (this.state.volume > 0 ? ' icon-sound' : ' icon-mute')}
                              onClick={this.toggleVolume}></span>
                        <input className="volumen_range" type="range" min="0" max="1" step="0.1"
                               onChange={this.onChangeVolume}
                               style={{display: this.state.controlVolume ? 'block' : 'none'}}/>
                    </button>
                    <button className="btn maximize" style={{display: 'none'}} onClick={this.props.toggleWindowSize}>
                        <span className="icon icon-window"></span>
                    </button>
                    <span className="song_title">{this.state.title}</span>
                </div>,
                <audio key={'audio_player'} src="" ref={this.audioPlayer}></audio>,
            ]
        );
    }
}