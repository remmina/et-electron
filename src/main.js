/* Main program of et-electron */

const {app, BrowserWindow, Menu, Tray, ipcMain, dialog} = require('electron');

const path = require('path');

const fs = require('fs');

const spawn = require('child_process').spawn;

const appVersion = '1.6.0';

let prc = null; /* et.go process */

let win = null; /* main window */

let askwin = null; /* ask window */


/* Path config */

const iconPath = process.platform == 'darwin' ? path.join(__dirname, 'img/16x16.png') : path.join(__dirname, 'img/256x256.png');
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreLinux_32 = path.join(__dirname, 'core/et.go.32.linux');
const coreWin = path.join(__dirname, 'core/et.go.exe');
const coreWin_32 = path.join(__dirname, 'core/et.go.32.exe');
const coreDarwin_32 =  path.join(__dirname, 'core/et.go');

const configPath = process.platform == 'darwin' ? path.join(app.getPath('userData'), 'conf') : __dirname;
/* copy config files to userData folder avoid overwrite when upgrade*/
if (process.platform == 'darwin' && !fs.existsSync(configPath)) {
	fs.mkdirSync(configPath)
	fs.mkdirSync(path.join(configPath, 'config'))
	fs.mkdirSync(path.join(configPath, 'core'))
	copyDir(path.join(__dirname, 'core/config'), path.join(configPath, 'core/config'))
}
const autoPath = path.join(configPath, 'config/auto.conf');
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
	if (prc == null) prc = spawn(corePath, ['--config', coreCfg]);
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

	win.on('close', (e) => {
		// stop destroy win while running on mac os
		if (process.platform === 'darwin') {
			if (win.isVisible()) {
				e.preventDefault()
				win.hide()
			}
			return;
		}
		win = null
	})

	if (process.env.NODE_ENV === 'dev') {
		win.webContents.openDevTools()
	}
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
	if (process.env.NODE_ENV === 'dev') {
		askwin.webContents.openDevTools()
	}
}

let appIcon = null;

var aut;

let close = () => {
	if (prc != null) prc.kill();
	if (win != null) win.close();
	if (askwin != null) askwin.close();
}

let click = () => {
	var tmp = 'Eagle Tunnel with GUI for Linux, Windows and Mac \n\n';
	tmp += 'By Remmina\n\nVersion : ' + appVersion + '\n\n';
	tmp += 'Core version information :\n\n';
	var vprc = spawn(corePath, ['-v']);
	vprc.stdout.on('data', (data) => {
		tmp += data.toString();
	});
	setTimeout(function() { msg(tmp); }, 500);
}
/* Make menu */

function makeMenu()
{
	const template = [
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
				if (win == null) {
					createWin();
					return
				}
				win.show()
			}
		},
		{
			label: '关于',
			click: click
		},
		{
			label: '退出',
			click: () => {
				app.quit() // emit before-quit event
			}
		}
	]
	if (process.platform === 'darwin') {
		const systemMenu = Menu.buildFromTemplate([
			{
				label: app.getName(),
				submenu: [
					{label: 'about', click},
					{type: 'separator'},
					{role: 'services', submenu: []},
					{type: 'separator'},
					{role: 'hide'},
					{role: 'hideothers'},
					{role: 'unhide'},
					{type: 'separator'},
					{role: 'quit'}
				]
			},
			{
				label: '编辑',
				submenu: [
					{role: 'undo', label: '撤销'},
					{role: 'redo', label: '重做'},
					{type: 'separator'},
					{role: 'cut', label: '剪切'},
					{role: 'copy', label: '复制'},
					{role: 'paste', label: '粘贴'},
					{role: 'delete', label: '删除'},
					{role: 'selectall', label: '全选'}
				]
			}
		])
		Menu.setApplicationMenu(systemMenu)
	}

	return Menu.buildFromTemplate(template);
}

/* Creat tray icon */
function createTray()
{
	appIcon = new Tray(iconPath);
	if (process.platform !== 'darwin'){
		appIcon.setTitle('ET'); // shorter name , looks more graceful
	}
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
				if (err) msg('无法写入 auto.conf!');
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

	/* create window on mac by default, but hide it after created */
	if (process.platform === 'darwin' && !win) {
		createWin();
		// show win at development env by default
		if (process.env.NODE_ENV !== 'dev') {
			win.hide()
		}
	}

	setTimeout(createTray, 1000);
}

function copyDir(src, dest) {
	try {
		fs.mkdirSync(dest, 0755);
	} catch(e) {
		if(e.code != "EEXIST") {
			throw e;
		}
	}
	let files = fs.readdirSync(src);
	for(let file of files) {
		let current = fs.lstatSync(path.join(src, file));
		if(current.isDirectory()) {
			copyDir(path.join(src, file), path.join(dest, file));
		} else if(current.isSymbolicLink()) {
			// make symlink
			let symlink = fs.readlinkSync(path.join(src, file));
			fs.symlinkSync(symlink, path.join(dest, file));
		} else {
			// copy file
			let oldFile = fs.createReadStream(path.join(src, file));
			let newFile = fs.createWriteStream(path.join(dest, file));
			oldFile.pipe(newFile);
		}
	}
}


app.on('ready', init);
app.on('window-all-closed', e => e.preventDefault());
app.on('activate', () => {(process.platform === 'darwin' && win) && win.show()})
app.on('before-quit', (e) => {
	close()
})

