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
