console.log(process.versions.electron);
var http = require('http');
var sql = require('sql.js');
var fs = require('fs');
$ = jQuery = require("jquery");
const {dialog} = require('electron').remote;
const {clipboard} = require('electron');
const ipcRenderer = require('electron').ipcRenderer;

var db = new Database();
db.init();

var player = new Player();
player.draw($(".window-content"));

var tableList = new TableList();
tableList.draw($("#screen"));

var ytdownloader = new YTdownloader();
ytdownloader.draw($("#screen"));

//Shortcuts listener
ipcRenderer.on("medianexttrack", function(){
	player.nextSong();
});

ipcRenderer.on("mediaplaypause", function(){
	player.buttonPlay.button.click();
});

ipcRenderer.on("mediaprevioustrack", function(){
	player.previousSong();
});

$(document).keydown(function(e) {
	 switch(e.which) {
		 case 122://F11
		 	ipcRenderer.sendSync('toogleMode', {});
			break;
		 default:
		 	break;
	 }
	  e.preventDefault();
});
//################

$("#add_Song").click(function(){
	dialog.showOpenDialog({title: "Escoge una musica", properties: ['openFile', 'multiSelections'],  filters: [{name: 'Canciones', extensions: ['mp3']},]}, function(e){
		if(e){
			$.each(e, function(j,k){
				//Check extension file
				if(k.substr(k.length - 4) == ".mp3"){
					var name = k.split("\\")[k.split("\\").length - 1];
					name = name.substr(0, name.length-4);
					db.addSong(name, k, 1);
					$("#playlist_default").click();
				}
			});
		}
});
});

$("#home").click(function(){
	toogleView("playlist");
});

$("#download").click(function(){
	toogleView("ytdownload");
});

$("#minimize").click(function(){
	ipcRenderer.sendSync('toogleMode', {});
});

$("#settings").click(function(){
	ipcRenderer.sendSync('openSettings', {});
});


//Temporal Playlist event
//******
var menu = null;
//------

$("#playlist_default").click(function(){
	$("#canciones").html("");
	var songs = db.getSongs(1);
	if(songs[0]){
		$.each(songs[0].values, function(j,k){
			var tr = createNode("tr");
			var td1 = createNode("td", {style: "width:80%;"});
			var td2 = createNode("td", {style: "width:20%; text-align: left;"});
			if(k[1].length > 63){
				k[1] = k[1].substr(0, 63) + "...";
			}
			td1.html(k[1]);
			td2.html(sectostr(k[3]));
			tr.append(td1);
			tr.append(td2);
			tr.dblclick(function(){
				player.load("file:///"+k[2], k[0], k[1]);
			});
			tr.contextmenu(function(e) {
				e.preventDefault();
				if(menu){
					menu.destroy();
				}
				menu = new ContextMenu();
				menu.draw(e,
					//Play
					function(){
						player.load("file:///"+k[2], k[0], k[1]);
					},
					//Delete
					function(){
						if(confirm("Estas seguro que quieres eliminar la cancion?")){
							if(confirm("Eliminar tambien el archivo?")){
								fs.unlink(k[2], function(err){
									if(err) return console.log(err);
								});
							}
							db.deleteSong(k[0]);
							//Delete dom element
							tr.remove();
							//-----------------
						}
					},
					//renameCallback
					function(){
						var newName = prompt("Cambiar de nombre", k[1]);
						if(newName != null){
							db.updateNameSong(k[0], newName);
							if(newName.length > 63){
								newName = newName.substr(0, 63) + "...";
							}
							k[1] = newName;
							td1.html(newName);
						}
					}
				);
			});
			tr.data("id_song", k[0]);
			$("#canciones").append(tr);
		});
		//Change view
		toogleView("playlist");
	}
});

//Load playlist rdy
$("#playlist_default").click();

$("#update").click(function(){
	updater();
});

