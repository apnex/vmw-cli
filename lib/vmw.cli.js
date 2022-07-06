#!/usr/bin/env node
'use strict';

import vmwClient from './vmw.api.js';
import streamer from './streamer.js';
import fs from 'fs';
import md5File from 'md5-file';
import path from 'path';

/* Module Purpose
To provide a cli interface for the vmw-api module.
To parse stdin input from user, structure syntac and execute api calls in valid format.
To cleanly display output to user via stdout
To perform any view specific data transforms
Handle client IO unrelated to the VMW-API interface
*/

// ignore self-signed certificate
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

// global ENV settings
var username = process.env.VMWUSER;
var password = process.env.VMWPASS;
var filesdir = process.cwd();
var statedir = process.cwd();
if(process.env.VMWFILESDIR) {
	filesdir = process.env.VMWFILESDIR;
}
if(process.env.VMWSTATEDIR) {
	statedir = process.env.VMWSTATEDIR;
}

// colours
import chalk from 'chalk';

const red = chalk.bold.red;
const green = chalk.green;
const blue = chalk.blueBright;

// init vmw-api client
const client = new vmwClient({
	username,
	password,
	statedir
});

// called from shell
const args = process.argv.splice(2);
if(process.argv[1].match(/vmw.cli/g)) {
	switch(args[0]) {
		case 'ls':
			if(args.length >= 2) {
				if(args[1] == '.') {
					cmdFile();
				} else {
					cmdPath(args[1]);
				}
			} else {
				list();
			}
		break;
		case 'cp':
			if(args.length >= 2) {
				cmdGet(args[1]);
			} else {
				console.log('[' + red('ERROR') + ']: usage ' + blue('get <file.path>'));
			}
		break;
		case 'clear':
			cmdClear();
		break;
		case 'files':
			cmdFile();
		break;
		default:
			console.log(blue('<cmd>'));
			[
				'ls',
				'cp',
				'clear'
			].forEach((cmd) => {console.log(cmd)});
		break;
	}
}

// main
async function main(category, version, type) {
	client.main(category, version, type)
}

// list
async function list() {
	client.getProducts().then((result) => {;
		console.log(blue('<category>'));
		result.forEach((item) => {
			console.log(item.product);
		});
	});
}

async function cmdClear() {
	await client.clear();
}

async function cmdPath(string) {
	// need to normalise path to [category, version, type] before calling main
	//console.log('Path test [' + string + ']');
	let path = string.split('/');
	//console.log(JSON.stringify(path, null, "\t"));
	if(path.length == 1) {
		if(path[0].length > 0) {
			//console.log('Path size 1: ' + path[0]);
			main(path[0]);
		}
	} else if(path.length == 2) {
		if(path[1].length > 0) {
			//console.log('Path size 2: ' + path[0]);
			main(path[0], path[1]);
		} else {
			//console.log('Training Slash!! - call VERSIONS: ' + path[0]);
			let result = await client.getProductVersions(path[0]);
			console.log(result.versions)
		}
	} else if(path.length == 3) {
		if(path[2].length > 0) {
			//console.log('Path size 3: ' + path[0]);
			main(path[0], path[1], path[2]);
		} else {
			//console.log('Training Slash!! - call TYPES');
			let data = [
				{id: 'PRODUCT_BINARY'},
				{id: 'DRIVERS_TOOLS'},
	                        {id: 'OPEN_SOURCE'},
				{id: 'CUSTOM_ISO'},
				{id: 'ADDONS'}
			];
			console.log(data)
		}
	} else {
		console.log('INVALID PATH');
	}
}

async function cmdGet(fileName) { // broken, fix
	let nstream = new streamer();
	client.getDownload(fileName).then(async(file) => {
		await nstream.download(file.downloadURL, file.fileName, fs.createWriteStream(filesdir + '/' + fileName));
		let md5Local = md5File.sync(filesdir + '/' + fileName)
		if(file.md5checksum == md5Local) {
			console.log('MD5 MATCH: local[ ' + green(md5Local) + ' ] remote [ ' + green(file.md5checksum) + ' ]');
		} else {
                	console.log('MD5 FAIL!: local[ ' + green(md5Local) + ' ] remote [ ' + green(file.md5checksum) + ' ]');
		}
	}).catch((error) => {
		console.log(error.message);
	});
}

async function cmdFile() {
	// load fileList and retrieve file details
	if(fs.existsSync(statedir + '/fileList.json')) {
		let data =  JSON.parse(fs.readFileSync(statedir + '/fileList.json', 'utf8')); 
		console.log(data)
	}
}

