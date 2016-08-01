console.log(process.versions.electron);
var http = require('http');
var sql = require('sql.js');
var fs = require('fs');
$ = jQuery = require("jquery");
const {dialog} = require('electron').remote;
const {clipboard} = require('electron');

var db = new Database();
db.init();

var player = new Player();
player.draw($(".window-content"));

var tableList = new TableList();
tableList.draw($("#screen"));

var ytdownloader = new YTdownloader();
ytdownloader.draw($("#screen"));

$("#add_Song").click(function(){
	dialog.showOpenDialog({title: "Escoge una musica",  filters: [{name: 'Canciones', extensions: ['mp3']},]}, function(e){
		var tr = createNode("tr");
		var td1 = createNode("td");
		var td2 = createNode("td");
		var buttonPlay = createNode("button");
		buttonPlay.html("Play");
		buttonPlay.click(function(){
			player.load("file:///"+e[0]);
		});
		td1.append(e[0].split("\\")[e[0].split("\\").length-1]);
		td2.append(buttonPlay);
		tr.append(td2);
		tr.append(td1);
		$("#canciones").append(tr);
	});
});

$("#home").click(function(){
	toogleView("playlist");
});

$("#download").click(function(){
	toogleView("ytdownload");
});

//Temporal Playlist event
$("#playlist_default").click(function(){
	$("#canciones").html("");
	var songs = db.getSongs(1);
	if(songs[0]){
		$.each(songs[0].values, function(j,k){
			var tr = createNode("tr");
			var td1 = createNode("td");
			var td2 = createNode("td");
			var buttonPlay = createNode("button");
			buttonPlay.html("Play");
			buttonPlay.click(function(){
				player.load("file:///"+k[2], k[0], k[1]);
			});
			td1.append(k[1]);
			td2.append(buttonPlay);
			tr.append(td2);
			tr.append(td1);
			$("#canciones").append(tr);
		});
	}
});

$("#update").click(function(){
	updater();
});
//----------------------


function YTdownloader(){
	var self = this;
	//Cambiar variable por URLinput
	this.input = {div: createNode("div", {class: "form-group"}), label: createNode("label", {html: "Descargar musica en .mp3 de YouTube"}), input : createNode("input", {type: "text", class: "form-control", placeholder: "Copie un link de youtube aqui"})};
	this.input.div.append(this.input.label);
	this.input.div.append(this.input.input);

	this.button = createNode("button", {class: "btn btn-form btn-primary", html: "Descargar"});

	this.barProgress = {container: createNode("div", {"class":"progress"}), main: createNode("div", {class: "c100"}), title: createNode("span"),back: createNode("div", {"class": "back"}), comp1: createNode("div", {class: "slice"}), comp2: createNode("div", {class: "bar"}), comp3: createNode("div", {class: "fill"})}
	this.barProgress.comp1.append(this.barProgress.comp2);
	this.barProgress.comp1.append(this.barProgress.comp3);
	this.barProgress.main.append(this.barProgress.title);
	this.barProgress.main.append(this.barProgress.comp1);
	this.barProgress.main.append(this.barProgress.back);
	this.barProgress.container.append(this.barProgress.main);

	this.divContainer = createNode("div", {"class": "ytdownloadercontainer"});
	this.divContainer.append(this.input.div);
	this.divContainer.append(this.button);
	this.divContainer.append(this.barProgress.container);

	this.iscancelled = false;

	this.draw = function(element){
		this.barProgress.main.hide();

		this.barProgress.back.click(function(){
			self.iscancelled = true;
			self.input.input.val("");
			self.toogleView();
		});

		this.button.click(function(){
			var url = urlObject({"url" : self.input.input.val()});
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
				console.log("No es una url de YouTube");
			}
			if(idvideo){
				self.toogleView();
				self.iscancelled = false;
				//Reset barprogress
				self.barProgress.main.removeClass();
				self.barProgress.main.addClass("c100");
				self.barProgress.title.html("0%");
				//----------------
				convert2mp3(idvideo, function(result){
					self.barProgress.back.html("Cancelar descarga");
					//Quitamos el # cuando hay caracteres especiales
					result[3] = result[3].replace("#", "");
					//----------------------------------------------

					//Obtener nombre del archivo, si existen duplicados
					var b = true;
					var name = app.getPath("music")+"/"+result[3];
					var path = name;
					var cont = 1;
					while(b){
						if(!fs.existsSync(path +".mp3")){
							b= false;
						}else{
							path = name + " [" + cont + "]";
							cont++;
						}
					}
					//-------------------------------------------------
					var file = fs.createWriteStream(path +".mp3");
					var request = http.get("http://dl"+result[1]+".downloader.space/dl.php?id="+result[2], function(response) {
						var len = parseInt(response.headers['content-length'], 10);
						var cur = 0;
						var total = len / 1048576; //1048576 - bytes in  1Megabyte
						response.on("data", function(chunk) {
							file.write(chunk);
							cur += chunk.length;
							self.updateProgress((100.0 * cur / len).toFixed());
							if(self.iscancelled){
								response.destroy();
							}
							//console.log("Downloading " + (100.0 * cur / len).toFixed(2) + "% " + (cur / 1048576).toFixed(2) + " mb" + ".Total: " + total.toFixed(2) + " mb");
						});

						response.on("end", function() {
							if(!self.iscancelled){
								file.end();
								db.addSong(result[3], path+".mp3", 1);
								self.barProgress.back.html("Descargar otro");
								console.log("finish");
							}else{
								file.emit('close');
								self.iscancelled = false;
								console.log("Ha sido cancelado");
							}
						});

						request.on("error", function(e){
							self.failedDownload();
							console.log("Download error: " + e.message);
						});
					});
				});
			}else{
				self.failedDownload();
			}
		});
		element.append(this.divContainer);
	};

	this.toogleView = function(){
		if(this.barProgress.main.is(":visible")){
			this.barProgress.main.hide();
			this.input.div.show();
			this.button.show();
		}else{
			this.barProgress.main.show();
			this.input.div.hide();
			this.button.hide();
		}
	};

	this.failedDownload = function(){
		self.barProgress.back.html("Intentar nuevamente");
	};

	this.updateProgress = function(percent){
		self.barProgress.main.removeClass();
		self.barProgress.main.addClass("c100");
		self.barProgress.main.addClass("p"+percent);
		self.barProgress.title.html(percent+"%");
	};
}