$("html").on("click", function(){
	if(menu){
		menu.destroy();
	}
});
//----------------------


function ContextMenu(){
	var self = this;

	this.menu = createNode("div", {class: "menu"});
	this.ul = createNode("ul");
	this.itemPlay = createNode("li", {html: "Play"});
	this.itemAddToPlayList = createNode("li", {html: "Add to PlayList (Soon)"});
	this.itemRename = createNode("li", {html: "Rename"});
	this.itemDelete = createNode("li", {html: "Delete"});

	this.ul.append(this.itemPlay);
	this.ul.append(this.itemAddToPlayList);
	this.ul.append(this.itemRename);
	this.ul.append(this.itemDelete);
	this.menu.append(this.ul);


	this.draw = function(event, playCallback, deleteCallback, renameCallback){
		var pageX = event.pageX;
		var pageY = event.pageY;
		this.menu.css({top: pageY , left: pageX});

		var mwidth = this.menu.width();
		var mheight = this.menu.height();
		var screenWidth = $(window).width();
		var screenHeight = $(window).height();
		var scrTop = $(window).scrollTop();
		if(pageX+mwidth > screenWidth){
			this.menu.css({left:pageX-mwidth});
		}
		if(pageY+mheight > screenHeight+scrTop){
			this.menu.css({top:pageY-mheight});
		}

		this.itemPlay.click(function(){
			playCallback();
		});

		this.itemDelete.click(function(){
			deleteCallback();
		});

		this.itemRename.click(function(){
			renameCallback();
		});

		this.itemAddToPlayList.click(function(){
			//Soon
		});

		$("body").append(this.menu);
	}

	this.destroy = function(){
		this.menu.remove();
	}
}

function TableList(){
	var self = this;

	this.tableHeader = {head: createNode("table"), body:  createNode("tr")};
	this.tableHeader.head.append(this.tableHeader.body);
	this.tableHeader.body.append(createNode("th", {html: "Nombre", style: "width: 80%"}));
	this.tableHeader.body.append(createNode("th", {html: "Duracion", style: "width: 20%"}));

	this.tableBody = {head: createNode("table", {class: "table-striped"}), body: createNode("tbody", {id: "canciones"})};
	this.tableBody.head.append(this.tableBody.body);

	this.divContainer = createNode("div", {class: "table-wrapper fill"});
	this.divContainer.append(this.tableHeader.head);
	this.divContainer.append(this.tableBody.head);

	this.draw = function(element){
		element.append(this.divContainer);
	}

	this.loadPlayList = function(id){
		//load soon
	}
}

