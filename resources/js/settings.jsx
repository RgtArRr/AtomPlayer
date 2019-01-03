import React from 'react';
import { render } from 'react-dom';

const ipcRenderer = require('electron').ipcRenderer;
const {getKey} = require('./utils/keycode');
const Database = require('./utils/database');
const {strings} = require('./utils/locale');

const db = new Database();

class Settings extends React.Component {

	constructor (props) {
		super(props);

		this.lastCallback = null;
		this.state = {
			pickKey: false,
			requireRestart: false,
			medianexttrack: null,
			mediaplaypause: null,
			mediaprevioustrack: null,
		};

		this.newKeyDown = this.newKeyDown.bind(this);
		this.getNextKey = this.getNextKey.bind(this);
		this.changeShortCut = this.changeShortCut.bind(this);
	}

	componentDidMount () {
		let self = this;
		document.getElementsByTagName('body')[0].addEventListener('keydown', function (e) {
			e.preventDefault();
			if (e.keyCode !== 27) {
				if (getKey(e.keyCode)) {
					console.log(e.altKey, e.ctrlKey, e.shiftKey, e.keyCode, e.key);
					self.newKeyDown(
						((e.ctrlKey) ? 'Ctrl+' : '') +
						((e.shiftKey) ? 'Shift+' : '') +
						((e.altKey) ? 'Alt+' : '') +
						getKey(e.keyCode),
					);
				}
			} else {
				self.newKeyDown('CLEAR');
			}
		});
		db.getConfig(function (docs) {
			console.log(docs);
			let state = self.state;
			let temp;
			temp = docs.find(o => o.identifier === 'medianexttrack');
			state.medianexttrack = temp ? temp.value : null;
			temp = docs.find(o => o.identifier === 'mediaplaypause');
			state.mediaplaypause = temp ? temp.value : null;
			temp = docs.find(o => o.identifier === 'mediaprevioustrack');
			state.mediaprevioustrack = temp ? temp.value : null;
			self.setState(state);
		});
	}

	getNextKey (callback) {
		this.lastCallback = callback;
	};

	newKeyDown (key) {
		if (this.lastCallback) {
			this.lastCallback(key);
		}
		this.lastCallback = null;
	}

	changeShortCut (type) {
		let self = this;
		let state = self.state;
		this.getNextKey(function (key) {
			let finalKey = key !== 'CLEAR' ? key : null;
			db.changeConfig(type, finalKey, function () {
				state[type] = finalKey;
				state.pickKey = false;
				state.requireRestart = true;
				self.setState(state);
			});
		});

		state.pickKey = true;
		self.setState(state);
	}

	render () {
		return (
			<div className="window">
				<header className="toolbar toolbar-header">
					<h1 className="title">{strings.settings_title}</h1>
				</header>

				<div className="window-content">
					<h4>{strings.settings_section_1} <span className="icon icon-keyboard"></span></h4>
					<div className="shortcutDiv">
						<span className="keyboard">F11</span>: {strings.min_max_player}
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" onClick={() => {this.changeShortCut('medianexttrack');}}>
							{(this.state.medianexttrack === null) ? 'ELEGIR' : this.state.medianexttrack}
						</span>: {strings.next_song}
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" onClick={() => {this.changeShortCut('mediaprevioustrack');}}>
							{(this.state.mediaprevioustrack === null) ? 'ELEGIR' : this.state.mediaprevioustrack}
						</span>: {strings.prev_song}
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" onClick={() => {this.changeShortCut('mediaplaypause');}}>
							{(this.state.mediaplaypause === null) ? 'ELEGIR' : this.state.mediaplaypause}
						</span>: {strings.plat_song}
					</div>

					{/*<div className="shortcutDiv">*/}
					{/*<span className="keyboard" id="lyrics">Lyrics</span>: Activar lyrics (Beta).*/}
					{/*</div>*/}

					<div style={{display: this.state.pickKey ? 'block' : 'none'}}>
						<b>{strings.settings_instructions_key}</b>
					</div>
					<div style={{display: this.state.requireRestart ? 'block' : 'none', color: 'red'}}>
						{strings.restart_required}
					</div>
					{/*<div id="temp">Solo temporalmente.</div>*/}

					<button className="btn btn-default" onClick={() => {window.close();}}>{strings.close_window}</button>
				</div>
				<footer className="toolbar toolbar-footer">
					<h1 className="title">Version: </h1>
				</footer>
			</div>
		);
	}
}

db.init(function () {
	render((<Settings></Settings>),
		document.getElementById('root'),
	);
});