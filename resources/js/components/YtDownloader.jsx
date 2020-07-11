import React from 'react';

const ipcRenderer = require('electron').ipcRenderer;
const fs = require('fs');
const https = require('https');
const CryptoJS = require('crypto-js');

String.prototype.format = function () {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
        let regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

//https://www.youtube.com/watch?v=WMxdUmgJUfI
export default class YtDownloader extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            ready: false,
            downloading: false,
            percentage: 0,
            queue: [],
        };

        this.inputURL = React.createRef();

        this.saveToDrive = this.saveToDrive.bind(this);
        this.addQueue = this.addQueue.bind(this);
        this.download = this.download.bind(this);
        this.removeFromList = this.removeFromList.bind(this);
    }

    componentDidMount () {
        let self = this;

        setInterval(() => {
            let state = self.state;
            if (state.queue.find(o => o.isStarted && !o.isFinished) === undefined) {
                let next = state.queue.find(o => !o.isStarted && !o.isFinished);
                if (next) {
                    next.isStarted = true;
                    self.download(next.YTid);
                    self.setState(state);
                }
            }
        }, 1000);
    }

    componentWillUnmount () {
    }

    saveToDrive () {
        this.props.db.getArraySongs((res) => {
            ipcRenderer.sendSync('saveDataToDrive', {data: res});
        });
    }

    addQueue () {
        if (this.props.playlist !== null) {
            let state = this.state;
            let regexRule = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
            let YTid = this.inputURL.current.value.match(regexRule);
            if (YTid !== null) {
                YTid = YTid[1];
                if (YTid.length === 11) {
                    state.queue.push(
                        {
                            YTid: YTid,
                            playlist: this.props.playlist,
                            isStarted: false,
                            isFinished: false,
                            name: null,
                            saveToDrive: true,
                        });
                    this.setState(state);
                    this.inputURL.current.value = '';
                }
            } else {
                this.props.vex.dialog.alert(this.props.strings.is_not_yt_url);
            }
        } else {
            this.props.vex.dialog.alert(this.props.strings.select_playlist);
        }
    }

    addQueueManually (YTid, playlist) {
        let state = this.state;
        state.queue.push(
            {YTid: YTid, playlist: playlist, isStarted: false, isFinished: false, name: null, saveToDrive: false});
        this.setState(state);
    }

    download (YTid) {
        let self = this;
        let sanitizeName = function (name) {return name.replace(/[\/<>\|?\:"\*\\]/g, '');};
        let currentTime = Math.round(new Date().getTime() / 1000);
        let raw_signature = CryptoJS.HmacSHA1('WUKaudOpx|' + currentTime, 'iGV7PetSJdgREnuXUSvhR59RHSzFv0C1');
        let signature = raw_signature.toString(CryptoJS.enc.Hex);
        let query = 'apikey=WUKaudOpx&t=' + currentTime + '&h=' + signature + '&v=' + YTid;
        const defaultDownloadName = 'download.tmp';
        fetch('https://api.recordmp3.co/fetch?' + query).then((response) => {
            return response.json();
        }).then((json) => {
            let state = self.state;
            let current = state.queue.find(o => o.isStarted && !o.isFinished);
            current.percent = json.step_progress;
            current.name = json.title ? json.title : json.step_id;
            if (json && json.timeout) {
                setTimeout(() => {self.download(YTid);}, json.timeout * 1000);
            } else {
                let filepath = self.props.folder_download + '/' + sanitizeName(json.title) + '.mp3';
                let onFinish = () => {
                    let state = self.state;
                    let current = state.queue.find(o => o.isStarted && !o.isFinished);
                    current.isFinished = true;
                    self.setState(state);
                    self.props.db.addSong({
                            type: 'song',
                            path: filepath,
                            name: json.title,
                            playlist: current.playlist,
                            thumbnail: json.thumbnail,
                            YtID: json.id,
                        },
                    );
                    if (current.saveToDrive) {
                        self.saveToDrive();
                    }
                };
                if (fs.existsSync(filepath)) {
                    onFinish();
                } else {
                    let file = fs.createWriteStream(filepath);
                    https.get('https:' + json.url, (response) => {
                        response.on('data', (data) => {
                            file.write(data);
                        }).on('end', () => {
                            file.close(() => {
                                onFinish();
                            });
                        });
                    });
                }
            }
            self.setState(state);
        });
    }

    removeFromList (j) {
        let state = this.state;
        state.queue.splice(j, 1);
        this.setState(state);
    }

    render () {
        let progressStyle = '-webkit-gradient(linear, left top, right top, from(#cce6cc), to(white), color-stop({0}, #cce6cc), color-stop({0}, white))';
        return (
            <div className="ytdownloadercontainer" style={this.props.style}>
                <div className="form-group">
                    <label>{this.props.strings.ytdownload_explain}</label>
                    <input type="text" className="form-control" ref={this.inputURL}
                           placeholder={this.props.strings.ytdownload_instructions}/>
                </div>
                <button className="btn btn-form btn-primary"
                        style={{display: this.state.downloading ? 'none' : 'block'}} onClick={this.addQueue}>
                    {this.props.strings.download}
                </button>
                <table>
                    <thead>
                    <tr id={'header'}>
                        <td style={{textAlign: 'center'}}>
                            Cola de canciones<span className="icon icon-note-beamed"/>
                        </td>
                    </tr>
                    </thead>
                    <tbody>

                    {this.state.queue.map((k, j) =>
                        <tr style={{
                            backgroundImage: k.percent !== 100
                                ? progressStyle.format(Math.round(k.percent) / 100)
                                : 'linear-gradient(#82c782, #82c782)',
                        }} id={'song_' + j}>
                            <td style={{whiteSpace: 'normal'}} id={'song_val_' + j}>
                                {k.name ? k.name : k.YTid}
                                <span id={'song_item_' + j} className='icon icon-cancel'
                                      style={{float: 'right', display: k.isFinished ? 'block' : 'none'}}
                                      onClick={() => {this.removeFromList(j);}}/>
                            </td>
                        </tr>,
                    )}
                    </tbody>
                </table>
            </div>
        );
    }
}
