/* Ask local .. program */

const {ipcRenderer} = require('electron');

const spawn = require('child_process').spawn;

const path = require('path');

/* Path config */
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreWin32 = path.join(__dirname, 'core/et.go.exe');
const coreCfg = path.join(__dirname, 'core/config/client.conf');

/* Child process */
let prc = null;

/* Output textarea */
var output = document.getElementById('output');

/* Clicked auth button */
document.getElementById('auth').addEventListener('click', function () {
	output.value = "";
	if (prc != null) prc.kill();
	if (process.platform == 'linux')
		prc = spawn(coreLinux, ['ask', 'local', 'auth', coreCfg]);
	else
		prc = spawn(coreWin32, ['ask', 'local', 'auth', coreCfg]);
	prc.stdout.on('data', (data) => {
		output.value += data.toString();
	});
});

/* Clicked ping button */
document.getElementById('ping').addEventListener('click', function () {
	output.value = "";
	if (prc != null) prc.kill();
	if (process.platform == 'linux')
		prc = spawn(coreLinux, ['ask', 'local', 'ping', coreCfg]);
	else
		prc = spawn(coreWin32, ['ask', 'local', 'ping', coreCfg]);
	prc.stdout.on('data', (data) => {
		output.value += data.toString();
	});
});

/* Clicked close button */
document.getElementById('clsbtn').addEventListener('click', function () {
	ipcRenderer.send('close-ask');
});