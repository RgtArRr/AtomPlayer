import React from 'react';

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
        return (
            [
                <div key={'div_player'} className="player">
                    <ul id="progress_song">
                        <li>{sectostr(Math.round(this.state.currentTime))}</li>
                        <progress
                            max={'1'}
                            onClick={this.seek}
                            style={{width: '90%'}}
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