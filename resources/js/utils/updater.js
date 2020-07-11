const os = require('os');
const mkdir = require('mkdirp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const unzipper = require('unzipper');
const semver = require('semver');
const {app} = require('electron').remote;
const isDev = require('electron-is-dev');

module.exports.updater = function (vex) {
    if (!isDev) {
        https.get(
            {
                host: 'api.github.com',
                path: '/repos/RgtArRr/AtomPlayer/releases/latest',
                headers: {'user-agent': 'atomplayer'},
            }, function (resp) {
                let data = '';
                resp.on('data', function (chunk) {
                    data += chunk;
                });
                resp.on('end', function () {
                    data = JSON.parse(data);
                    let version_release = data.tag_name.substr(1);
                    if (semver.gt(version_release, app.getVersion())) {
                        let update = data.assets.find((o) => o.name.indexOf(os.platform()) !== -1);
                        if (update) {
                            let file_tmp = app.getPath('downloads') + '/temp_atomplayer_update.zip';
                            let file = fs.createWriteStream(file_tmp);
                            https.get(update.browser_download_url, function (redirect) {
                                https.get(redirect.headers.location, function (response) {
                                    response.on('data', function (data) {
                                        file.write(data);
                                    }).on('end', function () {
                                        file.close(function () {
                                            let appPath = app.getPath('exe').split('/');
                                            appPath.pop();
                                            appPath = appPath.join('/');
                                            fs.createReadStream(file_tmp).
                                                pipe(unzipper.Parse()).
                                                on('entry', function (entry) {
                                                    let fileName = entry.path;
                                                    let type = entry.type;
                                                    if (type === 'File' && fileName.indexOf('resources/app') !== -1) {
                                                        let fullPath = appPath + '/' + path.dirname(fileName);
                                                        fileName = path.basename(fileName);
                                                        mkdir.sync(fullPath);
                                                        entry.pipe(fs.createWriteStream(fullPath + '/' + fileName));
                                                    } else {
                                                        entry.autodrain();
                                                    }
                                                }).
                                                promise().
                                                then(function () {
                                                    fs.unlinkSync(file_tmp);
                                                    vex.dialog.alert(strings.restart_required);
                                                }, function (e) {
                                                    console.log('error', e);
                                                });
                                        });
                                    });
                                });
                            });
                        } else {
                            vex.dialog.alert(strings.no_updates);
                        }
                    }
                });
            },
        ).on('error', (err) => {
            console.log('Error: ' + err.message);
        });
    }
};
