/* Main program of et-electron */

const {app, BrowserWindow, Menu, Tray, ipcMain, dialog} = require('electron');

const path = require('path');

const fs = require('fs');

const spawn = require('child_process').spawn;

const appVersion = '1.5.0';

let prc = null; /* et.go process */

let win = null; /* main window */

let askwin = null; /* ask window */

/* Path config */
const iconPath = path.join(__dirname, 'img/256x256.png');
const autoPath = path.join(__dirname, 'config/auto.conf');
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreWin32 = path.join(__dirname, 'core/et.go.exe');
const coreCfg = path.join(__dirname, 'core/config/client.conf');

/* Show a message box */
function msg(str)
{
	const options =
	{
		type: 'info',
		title: '提示',
		message: str,
		buttons: ['好的']
	}
	dialog.showMessageBox(options);
}

/* Create Child Process */
function make_prc()
{
	if (prc == null)
	{
		if (process.platform == 'linux')
			prc = spawn(coreLinux, ['--config', coreCfg]);
		else
			prc = spawn(coreWin32, ['--config', coreCfg]);
	}
}

/* Received a message */
ipcMain.on('asynchronous-message', (event, arg) => {
	msg(arg);
})

/* Reconnect */
ipcMain.on('reconnect-message', (event, arg) => {
	if (prc != null) prc.kill(), prc = null, make_prc();
})

/* Clicked main window's close button */
ipcMain.on('close-message', (event, arg) => {
	win.close();
})

/* Clicked ask window's close button */
ipcMain.on('close-ask', (event, arg) => {
	askwin.close();
})

function createWin(){
	const winCfg =
	{
		width : 340,
		height : 440,
		frame: false,
		resizable: false,
		icon : iconPath
	};
	win = new BrowserWindow(winCfg);
	//win.webContents.openDevTools();
	win.setMenu(null);
	const idx = path.join(__dirname, 'index.html');
	win.loadURL('file://' + idx);
	win.on('close', () => {
		win = null;
	});
}

function createAsk(){
	const winCfg =
	{
		width : 430,
		height : 440,
		frame: false,
		resizable: false,
		icon : iconPath
	};
	askwin = new BrowserWindow(winCfg);
	//askwin.webContents.openDevTools();
	askwin.setMenu(null);
	const idx = path.join(__dirname, 'ask.html');
	askwin.loadURL('file://' + idx);
	askwin.on('close', () => {
		askwin = null;
	});
}

let appIcon = null;

var aut;

/* Make menu */

function makeMenu()
{
	return Menu.buildFromTemplate([
		{
			label: '操作',
			submenu: [
				{
					label: '连接',
					id: 'menuCnct',
					type: 'radio',
					checked: aut == 1 ? true : false,
					click: () => {
						make_prc();
					}
				},
				{
					label: '断开',
					id: 'menuDis',
					type: 'radio',
					checked: aut == 1 ? false : true,
					click: () => {
						if (prc != null) prc.kill();
						prc = null;
					}
				}
			]
		},
		{
			label: '自动连接',
			type : 'checkbox',
			checked : aut == 1 ? true : false,
			click: () => {
				if (aut == 1) aut = 0;
				else
				{
					aut = 1;
					make_prc();
					appIcon.setContextMenu(makeMenu());
				}
				fs.writeFile(autoPath, aut.toString(), 'utf-8', function (err){
					if (err) msg('无法写入 auto.conf!');
				});
			}
		},
		{
			label: 'check',
			click: () => {
				if (askwin == null) createAsk();
			}
		},
		{
			label: '配置',
			click: () => {
				if (win == null) createWin();
			}
		},
		{
			label: '关于',
			click: () => {
				var tmp = 'Eagle Tunnel with GUI for Linux and Windows\n\n';
				tmp += 'By Remmina\n\nVersion : ' + appVersion + '\n\n';
				tmp += 'Core version information :\n\n';
				var vprc = null;
				if (process.platform == 'linux')
					vprc = spawn(coreLinux, ['-v']);
				else vprc = spawn(coreWin32, ['-v']);
				vprc.stdout.on('data', (data) => {
					tmp += data.toString();
				});
				setTimeout(function() { msg(tmp); }, 500);
			}
		},
		{
			label: '退出',
			click: () => {
				if (prc != null) prc.kill();
				if (win != null) win.close();
				if (askwin != null) askwin.close();
				app.quit();
			}
		}
	]);
}

/* Creat tray icon */
function createTray()
{
	appIcon = new Tray(iconPath);
	appIcon.setTitle('Et-electron');
	appIcon.setContextMenu(makeMenu());
	if (aut) make_prc();
}

/* Init */
function init()
{
	/* Check auto connect config file */
	fs.exists(autoPath, function(exists){
		if (exists) aut = parseInt(fs.readFileSync(autoPath, 'utf-8'));
		else
		{
			fs.writeFile(autoPath, '0', 'utf-8', function(err) {
				if (err) msg('无法写入 auto.conf!'), flag = false;
				else aut = 0;
			});
		}
	});
	/* Check core config file */
	fs.exists(coreCfg, function(exists) {
		if (!exists)
			fs.writeFile(coreCfg, 'listen=0.0.0.0', 'utf-8', function(err) {
				if (err) msg('无法写入 client.conf!');
			})
	});
	setTimeout(createTray, 1000);
}

app.on('ready', init);
app.on('window-all-closed', e => e.preventDefault());