function Player(){
	var self = this;

	this.lastIdSong = 0;
	this.lastVolume = 0;
	this.seekPlayer = {status: 0}
	this.audioPlayer = createNode("audio", {id: "player-audio"});

	this.buttonPrevious = {button: createNode("button", {class: "btn"}), icon: createNode("span", {class: "icon icon-to-start"})};
	this.buttonPrevious.button.html(this.buttonPrevious.icon);

	this.buttonPlay = {button: createNode("button", {class: "btn playButton"}), icon: createNode("span", {class: "icon icon-play circle_button"})};
	this.buttonPlay.button.html(this.buttonPlay.icon);

	this.buttonNext = {button: createNode("button", {class: "btn"}), icon: createNode("span", {class: "icon icon-to-end"})};
	this.buttonNext.button.html(this.buttonNext.icon);

	this.buttonShuffle = {button: createNode("button", {class: "btn"}), icon: createNode("span", {class: "icon icon-shuffle"})};
	this.buttonShuffle.button.html(this.buttonShuffle.icon);

	this.buttonVolume = {button: createNode("button", {class: "btn"}), icon: createNode("span", {class: "icon icon-sound"}), range: createNode("input", {class: "volumen_range", type: "range", min: "0", max: "1", value: "1", step: "0.1"})};
	this.buttonVolume.button.append(this.buttonVolume.icon);
	this.buttonVolume.button.append(this.buttonVolume.range);
	this.buttonVolume.range.hide();

	this.buttonMaximize = {button: createNode("button", {class: "btn maximize", style: "display: none;"}), icon: createNode("span", {class: "icon icon-window"})};
	this.buttonMaximize.button.append(this.buttonMaximize.icon);

	this.songTitle = createNode("span", {class: "song_title"});

	this.progressBar = {container: createNode("ul", {id: "progress_song"}), currentTime: createNode("li", {html : "0:00"}), totalTime: createNode("li", {html : "-:-"}), progress : createNode("progress", {value: 0, max: 1, style: "width: 90%"})};
	this.progressBar.container.append(this.progressBar.currentTime);
	this.progressBar.container.append(this.progressBar.progress);
	this.progressBar.container.append(this.progressBar.totalTime);

	this.draw = function (element){
		this.audioPlayer.bind("loadedmetadata", function(e){
			var duration = Math.round(e.target.duration);
			db.updateDuratioSong(self.lastIdSong, duration);
			//Update doom
			$.each($("#canciones").find("tr"), function(j,k){
				if($(k).data("id_song") == self.lastIdSong){
					$($(k).find("td")[1]).html(sectostr(duration));
				}
			});
			self.progressBar.totalTime.html(sectostr(duration));
		});

		this.audioPlayer.bind("timeupdate", function(e){
			if(self.seekPlayer.status == 1){
				self.audioPlayer.get(0).currentTime = self.seekPlayer.value * this.duration;
				self.seekPlayer = {status : 0};
			}
			self.progressBar.progress.attr("value", this.currentTime / this.duration);
			self.progressBar.currentTime.html(sectostr(Math.round(this.currentTime)));
		});

		this.progressBar.progress.click(function(e){
			var percent = e.offsetX / this.offsetWidth;
			self.seekPlayer = {status: 1, value: percent};
		});

		this.audioPlayer.bind("ended", function(e){
			self.nextSong();
		});

		this.buttonPlay.button.click(function(){
			if(self.audioPlayer.get(0).src == ""){
				return;
			}
			if(self.buttonPlay.icon.hasClass("icon-play")){
				self.play();
				return;
			}
			if(self.buttonPlay.icon.hasClass("icon-pause")){
				self.pause();
				return;
			}
		});

		this.buttonPrevious.button.click(function(){
			self.previousSong();
		});

		this.buttonNext.button.click(function(){
			self.nextSong();
		});

		this.buttonVolume.icon.click(function(){
			self.buttonVolume.icon.toggleClass("icon-sound");
			self.buttonVolume.icon.toggleClass("icon-mute");
			if(self.lastVolume != 0){
				self.audioPlayer.get(0).volume = self.lastVolume;
				self.buttonVolume.range.val(self.lastVolume);
				self.lastVolume = 0;
			}else{
				self.lastVolume = self.audioPlayer.get(0).volume;
				self.audioPlayer.get(0).volume = 0;
				self.buttonVolume.range.val(0);
			}
		});

		this.buttonVolume.button.hover(
			function () {
				self.buttonVolume.range.show();
			},
			function () {
				self.buttonVolume.range.hide();
			}
		);

		this.buttonVolume.range.on("change mousemove", function(e){
			if(self.buttonVolume.icon.hasClass("icon-sound")){
				if(self.lastVolume != e.target.value){
					self.audioPlayer.get(0).volume = e.target.value;
					self.lastVolume = e.target.value;
				}
			}
		});

		this.buttonVolume.range.mouseout(function(){
			if(self.buttonVolume.icon.hasClass("icon-sound")){
				self.lastVolume = 0;
			}
		});

		this.buttonShuffle.button.click(function(){
			self.buttonShuffle.button.toggleClass("btn-active");
		});

		this.buttonMaximize.button.click(function(){
			ipcRenderer.sendSync('toogleMode', {});
		})

		$(".player").append(this.progressBar.container);

		$(".player").append(this.buttonPrevious.button);
		$(".player").append(this.buttonPlay.button);
		$(".player").append(this.buttonNext.button);
		$(".player").append(this.buttonShuffle.button);
		$(".player").append(this.buttonVolume.button);
		$(".player").append(this.buttonMaximize.button);
		$(".player").append(this.songTitle);
		element.append(this.audioPlayer);
	};

	this.load = function(file, id_song, title){
		this.audioPlayer.get(0).src= file;
		this.audioPlayer.get(0).load();
		this.play();
		this.lastIdSong = id_song;
		this.songTitle.html(title);

		//Each song elements for highlight current song
		$.each($("#canciones").find("tr"), function(j,k){
			$(k).removeClass("currentSong");
			if($(k).data("id_song") == id_song){
				$(k).addClass("currentSong");
			}
		});
	};

	this.nextSong = function(){
		var song;
		if(self.buttonShuffle.button.hasClass("btn-active")){
			song = db.getRandomSong(self.lastIdSong);
		} else {
			var tempsong = db.getNextSong(self.lastIdSong);
			if(tempsong[0]){
				song = tempsong[0].values[0];
			}
		}

		if(song){
			this.load(song[2], song[0], song[1]);
			console.log("Siguiente cancion");
		}
	};

	this.previousSong = function(){
		var song;
		if(self.buttonShuffle.button.hasClass("btn-active")){
			song = db.getRandomSong(self.lastIdSong);
		} else {
			var tempsong = db.getPreviousSong(self.lastIdSong);
			if(tempsong[0]){
				song = tempsong[0].values[0];
			}
		}

		if(song){
			this.load(song[2], song[0], song[1]);
			console.log("Siguiente Anterior");
		}
	}

	this.play = function(){
		this.audioPlayer.get(0).play();
		this.buttonPlay.icon.removeClass("icon-play");
		this.buttonPlay.icon.addClass("icon-pause");
	};

	this.pause = function(){
		this.audioPlayer.get(0).pause();
		this.buttonPlay.icon.removeClass("icon-pause");
		this.buttonPlay.icon.addClass("icon-play");
	};
}

