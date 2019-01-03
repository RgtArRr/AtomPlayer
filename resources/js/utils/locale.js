const LocalizedStrings = require('localized-strings').default;
const {app} = require('electron').remote;

let languaje = app.getLocale();
languaje = languaje.indexOf('-') !== -1 ? languaje.substr(0, 2) : languaje;
languaje = (languaje !== 'end' && languaje !== 'es') ? 'en' : languaje;
let strings = new LocalizedStrings({
	en: {
		choose_song: 'Pick a music file',
		song: 'Songs',
		select_playlist: 'Select a playlist',
		download: 'Download',
		ytdownload_loading: 'Wait until we finish to set up this feature',
		ytdownload_explain: 'Download .mp3 music file from YouTube',
		ytdownload_instructions: 'Paste a link from YouTube here',
		name_playlist: 'Playlist name',
		id_required: 'Is required',
		confirm_playlist_delete: 'Are you sure to delete {0}, and the songs it contains?',
		confirm_song_delete: 'Are you sure to delete {0} from Song list?',
		rename: 'Rename',
		delete: 'Delete',
		table_name: 'Name',
		table_duration: 'Length',
		settings_title: 'Settings',
		settings_section_1: 'Shortcuts',
		min_max_player: 'Minimize / Maximize Player',
		next_song: 'Next song',
		prev_song: 'Previous Song',
		play_song: 'Play or Pause current song',
		settings_instructions_key: 'Press a key or combination of key to asing.',
		restart_required: 'Restart the application',
		close_window: 'Close',

	},
	es: {
		choose_song: 'Escoge una musica',
		song: 'Canciones',
		select_playlist: 'Seleccione una playlist',
		download: 'Descargar',
		ytdownload_loading: 'Espere hasta que terminemos de configurar.',
		ytdownload_explain: 'Descargar musica en .mp3 de YouTube',
		ytdownload_instructions: 'Copie un enlace de youtube aqui',
		name_playlist: 'Nombre de playlist',
		id_required: 'Es requerido',
		confirm_playlist_delete: 'Desea eliminar {0}, ademas del listado de canciones que contiene?',
		confirm_song_delete: 'Desea eliminar {0} del listado de canciones?',
		rename: 'Renombrar',
		delete: 'Eliminar',
		name_song: 'Nombre de Cancion',
		table_name: 'Nombre',
		table_duration: 'Duración',
		settings_title: 'Opciones',
		settings_section_1: 'Atajos de teclado',
		min_max_player: 'Minimizar / Maximizar Reproductor',
		next_song: 'Siguiente cancion',
		prev_song: 'Anterior cancion',
		play_song: 'Reproducir o Pausar la cancion',
		settings_instructions_key: 'Presiona una tecla o combinacion de teclas para asignar.',
		restart_required: 'Es necesario reiniciar la aplicacion.',
		close_window: 'Cerrar',
	},
});

strings.setLanguage(languaje);

module.exports.strings = strings;
