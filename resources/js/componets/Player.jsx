import React from 'react';

export default class Player extends React.Component {
	constructor (props) {
		super(props);
	}

	componentDidMount () {
	}

	componentWillUnmount () {
	}

	render () {
		return (
			[
				<div className="player">
					<ul id="progress_song">
						<li>0:00</li>
						<progress value="0" max="1" style={{width: '90%'}}></progress>
						<li>-:-</li>
					</ul>
					<button className="btn"><span className="icon icon-to-start"></span></button>
					<button className="btn playButton"><span className="icon icon-play circle_button"></span></button>
					<button className="btn"><span className="icon icon-to-end"></span></button>
					<button className="btn"><span className="icon icon-shuffle"></span></button>
					<button className="btn">
						<span className="icon icon-sound"></span>
						<input className="volumen_range" type="range" min="0" max="1" step="0.1"
						       style={{display: 'none'}}/>
					</button>
					<button className="btn maximize" style={{display: 'none'}}>
						<span className="icon icon-window"></span>
					</button>
					<span className="song_title"></span>
				</div>,
				<audio src=""></audio>,
			]
		);
	}
}