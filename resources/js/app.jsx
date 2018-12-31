console.log(process.versions.electron);
import React from 'react';

import { render } from 'react-dom';

const http = require('http');
const fs = require('fs');
const {dialog} = require('electron').remote;
const {clipboard} = require('electron');
const ipcRenderer = require('electron').ipcRenderer;
const Database = require('./utils/database');
const {wk, rk} = require('./utils/WeakKey');
const vex = require('vex-js');
vex.registerPlugin(require('vex-dialog'));
vex.defaultOptions.className = 'vex-theme-os';

import SongList from './componets/SongList';
import PlayList from './componets/PlayList';
import Player from './componets/Player';
import YTdownloader from './componets/YTdownloader';

const db = new Database();

function MenuBoton (props) {
	return (
		<button className={'btn btn-' + props.class} onClick={() => { props.action(); }}>
			<span className={'icon icon-' + props.icon}> {props.text}</span>
		</button>
	);
}

class App extends React.Component {
	constructor (props) {
		super(props);
		this.state = {playlist: null, window: 'home'};

		this.childSongList = React.createRef();
		this.childPlayer = React.createRef();

		this.homeAction = this.homeAction.bind(this);
		this.donwloadAction = this.donwloadAction.bind(this);
		this.settingAction = this.settingAction.bind(this);

		this.folderAction = this.folderAction.bind(this);
		this.onChangePlayList = this.onChangePlayList.bind(this);
		this.ondblclickSong = this.ondblclickSong.bind(this);
		this.toggleWindowSize = this.toggleWindowSize.bind(this);
	}

	componentDidMount () {
		ipcRenderer.on('medianexttrack', function () {
			this.childPlayer.current.changeSong('next');
		});

		ipcRenderer.on('mediaplaypause', function () {
			this.childPlayer.current.play();
		});

		ipcRenderer.on('mediaprevioustrack', function () {
			this.childPlayer.current.changeSong('prev');
		});
	}

	homeAction () {
		let state = this.state;
		state.window = 'home';
		this.setState(state);
	}

	donwloadAction () {
		let state = this.state;
		state.window = 'download';
		this.setState(state);
	}

	settingAction () {
		ipcRenderer.sendSync('openSettings', {});
	}

	folderAction () {
		let self = this;
		if (self.state.playlist !== null) {
			dialog.showOpenDialog({
				title: 'Escoge una musica',
				properties: ['openFile', 'multiSelections'],
				filters: [{name: 'Canciones', extensions: ['mp3']}],
			}, function (e) {
				if (e) {
					let temp = [];
					e.forEach(function (k) {
						//TODO: support more audio extensions files
						//Check extension file
						if (k.substr(k.length - 4) === '.mp3') {
							let name = k.split(/(\\|\/)/g).pop();
							name = name.substr(0, name.length - 4);
							temp.push({type: 'song', path: k, name: name, playlist: self.state.playlist});
						}
					});
					db.addSongs(temp);
					self.childSongList.current.updateSongs();
				}
			});
		} else {
			vex.dialog.alert('Seleccione una playlist');
		}
	}

	onChangePlayList (_id) {
		let state = this.state;
		state.playlist = _id;
		this.setState(state, function () {
			//trigger for update song list
			this.childSongList.current.updateSongs();
		});
	}

	ondblclickSong (_id) {
		this.childPlayer.current.loadSong(_id);
	}

	toggleWindowSize () {
		ipcRenderer.sendSync('toogleMode', {});
	}