//-----------------------------------------------------
var lastUrl = ""
setInterval(function(){
	if(clipboard.readText() != lastUrl){
		var url = urlObject({"url" : clipboard.readText()});
		var idvideo = null;
		switch(url.hostname) {
			case "www.youtube.com":
			case "youtube.com":
			idvideo = url.parameters["v"];
			break;
			case "www.youtu.be":
			case "youtu.be":
			idvideo = url.pathname.split("/")[1];
			break;
			default:
		}
		if(idvideo){
			ytdownloader.input.input.val(clipboard.readText());
			lastUrl = clipboard.readText();
		}
	}
}, 1000);
//-----------------------------------------------------

//Utilidad para generar html
function createNode(etiqueta, attr) {
	var node = $("<" + etiqueta + "></" + etiqueta + ">");
	if (attr) {
		$.each(attr, function(j,k){
			if(j === "html"){
				node.html(k);
				return;
			}
			if(j === "val"){
				node.val(k);
				return;
			}
			node.attr(j, k);
		});
	}
	return node;
}

//SPA, cambiar de vistas
function toogleView(vista) {
	if (vista == "playlist") {
		tableList.divContainer.show();
		ytdownloader.divContainer.hide();
		return;
	}
	if(vista == "ytdownload"){
		tableList.divContainer.hide();
		ytdownloader.divContainer.show();
		return;
	}
}
toogleView("playlist");

//Evento cuando se borra un elemento
(function ($) {
	$.event.special.destroyed = {
		remove: function (o) {
			if (o.handler) {
				o.handler();
			}
		}
	};
})(jQuery);


