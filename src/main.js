/* Main program of et-electron */

const {app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell} = require('electron');

const path = require('path');

const fs = require('fs');

const spawn = require('child_process').spawn;

const appVersion = '2.0.2';

let prc = null; /* et.go process */

let win = null; /* main window */

let askwin = null; /* ask window */

/* Path config */

const iconPath = process.platform == 'darwin' ? path.join(__dirname, 'img/16x16.png') : path.join(__dirname, 'img/256x256.png');
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreLinux_32 = path.join(__dirname, 'core/et.go.32.linux');
const coreWin = path.join(__dirname, 'core/et.go.exe');
const coreWin_32 = path.join(__dirname, 'core/et.go.32.exe');
const coreDarwin = path.join(__dirname, 'core/et.go.darwin');
const listDir = path.join(__dirname, 'core/config');
const cfgDir = path.join(app.getPath('userData'), 'config');
const autoPath = path.join(cfgDir, 'auto.conf');
const coreCfg = path.join(cfgDir, 'client.conf');
const customProxy = path.join(cfgDir, 'proxy.txt');
const customDirect = path.join(cfgDir, 'direct.txt');
const customHosts = path.join(cfgDir, 'hosts.txt');
const copyProxy = path.join(listDir, 'proxylists/custom.txt');
const copyDirect = path.join(listDir, 'directlists/custom.txt');
const copyHosts = path.join(listDir, 'hosts/custom.hosts');

let corePath = null;

if(process.platform == 'darwin') corePath = coreDarwin;
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

/* Copy file */
function copyFile(src, dest)
{
	var data = null;
	try { data = fs.readFileSync(src, 'utf-8'); }
	catch(err) { msg('无法复制文件!'); return 0; }
	try { fs.writeFileSync(dest, data, 'utf-8'); }
	catch(err) { msg('无法复制文件!'); return 0; }
	return 1;
}

/* Create Child Process */
function make_prc()
{
	if (prc == null && copyFile(customProxy, copyProxy) && copyFile(customDirect, copyDirect) && copyFile(customHosts, copyHosts))
		prc = spawn(corePath, ['--config', coreCfg, '--config-dir', listDir]);
}

/* Received a message */
ipcMain.on('asynchronous-message', (event, arg) => {
	msg(arg);
})

function reconnect()
{
	if (prc != null) prc.kill(), prc = null, make_prc();
}

/* Reconnect */
ipcMain.on('reconnect-message', (event, arg) => {
	reconnect();
})

/* Clicked main window's close button */
ipcMain.on('close-message', (event, arg) => {
	win.close();
})

/* Clicked ask window's close button */
ipcMain.on('close-ask', (event, arg) => {
	askwin.close();
})

function createWin()
{
	const winCfg =
	{
		width : 340,
		height : 440,
		frame: false,
		resizable: false,
		icon : iconPath,
		webPreferences: {
            nodeIntegration: true
        }
	};
	win = new BrowserWindow(winCfg);
	win.setMenu(null);
	const idx = path.join(__dirname, 'index.html');
	win.loadURL('file://' + idx);

	win.on('close', (e) => {
		/* Stop destroy win while running on mac os */
		if (process.platform === 'darwin')
		{
			if (win.isVisible()) e.preventDefault(), win.hide();
			return;
		}
		win = null
	})

	if (process.env.NODE_ENV === 'dev') win.webContents.openDevTools()
}

function createAsk(){
	const winCfg =
	{
		width : 430,
		height : 440,
		frame: false,
		resizable: false,
		icon : iconPath,
		webPreferences: {
            nodeIntegration: true
        }
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
	setTimeout(function() { msg(tmp); }, 1000);
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
				},
				{
					label: '重连',
					click: () => { reconnect(); }
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
			label: '自定义',
			submenu: [
				{
					label: 'proxy list',
					click: () => {
						shell.openItem(customProxy);
					}
				},
				{
					label: 'direct list',
					click: () => {
						shell.openItem(customDirect);
					}
				},
				{
					label: 'hosts',
					click: () => {
						shell.openItem(customHosts);
					}
				},
			]
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
	/* Check config directory */
	if (!fs.existsSync(cfgDir))
		try
		{ fs.mkdirSync(cfgDir); }
		catch (err) { msg('无法创建配置文件目录!'), app.quit(); }

	/* Check custom proxy list file */
	if (!fs.existsSync(customProxy))
		try { fs.writeFileSync(customProxy, '', 'utf-8'); }
		catch (err) { msg('无法写入自定义 proxy list 文件!'), app.quit(); }

	/* Check custom direct list file */
	if (!fs.existsSync(customDirect))
		try { fs.writeFileSync(customDirect, '', 'utf-8'); }
		catch (err) { msg('无法写入自定义 direct list 文件!'), app.quit(); }

	/* Check custom hosts file */
	if (!fs.existsSync(customHosts))
		try { fs.writeFileSync(customHosts, '', 'utf-8'); }
		catch (err) { msg('无法写入自定义 hosts 文件!'), app.quit(); }

	/* Check core config file */
	if (!fs.existsSync(coreCfg))
		try { fs.writeFileSync(coreCfg, 'listen=0.0.0.0', 'utf-8'); }
		catch (err) { msg('无法写入 client.conf!'), app.quit(); }

	/* Check auto connect config file */
	if (fs.existsSync(autoPath))
		try
		{
			aut = parseInt(fs.readFileSync(autoPath, 'utf-8')), createTray();
		}
		catch (err) { msg('无法读取 auto.conf!'), app.quit(); }
	else
		try
		{
			fs.writeFileSync(autoPath, '0', 'utf-8');
			aut = 0, createWin(), createTray();
		}
		catch (err) { msg('无法写入 auto.conf!'), app.quit(); }
}

app.on('ready', init);
app.on('window-all-closed', e => e.preventDefault());
app.on('activate', () => {(process.platform === 'darwin' && win) && win.show()})
app.on('before-quit', (e) => {
	close()
})