	render () {
		console.log('render app');
		return (
			[
				<header key={'main_toolbar'} className="toolbar toolbar-header" style={{WebkitAppRegion: 'drag'}}>
					<h1 className="title">AtomPlayer</h1>
					<div className="toolbar-actions">
						<div className="btn-group">
							<MenuBoton class="default" action={() => {this.homeAction();}} icon="home"/>
							<MenuBoton class="default" action={() => {this.folderAction();}} icon="folder"/>
							<MenuBoton class="default" action={() => {this.donwloadAction();}} icon="download"/>
						</div>
						{/*<MenuBoton class="default pull-right" action={this.homeAction()} icon="arrows-ccw"*/}
						{/*text={'Actualizar'}/>*/}
						<MenuBoton class="default pull-right" action={this.toggleWindowSize} icon="popup"/>
						<MenuBoton class="default pull-right" action={this.settingAction} icon="cog"/>
					</div>
				</header>,
				<div key={'main_playlist'} className="window-content" style={{height: '470px'}}>
					<div className="pane-group">
						<div className="pane pane-sm sidebar">
							<PlayList db={db} vex={vex} playlist={this.state.playlist}
							          onChangePlayList={this.onChangePlayList}/>
						</div>
						<div className="pane">
							<SongList db={db} vex={vex} playlist={this.state.playlist} ref={this.childSongList}
							          ondblclickSong={this.ondblclickSong}
							          style={{display: (this.state.window === 'home' ? 'block' : 'none')}}/>
							<YTdownloader db={db} vex={vex} playlist={this.state.playlist}
							              style={{display: (this.state.window === 'download' ? 'block' : 'none')}}/>
						</div>
					</div>
				</div>,
				<footer key={'main_footer'} className="toolbar toolbar-footer"
				        style={{minHeight: '75px', WebkitAppRegion: 'no-drag'}}>
					<button className="btn" id="toggleLyrics">
						<span className="icon icon-note-beamed"></span>&nbsp;Letras
					</button>
					<div className="toolbar-actions player">
						<Player db={db} ref={this.childPlayer} toggleWindowSize={this.toggleWindowSize}
						        songlist={this.childSongList}/>
					</div>
				</footer>,
			]

		);
	}
}

db.init(function () {
	render((<App></App>),
		document.getElementById('root'),
	);
});

//#########################OLD CODE. WILL BE REMOVE SOON

