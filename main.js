const electron = require('electron');
const {app, globalShortcut, BrowserWindow} = electron;

const ipcMain = electron.ipcMain;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function createWindow () {
	// Create the browser window.
	let options = {
		icon: __dirname + '/icono.png', width: 800, height: 600, resizable: false, webPreferences: {
			nodeIntegration: true,
		},
	};
	if (process.platform === 'darwin') {
		options.titleBarStyle = 'hidden';
	} else {
		options.frame = false;
	}
	win = new BrowserWindow(options);

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`);

	// Open the DevTools.
	win.webContents.openDevTools();

	//https://electronjs.org/docs/tutorial/devtools-extension
	BrowserWindow.addDevToolsExtension("/Users/kennethobregon/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/3.4.3_0")

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});

	win.on('minimize', function () {
		if (win.getSize()[0] === 386 && win.getSize()[1] === 75) {
			win.show();
		}
	});

	let {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
	//Toogle Basic and full mode
	ipcMain.on('toogleMode', function (eventRet, arg) {
		if (win.getSize()[0] === 800 && win.getSize()[1] === 600) {
			win.setBounds({x: width - 386, y: height - 75, width: 400, height: 75});
			win.setAlwaysOnTop(true);
		} else {
			win.setBounds({x: Math.round(width / 2 - 400), y: Math.round(height / 2 - 300), width: 800, height: 600});
			win.setAlwaysOnTop(false);
		}
		eventRet.returnValue = '1';
	});

	//Open Settings Window
	var settingsWindow;
	ipcMain.on('openSettings', function (eventRet, arg) {
		// var settingsWindow = new BrowserWindow({
		// 	parent: win,
		// 	width: 500,
		// 	height: 400,
		// 	show: false,
		// 	resizable: false,
		// 	movable: false,
		// 	alwaysOnTop: false,
		// 	frame: false,
		// });
		// settingsWindow.loadURL(`file://${__dirname}/settings.html`);
		// settingsWindow.show();
		// settingsWindow.webContents.openDevTools();
		// settingsWindow.on('closed', function () {
		// 	settingsWindow = null;
		// });
		eventRet.returnValue = '1';
	});

	//Register shortcut
	ipcMain.on('registerShortcut', function (event, arg) {
		// console.log(arg.key, arg.channel);
		// var response = '1';
		// try {
		// 	var shortcut = globalShortcut.register(arg.key, () => {
		// 		win.webContents.send(arg.channel, true);
		// 	});
		// 	if (!shortcut) {
		// 		response = '0';
		// 		console.log('shortcut failed' + arg[0]);
		// 	}
		// }
		// catch (err) {
		// 	response = '0';
		// 	console.log(err);
		// }
		// event.returnValue = response;
	});
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null) {
		createWindow();
	}
});

//For experimental features
var options = [
	//'enable-tcp-fastopen',
	//'enable-experimental-canvas-features',
	'enable-experimental-web-platform-features',
	//'enable-overlay-scrollbars',
	//'enable-hardware-overlays',
	//'enable-universal-accelerated-overflow-scroll',
	//'allow-file-access-from-files',
	//'allow-insecure-websocket-from-https-origin',
	['js-flags'],
];

for (var i = 0; i < options.length; ++i) {
	if (typeof options[i] === 'string') {
		app.commandLine.appendSwitch(options[i]);
	} else {
		app.commandLine.appendSwitch(options[i][0], options[i][1]);
	}
}
