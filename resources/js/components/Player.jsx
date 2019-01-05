import React from 'react';

function sectostr (time) {
    return ~~(time / 60) + ':' + (time % 60 < 10 ? '0' : '') + time % 60;
}

export default class Player extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            _id: '',
            title: null,
            currentTime: 0,
            totalTime: 0,
            seekStatus: 0,
            seekValue: 0,
            shuffle: false,
            playing: false,
            controlVolumen: false,
            volumen: 1,
        };

        this.audioPlayer = React.createRef();

        this.loadSong = this.loadSong.bind(this);
        this.play = this.play.bind(this);
        this.changeSong = this.changeSong.bind(this);
        this.seek = this.seek.bind(this);
        this.toggleShuffle = this.toggleShuffle.bind(this);
        this.toggleControlVolumen = this.toggleControlVolumen.bind(this);
        this.toggleVolumen = this.toggleVolumen.bind(this);
        this.onChangeVolumen = this.onChangeVolumen.bind(this);
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
            if (state.seekStatus === 1) {
                self.audioPlayer.current.currentTime = state.seekValue * state.totalTime;
                state.seekStatus = 0;
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
                state.playing = false;
                self.setState(state, function () {
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
            this.props.db.getRandomSong(this.state._id, success);
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
        let percent = e.offsetX / this.offsetWidth;
        console.log(percent);
        // self.seekPlayer = {status: 1, value: percent};
    }

    toggleShuffle () {
        let state = this.state;
        state.shuffle = !state.shuffle;
        this.setState(state);
    }

    onChangeVolumen (e) {
        let state = this.state;
        state.volumen = e.target.value;
        this.setState(state);
        this.audioPlayer.current.volumen = e.target.value;
    }

    toggleVolumen () {
        // 	let state = this.state;
        // 	state.volumen = !state.volumen;
        // 	this.setState(state);
    }

    toggleControlVolumen () {
        let state = this.state;
        state.controlVolumen = !state.controlVolumen;
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
                            value={this.state.currentTime / (this.state.totalTime === 0 ? 1 : this.state.totalTime)}
                        ></progress>
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
                            onMouseOver={this.toggleControlVolumen}
                            onMouseOut={this.toggleControlVolumen}>
						<span className={'icon' + (this.state.volumen > 0 ? ' icon-sound' : ' icon-mute')}
                              onClick={this.toggleVolumen}></span>
                        <input className="volumen_range" type="range" min="0" max="1" step="0.1"
                               onChange={this.onChangeVolumen}
                               style={{display: this.state.controlVolumen ? 'block' : 'none'}}/>
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