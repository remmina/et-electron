const {ipcRenderer} = require('electron');

const readline = require('readline');
const fs = require('fs');

const path = require('path');
const cfgPath = path.join(__dirname, 'config/config.conf');
const coreCfg = path.join(__dirname, 'core/config/client.conf');

var rmtip = document.getElementById('rmtip');
var rmtcom = document.getElementById('rmtcom');
var socks = document.getElementById('socks');
var http = document.getElementById('http');
var et = document.getElementById('et');
var loccom = document.getElementById('loccom');
var user = document.getElementById('user');
var passwd = document.getElementById('passwd');
var share = document.getElementById('share');
var smart = document.getElementById('smart');

let data = null;
let flag = null;

const rl = readline.createInterface({input: fs.createReadStream(cfgPath)});

var cnt = 1;

rl.on('line', (line) => {
	switch (cnt)
	{
		case 1 : rmtip.value = line; break;
		case 2 : rmtcom.value = line; break;
		case 3 :
		{
			if (line == '1') socks.checked = 1;
			else socks.checked = 0;
			break;
		}
		case 4 :
		{
			if (line == '1') http.checked = 1;
			else http.checked = 0;
			break;
		}
		case 5 :
		{
			if (line == '1') et.checked = 1;
			else et.checked = 0;
			break;
		}
		case 6 : loccom.value = line; break;
		case 7 : user.value = line; break;
		case 8 : passwd.value = line; break;
		case 9 :
		{
			if (line == '1') share.checked = 1;
			else share.checked = 0;
			break;
		}
		case 10 :
		{
			if (line == '1') smart.checked = 1;
			else smart.checked = 0;
			break;
		}
	}
	cnt++;
});

function msg(str)
{
	ipcRenderer.send('asynchronous-message', str);
}

document.getElementById('save').addEventListener('click', function () {
	data = rmtip.value, flag = true;
	data += '\n' + rmtcom.value;
	if (socks.checked) data += '\n1';
	else data += '\n0';
	if (http.checked) data += '\n1';
	else data += '\n0';
	if (et.checked) data += '\n1';
	else data += '\n0';
	data += '\n' + loccom.value;
	data += '\n' + user.value;
	data += '\n' + passwd.value;
	if (share.checked) data += '\n1';
	else data += '\n0';
	if (smart.checked) data += '\n1';
	else data += '\n0';
	
	var fs = require('fs');
	fs.writeFile(cfgPath, data, 'utf8', function(err) {
		if (err) msg('Can not write config!'), flag = false;
	});
	
	data = 'listen=';
	if (share.checked) data += '0.0.0.0';
	else data += '127.0.0.1';
	data += ':' + loccom.value + '\n';
	data += 'relayer=' + rmtip.value + ':' + rmtcom.value + '\n';
	if (http.checked) data += 'http=on\n';
	else data += 'http=off\n';
	if (socks.checked) data += 'socks=on\n';
	else data += 'socks=off\n';
	if (et.checked) data += 'et=on\n';
	else data += 'et=off\n';
	if (smart.checked) data += 'proxy-status=smart\n';
	else data += 'proxy-status=enable\n';
	if (user.value != '')
		data += 'user=' + user.value + ':' + passwd.value + '\n';
	
	fs.writeFile(coreCfg, data, 'utf-8', function(err) {
		if (err) msg('Can not write client.conf!'), flag = false;
	});
	if (flag == true) msg('保存配置成功');
});
