import React from 'react';

const path = require('path');
const {app} = require('electron').remote;
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const os = require('os');
const fs = require('fs');

var ffbinaries = require('ffbinaries');

console.log(app.getAppPath());

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
		let ffmpegPath = app.getAppPath() + '/ffmpeg' + (os.platform() === 'win32' ? '.exe' : '');
		let setupDownloader = function () {
			self.YD = new YoutubeMp3Downloader({
				'ffmpegPath': ffmpegPath,
				'outputPath': app.getPath('music'),
				'youtubeVideoQuality': 'highest',
				'queueParallelism': 1,
				'progressTimeout': 500,
			});

			self.YD.on('finished', function (err, data) {
				console.log(JSON.stringify(data));
				let state = self.state;
				state.downloading = false;
				self.setState(state);
				self.inputURL.current.value = '';
				self.props.db.addSongs([
					{type: 'song', path: data.file, name: data.videoTitle, playlist: self.props.playlist},
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
				destination: app.getAppPath(),
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
					this.YD.download(YTid);
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
						<input type="text" className="form-control" placeholder={this.props.ytdownload_instructions}
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
