import React from 'react';

const path = require('path');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const os = require('os');
const fs = require('fs');

var ffbinaries = require('ffbinaries');
String.prototype.format = function () {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{' + i + '\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

//https://www.youtube.com/watch?v=WMxdUmgJUfI
export default class YTdownloader extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            ready: false,
            downloading: false,
            percentage: 0,
            queue: [],
        };

        this.inputURL = React.createRef();

        this.YD = null;
        this.addQueue = this.addQueue.bind(this);
        this.download = this.download.bind(this);
        this.removeFromList = this.removeFromList.bind(this);
    }

    componentDidMount () {
        let self = this;
        let ffmpegPath = self.props.folder_ffmpeg + '/ffmpeg' + (os.platform() === 'win32' ? '.exe' : '');
        let setupDownloader = function () {
            self.YD = new YoutubeMp3Downloader({
                'ffmpegPath': ffmpegPath,
                'outputPath': self.props.folder_download,
                'youtubeVideoQuality': 'highest',
                'queueParallelism': 1,
                'progressTimeout': 500,
            });

            let sanitizeName = function (name) {
                return name.replace(/[\/<>\|?\:"\*\\]/g, '');
            };

            self.YD.on('finished', function (err, data) {
                console.log(data);
                let state = self.state;
                let current = state.queue.find(o => o.isStarted && !o.isFinished);
                let next = state.queue.find(o => !o.isStarted && !o.isFinished);

                self.inputURL.current.value = '';
                let oldPath = data.file;
                let sanitizedName = sanitizeName(data.videoTitle);
                let newPath = path.dirname(oldPath) + '/' + sanitizedName + '.mp3';
                console.log('Renaming "' + oldPath + '" to "' + newPath + '"');
                fs.rename(oldPath, newPath, function (err) {
                    if (err) {
                        console.log('ERROR: ' + err);
                    }
                });
                self.props.db.addSongs(
                    [{type: 'song', path: newPath, name: data.videoTitle, playlist: current.playlist}]);

                current.isFinished = true;
                current.name = data.videoTitle;
                if (next) {
                    next.isStarted = true;
                    self.download(next.YTid);
                }
                self.setState(state);
            });

            self.YD.on('error', function (error) {
                console.log(error);
            });

            self.YD.on('progress', function (progress) {
                let state = self.state;
                let current = state.queue.find(o => o.isStarted && !o.isFinished);
                current.percent = progress.progress.percentage;
                self.setState(state);
            });

            let state = self.state;
            state.ready = true;
            self.setState(state);
        };
        console.log(ffmpegPath);

        if (!fs.existsSync(ffmpegPath)) {
            console.log('download binaries');
            ffbinaries.downloadBinaries(['ffmpeg'], {
                platform: os.platform(),
                quiet: true,
                destination: self.props.folder_ffmpeg,
            }, function () {
                setupDownloader();
            });
        } else {
            setupDownloader();
        }

    }

    componentWillUnmount () {
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
                        {YTid: YTid, playlist: this.props.playlist, isStarted: false, isFinished: false, name: null});
                    this.setState(state);
                }
            }
        } else {
            this.props.vex.dialog.alert(this.props.strings.select_playlist);
        }
    }

    download (YTid) {
        const defaultDownloadName = 'download.tmp';
        this.YD.download(YTid, defaultDownloadName);
    }

    removeFromList (j) {
        let state = this.state;
        state.queue.splice(j, 1);
        this.setState(state);
    }

    render () {
        let self = this;
        let state = self.state;
        if (state.queue.find(o => o.isStarted && !o.isFinished) === undefined) {
            let next = state.queue.find(o => !o.isStarted && !o.isFinished);
            if (next) {
                next.isStarted = true;
                self.download(next.YTid);
                self.setState(state);
            }
        }

        let progressStyle = '-webkit-gradient(linear, left top, right top, from(#cce6cc), to(white), color-stop({0}, #cce6cc), color-stop({0}, white))';
        return (
            this.state.ready ?
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
                        <tr>
                            <td style={{textAlign: 'center'}}><span className="icon icon-note-beamed"></span></td>
                        </tr>
                        </thead>
                        <tbody>

                        {this.state.queue.map((k, j) =>
                            <tr style={{
                                backgroundImage: k.percent !== 100
                                    ? progressStyle.format(Math.round(k.percent) / 100)
                                    : 'linear-gradient(#82c782, #82c782)',
                            }}>
                                <td style={{whiteSpace: 'normal'}}>
                                    {k.name ? k.name : k.YTid}
                                    <span className='icon icon-cancel'
                                          style={{float: 'right', display: k.percent === 100 ? 'block' : 'none'}}
                                          onClick={() => {this.removeFromList(j);}}></span>
                                </td>
                            </tr>,
                        )}
                        </tbody>
                    </table>
                </div>
                : <span style={this.props.style}>{this.props.strings.ytdownload_loading}</span>
        );
    }
}
