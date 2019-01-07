import React from 'react';

const path = require('path');
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const os = require('os');
const fs = require('fs');

var ffbinaries = require('ffbinaries');

//https://www.youtube.com/watch?v=WMxdUmgJUfI
export default class YTdownloader extends React.Component {
    constructor (props) {
        super(props);
        this.state = {ready: false, downloading: false, percentage: 0};

        this.inputURL = React.createRef();

        this.YD = null;
        this.download = this.download.bind(this);
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

            let sanitizeName = function(name) {
                return name.replace(/[\/<>\|?\:"\*\\]/g, '');
            }

            self.YD.on('finished', function (err, data) {
                console.log(JSON.stringify(data));
                let oldPath = data.file;
                let sanitizedName = sanitizeName(data.videoTitle);
                let newPath = path.dirname(oldPath) + '/' + sanitizedName + '.mp3';
                let state = self.state;
                state.downloading = false;
                self.setState(state);
                self.inputURL.current.value = '';
                console.log('Renaming "' + oldPath + '" to "' + newPath + '"');
                fs.rename(oldPath, newPath, function(err) {
                    if ( err ) console.log('ERROR: ' + err);
                });
                self.props.db.addSongs([
                    {type: 'song', path: newPath, name: data.videoTitle, playlist: self.props.playlist},
                ]);
            });

            self.YD.on('error', function (error) {
                console.log(error);
            });

            self.YD.on('progress', function (progress) {
                let state = self.state;
                state.percentage = progress.progress.percentage;
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

    download () {
        if (this.props.playlist !== null) {
            let state = this.state;
            let regexRule = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
            let YTid = this.inputURL.current.value.match(regexRule);
            if (YTid !== null) {
                YTid = YTid[1];
                if (YTid.length === 11) {
                    const defaultDownloadName = 'download.tmp';
                    this.YD.download(YTid, defaultDownloadName);
                    state.downloading = true;
                    state.percentage = 0;
                    this.setState(state);
                }
            }
        } else {
            this.props.vex.dialog.alert(this.props.strings.select_playlist);
        }
    }

    render () {
        return (
            this.state.ready ?
                <div className="ytdownloadercontainer" style={this.props.style}>
                    <div className="form-group">
                        <label>{this.props.strings.ytdownload_explain}</label>
                        <input type="text" className="form-control"
                               placeholder={this.props.strings.ytdownload_instructions}
                               ref={this.inputURL}/>
                    </div>
                    <button className="btn btn-form btn-primary" onClick={this.download}
                            style={{display: this.state.downloading ? 'none' : 'block'}}>
                        {this.props.strings.download}
                    </button>
                    <div className="progress" style={{display: this.state.downloading ? 'block' : 'none'}}>
                        <div className={'c100 p' + Math.round(this.state.percentage)}>
                            <span>{Math.round(this.state.percentage)}</span>
                            <div className="slice">
                                <div className="bar"></div>
                                <div className="fill"></div>
                            </div>
                            <div className="back"></div>
                        </div>
                    </div>
                </div>
                : <span style={this.props.style}>{this.props.strings.ytdownload_loading}</span>
        );
    }
}
