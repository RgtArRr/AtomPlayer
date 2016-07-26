const {remote} = require('electron');
const {Menu, MenuItem} = remote;

var menu = new Menu();
menu.append(new MenuItem({
  label: 'Buscar actualizaciones',
  click: function() {
    updater();
  }
}));

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  menu.popup(remote.getCurrentWindow());
}, false);
