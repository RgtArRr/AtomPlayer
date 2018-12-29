import React from 'react';

var path = require('path');
const {app} = require('electron').remote;
const YoutubeMp3Downloader = require('youtube-mp3-downloader');
const ffmpeg = require('ffmpeg-static-electron');

//https://www.youtube.com/watch?v=WMxdUmgJUfI
export default class YTdownloader extends React.Component {
	constructor (props) {
		super(props);
		this.YD = null;
		this.download = this.download.bind(this);
	}

	componentDidMount () {
		console.log(require.resolve('ffmpeg-static-electron'));
		console.log(path.resolve('node_modules/ffmpeg-static-electron/' + ffmpeg.path));
		this.YD = new YoutubeMp3Downloader({
			'ffmpegPath': path.resolve('node_modules/ffmpeg-static-electron/' + ffmpeg.path),
			'outputPath': app.getPath('music'),
			'youtubeVideoQuality': 'highest',
			'queueParallelism': 1,
			'progressTimeout': 500,
		});

		this.YD.on('finished', function (err, data) {
			console.log(JSON.stringify(data));
		});

		this.YD.on('error', function (error) {
			console.log(error);
		});

		this.YD.on('progress', function (progress) {
			console.log(JSON.stringify(progress));
		});
	}

	componentWillUnmount () {
	}

	download () {
		this.YD.download('WMxdUmgJUfI');
	}

	render () {
		return (

			<div className="ytdownloadercontainer">
				<div className="form-group"><label>Descargar musica en .mp3 de YouTube</label>
					<input type="text" className="form-control" placeholder="Copie un link de youtube aqui"/>
				</div>
				<button className="btn btn-form btn-primary" onClick={this.download}>Descargar</button>
				<div className="progress">
					<div className="c100"><span></span>
						<div className="slice">
							<div className="bar"></div>
							<div className="fill"></div>
						</div>
						<div className="back"></div>
					</div>
				</div>
			</div>
		);
	}
}