function TableList(){
	var self = this;

	this.tableHeader = {head: createNode("table"), body:  createNode("tr")};
	this.tableHeader.head.append(this.tableHeader.body);
	this.tableHeader.body.append(createNode("th"));
	this.tableHeader.body.append(createNode("th", {html: "Nombre"}));
	this.tableHeader.body.append(createNode("th", {html: "Duracion"}));

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

	this.songTitle = createNode("span", {class: "song_title"});

	this.progressBar = {container: createNode("ul", {id: "progress_song"}), currentTime: createNode("li", {html : "0:00"}), totalTime: createNode("li", {html : "-:-"}), progress : createNode("progress", {value: 0, max: 1, style: "width: 90%"})};
	this.progressBar.container.append(this.progressBar.currentTime);
	this.progressBar.container.append(this.progressBar.progress);
	this.progressBar.container.append(this.progressBar.totalTime);

	this.draw = function (element){

		this.audioPlayer.bind("loadedmetadata", function(e){
			self.progressBar.totalTime.html(sectostr(Math.round(e.target.duration)));
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

		this.buttonShuffle.button.click(function(){
			if(self.buttonShuffle.button.hasClass("active")){
				self.buttonShuffle.button.removeClass("active");
			}else{
				self.buttonShuffle.button.addClass("active");
			}
		});

		$(".player").append(this.progressBar.container);
		$(".player").append(this.buttonPrevious.button);
		$(".player").append(this.buttonPlay.button);
		$(".player").append(this.buttonNext.button);
		$(".player").append(this.buttonShuffle.button);
		$(".player").append(this.songTitle);
		element.append(this.audioPlayer);
	};

	this.load = function(file, id_song, title){
		this.audioPlayer.get(0).src= file;
		this.audioPlayer.get(0).load();
		this.play();
		this.lastIdSong = id_song;
		this.songTitle.html(title);
	};

	this.nextSong = function(){
		var song;
		if(self.buttonShuffle.button.hasClass("active")){
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
		if(self.buttonShuffle.button.hasClass("active")){
			song = db.getRandomSong(self.lastIdSong);
		} else {
			song = db.getPreviousSong(self.lastIdSong);
			if(tempsong[0]){
				song = tempsong[0].values[0];
			}
		}

		if(song[0]){
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