/*
var player = new Player();
player.draw($('.window-content'));

var tableList = new TableList();
tableList.draw($('#screen'));

var ytdownloader = new YTdownloader();
ytdownloader.draw($('#screen'));

var lyrics = new Lyrics();
lyrics.draw($('#screen'));

//Create Shortcuts listener and config
var config = db.getConfig()[0].values[0];
ipcRenderer.sendSync('registerShortcut',
	{'key': ((config[0] != 0) ? config[0] : 'medianexttrack'), 'channel': 'medianexttrack'});
ipcRenderer.sendSync('registerShortcut',
	{'key': ((config[1] != 0) ? config[1] : 'mediaprevioustrack'), 'channel': 'mediaprevioustrack'});
ipcRenderer.sendSync('registerShortcut',
	{'key': ((config[2] != 0) ? config[2] : 'mediaplaypause'), 'channel': 'mediaplaypause'});
if (config[3] == 1) {
	player.buttonShuffle.button.click();
}
player.audioPlayer.get(0).volume = config[4] / 10;
player.buttonVolume.range.val(config[4] / 10);
//-------------------------------------------------

ipcRenderer.on('medianexttrack', function () {
	player.nextSong();
});

ipcRenderer.on('mediaplaypause', function () {
	player.buttonPlay.button.click();
});

ipcRenderer.on('mediaprevioustrack', function () {
	player.previousSong();
});

var hasLyrics = false;
ipcRenderer.on('activeLyrics', function () {
	hasLyrics = true;
});

$(document).keydown(function (e) {
	switch (e.which) {
		case 122://F11
			ipcRenderer.sendSync('toogleMode', {});
			break;
		default:
			break;
	}
	e.preventDefault();
});
//################

$('#add_Song').click(function () {
	dialog.showOpenDialog({
		title: 'Escoge una musica',
		properties: ['openFile', 'multiSelections'],
		filters: [{name: 'Canciones', extensions: ['mp3']}],
	}, function (e) {
		if (e) {
			$.each(e, function (j, k) {
				//Check extension file
				if (k.substr(k.length - 4) == '.mp3') {
					var name = k.split('\\')[k.split('\\').length - 1];
					name = name.substr(0, name.length - 4);
					db.addSong(name, k, 1);
					$('#playlist_default').click();
				}
			});
		}
	});
});

$('#home').click(function () {
	toggleView('playlist');
});

$('#download').click(function () {
	toggleView('ytdownload');
});

$('#minimize').click(function () {
	ipcRenderer.sendSync('toogleMode', {});
});

$('#settings').click(function () {
	ipcRenderer.sendSync('openSettings', {});
});

$('#toggleLyrics').click(function () {
	$('#toggleLyrics').toggleClass('btn-active');
	if ($('#toggleLyrics').hasClass('btn-active')) {
		toggleView('lyrics');
		lyrics.search_lyrics(player.songTitle.html(), player.lastIdSong);
	} else {
		toggleView('playlist');
	}
});

ipcRenderer.on('registerLyrics', function (event, data) {
	db.setLyrics(data.id_song, data.url);
});

//Temporal Playlist event
//******
var menu = null;
//------

$('#playlist_default').click(function () {
	$('#canciones').html('');
	var songs = db.getSongs(1);
	if (songs[0]) {
		$.each(songs[0].values, function (j, k) {
			var tr = createNode('tr');
			var td1 = createNode('td', {style: 'width:80%;'});
			var td2 = createNode('td', {style: 'width:20%; text-align: left;'});
			if (k[1].length > 63) {
				k[1] = k[1].substr(0, 63) + '...';
			}
			td1.html(k[1]);
			td2.html(sectostr(k[3]));
			tr.append(td1);
			tr.append(td2);
			tr.dblclick(function () {
				player.load('file:///' + k[2], k[0], k[1]);
			});
			tr.contextmenu(function (e) {
				e.preventDefault();
				if (menu) {
					menu.destroy();
				}
				menu = new ContextMenu();
				menu.draw(e,
					//Play
					function () {
						player.load('file:///' + k[2], k[0], k[1]);
					},
					//Delete
					function () {
						if (confirm('Estas seguro que quieres eliminar la cancion?')) {
							if (confirm('Eliminar tambien el archivo?')) {
								fs.unlink(k[2], function (err) {
									if (err) {
										return console.log(err);
									}
								});
							}
							db.deleteSong(k[0]);
							//Delete dom element
							tr.remove();
							//-----------------
						}
					},
					//renameCallback
					function () {
						var newName = prompt('Cambiar de nombre', k[1]);
						if (newName != null) {
							db.updateNameSong(k[0], newName);
							if (newName.length > 63) {
								newName = newName.substr(0, 63) + '...';
							}
							k[1] = newName;
							td1.html(newName);
						}
					},
				);
			});
			tr.data('id_song', k[0]);
			$('#canciones').append(tr);
		});
		//Change view
		toggleView('playlist');
	}
});

//Load playlist rdy
$('#playlist_default').click();

$('#update').click(function () {
	updater();
});

$('html').on('click', function () {
	if (menu) {
		menu.destroy();
	}
});

//----------------------

function ContextMenu () {
	var self = this;

	this.menu = createNode('div', {class: 'menu'});
	this.ul = createNode('ul');
	this.itemPlay = createNode('li', {html: 'Play'});
	this.itemAddToPlayList = createNode('li', {html: 'Add to PlayList (Soon)'});
	this.itemRename = createNode('li', {html: 'Rename'});
	this.itemDelete = createNode('li', {html: 'Delete'});

	this.ul.append(this.itemPlay);
	this.ul.append(this.itemAddToPlayList);
	this.ul.append(this.itemRename);
	this.ul.append(this.itemDelete);
	this.menu.append(this.ul);

	this.draw = function (event, playCallback, deleteCallback, renameCallback) {
		var pageX = event.pageX;
		var pageY = event.pageY;
		this.menu.css({top: pageY, left: pageX});

		var mwidth = this.menu.width();
		var mheight = this.menu.height();
		var screenWidth = $(window).width();
		var screenHeight = $(window).height();
		var scrTop = $(window).scrollTop();
		if (pageX + mwidth > screenWidth) {
			this.menu.css({left: pageX - mwidth});
		}
		if (pageY + mheight > screenHeight + scrTop) {
			this.menu.css({top: pageY - mheight});
		}

		this.itemPlay.click(function () {
			playCallback();
		});

		this.itemDelete.click(function () {
			deleteCallback();
		});

		this.itemRename.click(function () {
			renameCallback();
		});

		this.itemAddToPlayList.click(function () {
			//Soon
		});

		$('body').append(this.menu);
	};

	this.destroy = function () {
		this.menu.remove();
	};
}

function TableList () {
	var self = this;

	this.tableHeader = {head: createNode('table'), body: createNode('tr')};
	this.tableHeader.head.append(this.tableHeader.body);
	this.tableHeader.body.append(createNode('th', {html: 'Nombre', style: 'width: 80%'}));
	this.tableHeader.body.append(createNode('th', {html: 'Duracion', style: 'width: 20%'}));

	this.tableBody = {
		head: createNode('table', {class: 'table-striped'}),
		body: createNode('tbody', {id: 'canciones'}),
	};
	this.tableBody.head.append(this.tableBody.body);

	this.divContainer = createNode('div', {class: 'table-wrapper fill'});
	this.divContainer.append(this.tableHeader.head);
	this.divContainer.append(this.tableBody.head);

	this.draw = function (element) {
		element.append(this.divContainer);
	};

	this.loadPlayList = function (id) {
		//load soon
	};
}

function Player () {
	var self = this;

	this.lastIdSong = 0;
	this.lastVolume = 0;
	this.seekPlayer = {status: 0};
	this.audioPlayer = createNode('audio', {id: 'player-audio'});

	this.buttonPrevious = {
		button: createNode('button', {class: 'btn'}),
		icon: createNode('span', {class: 'icon icon-to-start'}),
	};
	this.buttonPrevious.button.html(this.buttonPrevious.icon);

	this.buttonPlay = {
		button: createNode('button', {class: 'btn playButton'}),
		icon: createNode('span', {class: 'icon icon-play circle_button'}),
	};
	this.buttonPlay.button.html(this.buttonPlay.icon);

	this.buttonNext = {
		button: createNode('button', {class: 'btn'}),
		icon: createNode('span', {class: 'icon icon-to-end'}),
	};
	this.buttonNext.button.html(this.buttonNext.icon);

	this.buttonShuffle = {
		button: createNode('button', {class: 'btn'}),
		icon: createNode('span', {class: 'icon icon-shuffle'}),
	};
	this.buttonShuffle.button.html(this.buttonShuffle.icon);

	this.buttonVolume = {
		button: createNode('button', {class: 'btn'}),
		icon: createNode('span', {class: 'icon icon-sound'}),
		range: createNode('input',
			{class: 'volumen_range', type: 'range', min: '0', max: '1', value: '1', step: '0.1'}),
	};
	this.buttonVolume.button.append(this.buttonVolume.icon);
	this.buttonVolume.button.append(this.buttonVolume.range);
	this.buttonVolume.range.hide();

	this.buttonMaximize = {
		button: createNode('button', {class: 'btn maximize', style: 'display: none;'}),
		icon: createNode('span', {class: 'icon icon-window'}),
	};
	this.buttonMaximize.button.append(this.buttonMaximize.icon);

	this.songTitle = createNode('span', {class: 'song_title'});

	this.progressBar = {
		container: createNode('ul', {id: 'progress_song'}),
		currentTime: createNode('li', {html: '0:00'}),
		totalTime: createNode('li', {html: '-:-'}),
		progress: createNode('progress', {value: 0, max: 1, style: 'width: 90%'}),
	};
	this.progressBar.container.append(this.progressBar.currentTime);
	this.progressBar.container.append(this.progressBar.progress);
	this.progressBar.container.append(this.progressBar.totalTime);

	this.draw = function (element) {
		this.audioPlayer.bind('loadedmetadata', function (e) {
			var duration = Math.round(e.target.duration);
			db.updateDuratioSong(self.lastIdSong, duration);
			//Update doom
			$.each($('#canciones').find('tr'), function (j, k) {
				if ($(k).data('id_song') == self.lastIdSong) {
					$($(k).find('td')[1]).html(sectostr(duration));
				}
			});
			self.progressBar.totalTime.html(sectostr(duration));
		});

		this.audioPlayer.bind('timeupdate', function (e) {
			if (self.seekPlayer.status == 1) {
				self.audioPlayer.get(0).currentTime = self.seekPlayer.value * this.duration;
				self.seekPlayer = {status: 0};
			}
			//Temporalmente desactivado
			//ipcRenderer.send("scrollLyrics", {"value": Math.round(this.currentTime / this.duration*100)});
			self.progressBar.progress.attr('value', this.currentTime / this.duration);
			self.progressBar.currentTime.html(sectostr(Math.round(this.currentTime)));
		});

		this.progressBar.progress.click(function (e) {
			var percent = e.offsetX / this.offsetWidth;
			self.seekPlayer = {status: 1, value: percent};
		});

		this.audioPlayer.bind('ended', function (e) {
			self.nextSong();
		});

		this.buttonPlay.button.click(function () {
			if (self.audioPlayer.get(0).src == '') {
				return;
			}
			if (self.buttonPlay.icon.hasClass('icon-play')) {
				self.play();
				return;
			}
			if (self.buttonPlay.icon.hasClass('icon-pause')) {
				self.pause();
				return;
			}
		});

		this.buttonPrevious.button.click(function () {
			self.previousSong();
		});

		this.buttonNext.button.click(function () {
			self.nextSong();
		});

		this.buttonVolume.icon.click(function () {
			self.buttonVolume.icon.toggleClass('icon-sound');
			self.buttonVolume.icon.toggleClass('icon-mute');
			if (self.lastVolume != 0) {
				self.audioPlayer.get(0).volume = self.lastVolume;
				self.buttonVolume.range.val(self.lastVolume);
				self.lastVolume = 0;
				db.setConfig('volume', self.lastVolume * 10);
			} else {
				self.lastVolume = self.audioPlayer.get(0).volume;
				self.audioPlayer.get(0).volume = 0;
				self.buttonVolume.range.val(0);
				db.setConfig('volume', 0);
			}
		});

		this.buttonVolume.button.hover(
			function () {
				self.buttonVolume.range.show();
			},
			function () {
				self.buttonVolume.range.hide();
			},
		);

		this.buttonVolume.range.on('change mousemove', function (e) {
			if (self.buttonVolume.icon.hasClass('icon-sound')) {
				if (self.lastVolume != e.target.value) {
					self.audioPlayer.get(0).volume = e.target.value;
					self.lastVolume = e.target.value;
					db.setConfig('volume', e.target.value * 10);
				}
			}
		});

		this.buttonVolume.range.mouseout(function () {
			if (self.buttonVolume.icon.hasClass('icon-sound')) {
				self.lastVolume = 0;
			}
		});

		this.buttonShuffle.button.click(function () {
			self.buttonShuffle.button.toggleClass('btn-active');
			if (self.buttonShuffle.button.hasClass('btn-active')) {
				db.setConfig('shuffle', '1');
			} else {
				db.setConfig('shuffle', '0');
			}
		});

		this.buttonMaximize.button.click(function () {
			ipcRenderer.sendSync('toogleMode', {});
		});

		$('.player').append(this.progressBar.container);

		$('.player').append(this.buttonPrevious.button);
		$('.player').append(this.buttonPlay.button);
		$('.player').append(this.buttonNext.button);
		$('.player').append(this.buttonShuffle.button);
		$('.player').append(this.buttonVolume.button);
		$('.player').append(this.buttonMaximize.button);
		$('.player').append(this.songTitle);
		element.append(this.audioPlayer);
	};

	this.load = function (file, id_song, title) {
		this.audioPlayer.get(0).src = file;
		this.audioPlayer.get(0).load();
		this.play();
		this.lastIdSong = id_song;
		this.songTitle.html(title);

		//Each song elements for highlight current song
		$.each($('#canciones').find('tr'), function (j, k) {
			$(k).removeClass('currentSong');
			if ($(k).data('id_song') == id_song) {
				$(k).addClass('currentSong');
			}
		});

		if ($('#toggleLyrics').hasClass('btn-active')) {
			lyrics.search_lyrics(title, id_song);
		}
	};

	this.nextSong = function () {
		var song;
		if (self.buttonShuffle.button.hasClass('btn-active')) {
			song = db.getRandomSong(self.lastIdSong);
		} else {
			var tempsong = db.getNextSong(self.lastIdSong);
			if (tempsong[0]) {
				song = tempsong[0].values[0];
			}
		}

		if (song) {
			this.load(song[2], song[0], song[1]);
			console.log('Siguiente cancion');
		}
	};

	this.previousSong = function () {
		var song;
		if (self.buttonShuffle.button.hasClass('btn-active')) {
			song = db.getRandomSong(self.lastIdSong);
		} else {
			var tempsong = db.getPreviousSong(self.lastIdSong);
			if (tempsong[0]) {
				song = tempsong[0].values[0];
			}
		}

		if (song) {
			this.load(song[2], song[0], song[1]);
			console.log('Siguiente Anterior');
		}
	};

	this.play = function () {
		this.audioPlayer.get(0).play();
		this.buttonPlay.icon.removeClass('icon-play');
		this.buttonPlay.icon.addClass('icon-pause');
	};

	this.pause = function () {
		this.audioPlayer.get(0).pause();
		this.buttonPlay.icon.removeClass('icon-pause');
		this.buttonPlay.icon.addClass('icon-play');
	};
}

//-----------------------------------------------------
var lastUrl = '';
setInterval(function () {
	if (!ytdownloader.isDownload) {
		if (clipboard.readText() != lastUrl) {
			var url = urlObject({'url': clipboard.readText()});
			var idvideo = null;
			switch (url.hostname) {
				case 'www.youtube.com':
				case 'youtube.com':
					idvideo = url.parameters['v'];
					break;
				case 'www.youtu.be':
				case 'youtu.be':
					idvideo = url.pathname.split('/')[1];
					break;
				default:
			}
			if (idvideo) {
				ytdownloader.input.input.val(clipboard.readText());
				lastUrl = clipboard.readText();
			}
		}
	}
}, 1000);

*/
//-----------------------------------------------------

