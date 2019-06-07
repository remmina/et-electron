/* Ask local .. program */

const {ipcRenderer} = require('electron');
const {app} = require('electron').remote;

const spawn = require('child_process').spawn;

const path = require('path');
const fs = require('fs');

/* Path config */
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreLinux_32 = path.join(__dirname, 'core/et.go.32.linux');
const coreWin = path.join(__dirname, 'core/et.go.exe');
const coreWin_32 = path.join(__dirname, 'core/et.go.32.exe');
const coreDarwin_32 =  path.join(__dirname, 'core/et.go');
const configPath = process.platform == 'darwin' ? path.join(app.getPath('userData'), 'conf') : __dirname;
const coreCfg = path.join(configPath, 'core/config/client.conf');

let corePath = null;

if(process.platform == 'darwin'){
	corePath = coreDarwin_32
}
else if (process.platform == 'linux')
{
	if (process.arch == 'x64') corePath = coreLinux;
	else corePath = coreLinux_32;
}
else
{
	if (process.arch == 'x64') corePath = coreWin;
	else corePath = coreWin_32;
}

/* Child process */
let prc = null;

/* Output textarea */
var output = document.getElementById('output');

/* Clicked auth button */
document.getElementById('auth').addEventListener('click', function () {
	output.value = "";
	if (prc != null) prc.kill();
	prc = spawn(corePath, ['check', 'auth', '-c', coreCfg]);
	prc.stdout.on('data', (data) => {
		output.value += data.toString();
	});
	prc.stderr.on('data', (data) => {
		// for debug
		console.log(data.toString())
	})
});

/* Clicked version button */
document.getElementById('vers').addEventListener('click', function () {
	output.value = "";
	if (prc != null) prc.kill();
	prc = spawn(corePath, ['check', 'version', '-c', coreCfg]);
	prc.stdout.on('data', (data) => {
		output.value += data.toString();
	});
});

/* Clicked ping button */
document.getElementById('ping').addEventListener('click', function () {
	output.value = "";
	if (prc != null) prc.kill();
	prc = spawn(corePath, ['check', 'ping', '-c', coreCfg]);
	prc.stdout.on('data', (data) => {
		output.value += data.toString();
	});
});

/* Clicked close button */
document.getElementById('clsbtn').addEventListener('click', function () {
	ipcRenderer.send('close-ask');
});
