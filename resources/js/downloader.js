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
	this.isDownload = false;

	this.draw = function(element){
		this.barProgress.main.hide();

		this.barProgress.back.click(function(){
			self.iscancelled = true;
			self.isDownload = false;
			self.input.input.val("");
			self.toogleView();
		});

		this.button.click(function(){
			self.isDownload = true;
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
					//Sacamos todos los caracteres que Windows no permite
					result[3] = result[3].replace("/","").replace("\\","").replace(":","").replace("*","").replace("?","").replace("\"","").replace("|","").replace("<","").replace(">","").replace("?","");
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
							file.end();
							if(!self.iscancelled){
								db.addSong(result[3], path+".mp3", 1);
								self.barProgress.back.html("Descargar otro");
								console.log("finish");
							}else{
								fs.unlink(path +".mp3", function(err){
									if(err) return console.log(err);
								});
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
function convert2mp3(idvideo, callback){
	$.get("http://api.convert2mp3.cc/check.php?api=true&v="+idvideo+"&h="+Math.floor(35e5*Math.random()),function(t){
		var o=t.split("|");
		if(o[0]=="OK"){
			callback(o);
		}else{
			if((o[0] == "ERROR" && o[1] == "PENDING") || (o[0] == "DOWNLOAD")){
				sleep(3000);
				convert2mp3(idvideo, callback);
				ytdownloader.barProgress.back.html("Preparando la descarga");
			}else{
				ytdownloader.barProgress.back.html("Ha ocurrido un error");
			}
		}
	});
	//return"OK"==o[0]?void(top.location.href="http://dl"+o[1]+".downloader.space/dl.php?id="+o[2]):void(("ERROR"!=o[0]||1!=o[1]&&5!=o[1])&&setTimeout("convert2mp3(t)",5e3))
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
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