//"Resposive"
$(window).on('resize', function () {
	var win = $(this);
	var viewportWidth = win.width();
	var viewportHeight = win.height();
	if (viewportHeight > 0) {
	}
});
$(window).trigger('resize');

function convert2mp3(t, callback){
	$.get("http://api.convert2mp3.cc/check.php?api=true&v="+t+"&h="+Math.floor(35e5*Math.random()),function(t){
		var o=t.split("|");
		if(o[0]=="OK"){
			callback(o);
		}else{
			ytdownloader.barProgress.back.html("Intentalo de nuevo");
			console.log("Intentalo de nuevo: ERROR API", o);
			//console.log("http://dl"+o[1]+".downloader.space/dl.php?id="+o[2]);
		}
	});
	//return"OK"==o[0]?void(top.location.href="http://dl"+o[1]+".downloader.space/dl.php?id="+o[2]):void(("ERROR"!=o[0]||1!=o[1]&&5!=o[1])&&setTimeout("convert2mp3(t)",5e3))
}

function urlObject(options) {
	"use strict";
	/*global window, document*/

	var url_search_arr,
	option_key,
	i,
	urlObj,
	get_param,
	key,
	val,
	url_query,
	url_get_params = {},
	a = document.createElement('a'),
	default_options = {
		'url': window.location.href,
		'unescape': true,
		'convert_num': true
	};

	if (typeof options !== "object") {
		options = default_options;
	} else {
		for (option_key in default_options) {
			if (default_options.hasOwnProperty(option_key)) {
				if (options[option_key] === undefined) {
					options[option_key] = default_options[option_key];
				}
			}
		}
	}

	a.href = options.url;
	url_query = a.search.substring(1);
	url_search_arr = url_query.split('&');

	if (url_search_arr[0].length > 1) {
		for (i = 0; i < url_search_arr.length; i += 1) {
			get_param = url_search_arr[i].split("=");

			if (options.unescape) {
				key = decodeURI(get_param[0]);
				val = decodeURI(get_param[1]);
			} else {
				key = get_param[0];
				val = get_param[1];
			}

			if (options.convert_num) {
				if (val.match(/^\d+$/)) {
					val = parseInt(val, 10);
				} else if (val.match(/^\d+\.\d+$/)) {
					val = parseFloat(val);
				}
			}

			if (url_get_params[key] === undefined) {
				url_get_params[key] = val;
			} else if (typeof url_get_params[key] === "string") {
				url_get_params[key] = [url_get_params[key], val];
			} else {
				url_get_params[key].push(val);
			}

			get_param = [];
		}
	}

	urlObj = {
		protocol: a.protocol,
		hostname: a.hostname,
		host: a.host,
		port: a.port,
		hash: a.hash.substr(1),
		pathname: a.pathname,
		search: a.search,
		parameters: url_get_params
	};

	return urlObj;
}

function timeSince(date) {
	var seconds = Math.floor((new Date() - date) / 1000);
	var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
	if (seconds < 5) {
		return "ahora";
	} else if (seconds < 60) {
		return "hace " + seconds + " segundos";
	} else if (seconds < 3600) {
		minutes = Math.floor(seconds / 60);
		if (minutes > 1) {
			return "hace " + minutes + " minutos";
		} else {
			return "hace 1 minuto";
		}
	} else if (seconds < 86400) {
		hours = Math.floor(seconds / 3600);
		if (hours > 1) {
			return "hace " + hours + " horas";
		} else {
			return "hace 1 hora";
		}
	} else if (seconds < 172800) {
		days = Math.floor(seconds / 86400);
		if (days > 1) {
			return "hace" + days + " dias";
		} else {
			return "hace 1 dia";
		}
	} else {
		return date.getDate().toString() + " " + months[date.getMonth()] + ", " + date.getFullYear();
	}
}

function sectostr(time) {
	return ~~(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60;
}


//Ejecutar inmediatamente una funcion
function setNewInterval(fn, delay) {
	fn();
	return setInterval(fn, delay);
}
