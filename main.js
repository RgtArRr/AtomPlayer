const electron = require('electron');
const {app, globalShortcut, BrowserWindow} = electron;
const isDev = require('electron-is-dev');
const Datastore = require('nedb');
const ElectronGoogleOAuth2 = require('@getstation/electron-google-oauth2').default;
const Store = require('electron-store');
const store = new Store();
const {google} = require('googleapis');
const fs = require('fs');
const log = require('electron-log');
Object.assign(console, log.functions);

const ipcMain = electron.ipcMain;

let win;

function createWindow () {
    let options = {
        icon: __dirname + '/icono.png',
        width: 800,
        height: 600,
        resizable: false,
        useContentSize: true,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
        },
    };
    if (process.platform === 'darwin') {
        options.titleBarStyle = 'hidden';
    } else {
        options.frame = false;
    }
    win = new BrowserWindow(options);
    win.loadURL(`file://${__dirname}/index.html`);

    if (isDev) {
        win.webContents.openDevTools();
    }

    win.on('closed', () => {
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
        console.log(win.getSize());
        if (win.getSize()[0] >= 800 && win.getSize()[1] >= 600) {
            win.setBounds({x: width - 400, y: height - 75, width: 400, height: 75});
            win.setAlwaysOnTop(true);
        } else {
            win.setBounds({x: Math.round(width / 2 - 400), y: Math.round(height / 2 - 300), width: 800, height: 600});
            win.setAlwaysOnTop(false);
        }
        eventRet.returnValue = '1';
    });

    //Open Settings Window
    ipcMain.on('openSettings', function (eventRet, arg) {
        let settingsWindow = new BrowserWindow({
            parent: win,
            width: 500,
            height: 400,
            show: false,
            resizable: false,
            movable: false,
            alwaysOnTop: false,
            frame: false,
            webPreferences: {
                nodeIntegration: true,
                webSecurity: false,
            },
        });
        settingsWindow.loadURL(`file://${__dirname}/settings.html`);
        settingsWindow.show();
        //settingsWindow.webContents.openDevTools();
        settingsWindow.on('closed', function () {
            settingsWindow = null;
        });
        eventRet.returnValue = '1';
    });

    //Register shortcut
    ipcMain.on('registerShortcut', function (event, arg) {
        let response = '1';
        try {
            let shortcut = globalShortcut.register(arg.key, () => {
                win.webContents.send(arg.channel, true);
            });
            if (!shortcut) {
                response = '0';
                console.log('shortcut failed ' + arg.key);
            }
        }
        catch (err) {
            response = '0';
            console.log(err);
        }
        event.returnValue = response;
    });

    const myApiOauth = new ElectronGoogleOAuth2(
        '673660021225-lom90c3pjekvrsft7bue09bnb5qhlpmk.apps.googleusercontent.com',
        'P4HGxRy7kwgdP9cxOL0anTfx',
        ['https://www.googleapis.com/auth/drive.file'],
    );

    ipcMain.on('AuthWithGoogle', function (event, arg) {
        myApiOauth.openAuthWindowAndGetTokens().then(token => {
            if (token.refresh_token) {
                store.set('refresh_token', token.refresh_token);
            }
        });
        event.returnValue = 0;
    });

    ipcMain.on('checkLogin', function (event, arg) {
        myApiOauth.oauth2Client.getAccessToken().then(() => {
            event.returnValue = true;
        }).catch(() => {
            event.returnValue = false;
        });
    });

    ipcMain.on('getDataFromDrive', function (event, arg) {
        const drive = google.drive({
            version: 'v3',
            auth: myApiOauth.oauth2Client,
        });
        drive.files.list().then((res) => {
            let files = res.data.files;
            if (files.length) {
                let id = files[0].id;
                drive.files.get({
                    fileId: id,
                    mimeType: 'text/plain',
                    alt: 'media',
                }, {
                    responseType: 'text',
                }).then((res) => {
                    event.returnValue = JSON.parse(res.data);
                }).catch((e) => {
                    event.returnValue = null;
                    console.log('getdata', e);
                });
            } else {
                event.returnValue = null;
            }
        });
    });

    ipcMain.on('saveDataToDrive', function (event, arg) {
        let drive = google.drive({
            version: 'v3',
            auth: myApiOauth.oauth2Client,
        });

        let create = (id) => {
            let requestBody = {
                name: 'atomplayer.store',
                mimeType: 'text/plain',
            };
            if (id !== null) {
                console.log('update file');
                drive.files.update({
                    fileId: id,
                    requestBody: requestBody,
                    media: {
                        mimeType: 'text/plain',
                        body: JSON.stringify(arg.data),
                    },
                }).then((res) => {
                    console.log('savedata update', res);
                }).catch(((err) => {
                    console.log('savedata update', err);
                }));
            } else {
                console.log('create file');
                drive.files.create({
                    requestBody: requestBody,
                    media: {
                        mimeType: 'text/plain',
                        body: JSON.stringify(arg.data),
                    },
                }).then((res) => {
                    console.log('savedata create', res);
                }).catch(((err) => {
                    console.log('savedata create', err);
                }));
            }

        };

        drive.files.list().then((res) => {
            let files = res.data.files;
            if (files.length) {
                console.log(files[0].id);
                create(files[0].id);
            } else {
                create(null);
            }
        });

        event.returnValue = 1;
    });

    ipcMain.on('logout', function (event, arg) {
        console.log('logout');
        myApiOauth.oauth2Client.revokeCredentials().then((res) => {
            console.log(res);
            event.returnValue = 0;
        }).catch((err) => {
            console.log(err);
            event.returnValue = 0;
        });
    });

    if (store.get('refresh_token')) {
        myApiOauth.setTokens({refresh_token: store.get('refresh_token')});
    }

    myApiOauth.on('tokens', (tokens) => {
        if (tokens.refresh_token) {
            store.set('refresh_token', tokens.refresh_token);
            win.webContents.send('login', true);
        }
        if (tokens.scope && tokens.scope.indexOf('https://www.googleapis.com/auth/drive.file') === -1) {
            myApiOauth.oauth2Client.revokeCredentials().then(() => {
                win.webContents.send('login', false);
            });
        }
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        createWindow();
    }
});

//For experimental features
let options = [
    'enable-experimental-web-platform-features',
    ['js-flags'],
];

for (var i = 0; i < options.length; ++i) {
    if (typeof options[i] === 'string') {
        app.commandLine.appendSwitch(options[i]);
    } else {
        app.commandLine.appendSwitch(options[i][0], options[i][1]);
    }
}

//database filesystem
let mainDB = app.getPath('userData') + '/db/main.store';
const globalAny = global;
globalAny.db = new Datastore({filename: mainDB, timestampData: true});