//SPA, cambiar de vistas
// function toggleView (vista) {
// 	ytdownloader.divContainer.hide();
// 	tableList.divContainer.hide();
// 	lyrics.container.tools.element.hide();
// 	lyrics.container.lyrics.element.hide();
// 	lyrics.container.search_lyrics.element.hide();
// 	if (vista == 'playlist') {
// 		tableList.divContainer.show();
// 		return;
// 	}
// 	if (vista == 'ytdownload') {
// 		ytdownloader.divContainer.show();
// 		return;
// 	}
// 	if (vista == 'lyrics') {
// 		lyrics.container.tools.element.show();
// 		lyrics.container.lyrics.element.show();
// 		lyrics.container.search_lyrics.element.hide();
// 	}
// }

// toggleView('playlist');

//Evento cuando se borra un elemento
// (function ($) {
// 	$.event.special.destroyed = {
// 		remove: function (o) {
// 			if (o.handler) {
// 				o.handler();
// 			}
// 		},
// 	};
// })(jQuery);

//"Resposive"
// $(window).on('resize', function () {
// 	var win = $(this);
// 	var viewportWidth = win.width();
// 	var viewportHeight = win.height();
// 	if (viewportHeight > 0) {
// 	}
// });
// $(window).trigger('resize');

//Ejecutar inmediatamente una funcion
function setNewInterval (fn, delay) {
	fn();
	return setInterval(fn, delay);
}
