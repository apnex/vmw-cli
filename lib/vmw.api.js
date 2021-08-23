#!/usr/bin/env node
'use strict';
const vmwClient = require('vmw-sdk');
const streamer = require('./streamer');
const fs = require('fs');
const CookieFileStore = require('tough-cookie-file-store').FileCookieStore;
const {CookieJar} = require('tough-cookie');
const pMap = require('p-map');
const storage = require('node-persist');

// provides a higher order interface on top of vmw.sdk.js
// handles auth/session persistence
// handles FS/IO operations
// deals in input/output JSON data, does not render to screen - delegates to cli
// handles file download operations
// handles MD5 checks

// ignore self-signed certificate
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;

module.exports = class vmwApi {
	constructor(options = {}) {
		this.username = options.username;
		this.password = options.password;
		this.statedir = options.statedir;
		this.client = new vmwClient({
			cookieJar: new CookieJar(new CookieFileStore(this.statedir + '/cookies.json'))
		});
		if (!fs.existsSync(this.statedir + '/cache/')){
			fs.mkdirSync(this.statedir + '/cache/');
		}
		this.cache = storage.create({
			dir: this.statedir + '/cache/',
			stringify: JSON.stringify,
			parse: JSON.parse,
			encoding: 'utf8',
			logging: false,
			ttl: 60 * 60 * 1000, // 60 minutes
			expiredInterval: 10 * 60 * 1000, // every 2 minutes the process will clean-up the expired cache
			forgiveParseErrors: false
		});
	}
	async main(category, version, type) {
		try {
			// test account info
			let account = await this.tryAuth();

			// build product cache
			let result = await this.getRelatedDLGList(category, version, type);
			let fetchEntries = Object.entries(this.buildFileList(result));

			// Map and resolve all outstanding web calls, flatten arrays and return data result
			let data = (await pMap(fetchEntries, ((item) => {
				return this.fetchFiles({
					downloadGroup: item[0],
					productId: Object.keys(item[1].productId)[0]
				});
			}), {concurrency: 8})).flat(1);
			fs.writeFileSync(this.statedir + '/fileList.json', JSON.stringify(data, null, "\t"), 'utf8');
			return data;
		} catch(error) {
			throw new Error(error.message);
		}
	}
	async clear() {
		await this.cache.clear();
		this.client.cookieJar.removeAllCookiesSync();
		try {
			fs.unlinkSync(this.statedir + '/cookies.json');
			fs.unlinkSync(this.statedir + '/fileList.json');
			fs.unlinkSync(this.statedir + '/headers.json');
			fs.unlinkSync(this.statedir + '/mainIndex.json');
		} catch(error){}
		console.log('[CLEAR]: All state cleared');
	}
	async tryAuth() {
		// check cache if username has changed since last attempt - if so, clear cache
                let value = await this.cache.getItem('username');
		if(value != this.username) {
			console.error('[WARN]: AUTH-CHANGE - [' + value + ' : ' + this.username + ']');
			await this.clear();
			await this.cache.setItem('username', this.username);
                }
		// attempt accountInfo
		try {
			if(fs.existsSync(this.statedir + '/headers.json')) {
				let headers = require(this.statedir + '/headers.json');
				this.client.client = this.client.base.extend({
					prefixUrl: 'https://customerconnect.vmware.com/',
					headers
				});
			} else {
				this.client.client = this.client.base.extend({
					prefixUrl: 'https://customerconnect.vmware.com/'
				});
			}
			return await this.client.accountInfo();
		} catch(error) {
			//console.log(error);
			if(error.code == 401) {
		                // login
				console.error('[INFO]: 401 - Attempting new login');
				let headers = await this.client.login({
					username: this.username,
					password: this.password
				});
				fs.writeFileSync(this.statedir + '/headers.json', JSON.stringify(headers, null, "\t"), 'utf8');
				// retry
				console.log('[INFO]: Re-authentication completed, trying call again...');
				return await this.client.accountInfo();
			}
		}
	}
	async fetchFiles(body) {
		// Consult response cache
		let cacheKey = body.downloadGroup + ':' + body.productId;
		let value = await this.cache.getItem(cacheKey);
		if(typeof(value) != 'undefined') {
			console.error('[CACHE]: ' + cacheKey);
			return value;
		}
		// get product header
	 	let fileHeader = await this.client.getDLGHeader(body);

		// check download eligibility
		try {
			let fileDetails = await this.client.getDLGDetails(body);
			let canDownload = fileDetails.eligibilityResponse.eligibleToDownload.toString();
			// build file list
			let files = fileDetails.downloadFiles;
			let result = [];
			files.forEach((item) => {
				if(!item.header) {
					result.push({
						fileName: item.fileName,
						title: item.title,
						description: item.description,
						sha1checksum: item.sha1checksum,
						sha256checksum: item.sha256checksum,
						md5checksum: item.md5checksum,
						build: item.build,
						releaseDate: item.releaseDate,
						fileType: item.fileType,
						fileSize: item.fileSize,
						version: item.version,
						uuid: item.uuid,
						productFamily: fileHeader.product.name,
						downloadGroup: body.downloadGroup,
						productId: body.productId,
						dlgType: fileHeader.dlg.type.replace(/&amp;/g, '&'),
						tagId: fileHeader.dlg.tagId,
						canDownload: canDownload
					});
				}
			});
			// set cache
			await this.cache.setItem(cacheKey, result);
			return result;
		} catch(error) {
			console.log('BAD RESPONSE - SKIPPING: ' + body.downloadGroup);
			return [];
		}
	}
	buildFileList(result) { // make async?
		// BUILD code->[productId] map
		let cache = {};
		result.dlgEditionsLists.forEach((item) => {
			item.dlgList.forEach((product) => {
				if(typeof(cache[product.code]) == 'undefined') {
					cache[product.code] = {
						productId: {}
					}
				}
				cache[product.code].productId[product.productId] = 1;
			});
		});
		//fs.writeFileSync('./mainIndex.json', JSON.stringify(cache, null, "\t"), 'utf8');
		return cache;
	}
	async getProductVersions(productName) {
		let products = await this.getProducts();
		let product = products.filter((item) => {
 	      	 	return (item.product == productName);
		})[0];
		return this.client.getProductHeader({
			category: product.category,
			product: product.product,
			version: product.version
		});
	}
	async getRelatedDLGList(productName, productVersion, productType) {
		let products = await this.getProducts();
		let product = products.filter((item) => {
			return (item.product == productName);
		})[0];

		if(typeof(product) != 'undefined') {
			if(typeof(productVersion) == 'undefined') {
				productVersion = product.version;
			}
			if(typeof(productType) == 'undefined') {
				productType = product.dlgType;
			}
			let params = {
				category: product.category,
				product: product.product,
				version: productVersion,
				dlgType: productType
			};
			return this.client.getRelatedDLGList(params);
		} else {
			throw new Error('[' + red('ERROR') + ']: Invalid category selected [' + blue(productName) + ']');
		}
	}
	async getProducts() {
		let result = [];
		return this.client.getProducts().then((products) => {
			let links = products.productCategoryList[0].productList;
			links.forEach((item) => {
				let target = item.actions.filter((link) => {
					return (link.linkname == 'View Download Components');
				})[0].target;
				let values = target.split('/');
				result.push({
					name: item.name,
					target: target,
					category: values[3],
					product: values[4],
					version: values[5],
					dlgType: 'PRODUCT_BINARY'
				});
			});
			return result;
		});
	}
	async getDownload(fileName) {
                // test account info
		let account = await this.tryAuth();

		// load fileList and retrieve file details
		if(fs.existsSync(this.statedir + '/fileList.json')) {
			let data = require(this.statedir + '/fileList.json');
			let details = data.filter((file) => {
				return (file.fileName == fileName);
			})[0];

			// fire download request
			if(typeof(details) != 'undefined') {
				if(details.canDownload == 'true') {
					let json = {
						"locale": "en_US",
						"downloadGroup": details.downloadGroup,
						"productId": details.productId,
						"md5checksum": details.md5checksum,
						"tagId": details.tagId,
						"uUId": details.uuid,
						"dlgType": details.dlgType,
						"productFamily": details.productFamily,
						"releaseDate": details.releaseDate,
						"dlgVersion": details.version,
						"isBetaFlow": false
					};
					console.log(JSON.stringify(json, null, "\t"));
 					let result = await this.client.getDownload(json);
					result.md5checksum = details.md5checksum;
					return result;
				} else {
					throw new Error('[' + red('ERROR') + ']: Not permitted to download this file, check account entitlement');
				}
			} else {
				throw new Error('[' + red('ERROR') + ']: [' + blue(fileName) + '] not cached, please use ' + blue('ls <category>') + ' to view first');
			}
		} else {
			throw new Error('[' + red('ERROR') + ']: No files cached, please use ' + blue('ls <category>') + ' to view');
		}
	}
}
