const {app, BrowserWindow, Menu, Tray, ipcMain, dialog} = require('electron');

const path = require('path');

const fs = require('fs');

const spawn = require('child_process').spawn;

let prc = null;

let win = null;

const iconPath = path.join(__dirname, 'img/256x256.png');
const autoPath = path.join(__dirname, 'config/auto.conf');
const coreLinux = path.join(__dirname, 'core/et.go.linux');
const coreWin32 = path.join(__dirname, 'core/et.go.exe');
const coreCfg = path.join(__dirname, 'core/config/client.conf');

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

ipcMain.on('asynchronous-message', (event, arg) => {
	msg(arg);
})

ipcMain.on('close-message', (event, arg) => {
	win.close();
})

function createWin(){
	const winCfg =
	{
		width : 340,
		height : 660,
		frame: false,
		resizable: false,
		icon : iconPath
	};
	win = new BrowserWindow(winCfg);
	//win.webContents.openDevTools();
	win.setMenu(null);
	const idx = path.join(__dirname, 'index.html');
	win.loadURL('file://' + idx);
	win.on('close',() => {
		win = null;
	});
}

let appIcon = null;

var aut = parseInt(fs.readFileSync(autoPath, 'utf-8'));

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
						if (prc == null)
						{
							if (process.platform == 'linux')
								prc = spawn(coreLinux, [coreCfg]);
							else
								prc = spawn(coreWin32, [coreCfg]);
						}
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
					if (prc == null)
					{
						if (process.platform == 'linux')
							prc = spawn(coreLinux, [coreCfg]);
						else
							prc = spawn(coreWin32, [coreCfg]);
					}
					appIcon.setContextMenu(makeMenu());
				}
				fs.writeFile(autoPath, aut.toString(), 'utf-8', function (err){
					if (err) msg('Can not write auto.conf!');
				});
			}
		},
		{
			label: '配置',
			click: () => {
				if (win == null) createWin();
			}
		},
		{
			label: '退出',
			click: () => {
				if (prc != null) prc.kill();
				if (win != null) win = null;
				app.quit();
			}
		}
	]);
}

function createappIcon()
{
	appIcon = new Tray(iconPath);
	appIcon.setTitle('Et-electron');
	appIcon.setContextMenu(makeMenu());
	if (aut)
	{
		if (process.platform == 'linux')
			prc = spawn(coreLinux, [coreCfg]);
		else
			prc = spawn(coreWin32, [coreCfg]);
	}
}

app.on('ready', createappIcon);
app.on('window-all-closed', e => e.preventDefault());
