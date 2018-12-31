import React from 'react';
import { render } from 'react-dom';

const ipcRenderer = require('electron').ipcRenderer;
const {getKey} = require('./utils/keycode');

class Settings extends React.Component {

	constructor (props) {
		super(props);

		this.lastCallback = null;
		this.state = {pickKey: false, requireRestart: false;
	}
		;

		this.newKeyDown = this.newKeyDown.bind(this);
		this.getNextKey = this.getNextKey.bind(this);
	}

	componentDidMount () {
		let self = this;
		document.getElementsByTagName('body')[0].addEventListener('keydown', function (e) {
			e.preventDefault();
			if (e.keyCode !== 27) {
				if (getKey(e.keyCode)) {
					console.log(e.altKey, e.ctrlKey, e.shiftKey, e.keyCode, e.key);
					self.newKeyDown(
						((e.ctrlKey) ? 'Ctrl+' : '')
						+ ((e.shiftKey) ? 'Shift+' : '')
						+ ((e.altKey) ? 'Alt+' : '')
						+ getKey(e.keyCode),
					);
				}
			} else {
				self.newKeyDown('CLEAR');
			}
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

	render () {
		return (
			<div className="window">
				<header className="toolbar toolbar-header">
					<h1 className="title">Opciones</h1>
				</header>

				<div className="window-content">
					<h4>Botones/Shortcuts <span className="icon icon-keyboard"></span></h4>
					<div className="shortcutDiv">
						<span className="keyboard">F11</span>: Minimizar/Maximizar Reproductor
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" id="medianexttrack" onClick={this.changeShortCut}> </span>: Siguiente
						cancion
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" id="mediaprevioustrack"> </span>: Anterior cancion
					</div>
					<div className="shortcutDiv">
						<span className="keyboard" id="mediaplaypause"> </span>: Reproducir o Pausar la cancion
					</div>

					{/*<div className="shortcutDiv">*/}
					{/*<span className="keyboard" id="lyrics">Lyrics</span>: Activar lyrics (Beta).*/}
					{/*</div>*/}

					<div style={{display: this.state.pickKey ? 'block' : 'none'}}>
						Presiona la tecla a asignar.
					</div>
					<div style={{display: this.state.requireRestart ? 'block' : 'none'}}>
						Es necesario reiniciar la aplicacion.
					</div>
					{/*<div id="temp">Solo temporalmente.</div>*/}

					<button className="btn btn-default">Cerrar</button>
				</div>
				<footer className="toolbar toolbar-footer">
					<h1 className="title">Version: </h1>
				</footer>
			</div>
		);
	}
}

render((<Settings></Settings>),
	document.getElementById('root'),
);

/*






$ = jQuery = require("jquery");

  var db = new Database();
  db.init(function(){
    var config = db.getConfig()[0].values[0];
    //medianexttrack
    if(config[0] != 0){
      $("#medianexttrack").html(config[0]);
    }else{
      $("#medianexttrack").html("ELEGIR");
    }

    //mediaprevioustrack
    if(config[1] != 0){
      $("#mediaprevioustrack").html(config[1]);
    }else{
      $("#mediaprevioustrack").html("ELEGIR");
    }

    //mediaplaypause
    if(config[1] != 0){
      $("#mediaplaypause").html(config[2]);
    }else{
      $("#mediaplaypause").html("ELEGIR");
    }
  });

  $("#message").hide();
  $("#restart").hide();
  $("#temp").hide();

  var keydown = new keyUtil();

  $("#medianexttrack").click(function(){
    $("#message").show();
    keydown.getNextKey(function(key){
      if(key != "CLEAR"){
        $("#medianexttrack").html(key);
        db.setConfig("medianexttrack", key);
      }else{
        db.setConfig("medianexttrack", "0");
        $("#medianexttrack").html("ELEGIR");
      }
      $("#message").hide();
      $("#restart").show();
    });
  });

  $("#mediaprevioustrack").click(function(){
    $("#message").show();
    keydown.getNextKey(function(key){
      if(key != "CLEAR"){
        $("#mediaprevioustrack").html(key);
        db.setConfig("mediaprevioustrack", key);
      }else{
        db.setConfig("mediaprevioustrack", "0");
        $("#mediaprevioustrack").html("ELEGIR");
      }
      $("#message").hide();
      $("#restart").show();
    });
  });

  $("#mediaplaypause").click(function(){
    $("#message").show();
    keydown.getNextKey(function(key){
      if(key != "CLEAR"){
        $("#mediaplaypause").html(key);
        db.setConfig("mediaplaypause", key);
      }else{
        db.setConfig("mediaplaypause", "0");
        $("#mediaplaypause").html("ELEGIR");
      }
      $("#message").hide();
      $("#restart").show();
    });
  });

  $("#lyrics").click(function(){
    $("#lyrics").addClass("active-button");
    $("#temp").show();
    ipcRenderer.sendSync("activeLyrics", {});
  });

  $("footer h1.title").append(require('./package.json').version);

  $("#close").click(function(){
    window.close();
  });


  function keyUtil(){
    var self = this;
    this.key;
    this.lastCallback;

    $("body").keydown(function(e) {
      if(e.keyCode != 27){
        if(getKey(e.keyCode)){
          console.log(e.altKey, e.ctrlKey, e.shiftKey, e.keyCode, e.key);
          self.newKeyDown(((e.ctrlKey)?"Ctrl+":"")+((e.shiftKey)?"Shift+":"")+((e.altKey)?"Alt+":"")+getKey(e.keyCode));
        }
      }else{
        self.newKeyDown("CLEAR")
      }
      e.preventDefault();
    });

    this.getNextKey = function(callback){
      self.lastCallback = callback;
    };

    this.newKeyDown = function(key){
      if(self.lastCallback){
        self.lastCallback(key);
      }
      self.lastCallback = null;
    };

    this.getLastKey = function(){
      return this.key;
    };
  }
*/