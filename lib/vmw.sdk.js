#!/usr/bin/env node
const got = require('got');
const {CookieJar} = require('tough-cookie');
const map = new Map();

// Provides direct interface against my.vmware.com API
// Provides an ability to login
// Does not provide external auth persistence
// Does not implement caching or throttling

// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;

module.exports = class vmwSdk {
	constructor(options = {}) {
                this.options = options;
		if(typeof(options.cookieJar) !== 'undefined') {
			this.cookieJar = options.cookieJar;
		} else {
			this.cookieJar = new CookieJar();
		}
		this.base = got.extend({ // client defaults
			cookieJar: this.cookieJar,
			mutableDefaults: true,
			followAllRedirects: true,
			https: {
				rejectUnauthorized: false
			},
			hooks: {
				afterResponse: [
					(response, retryWithMergedOptions) => {
						if (response.statusCode === 401) { // Unauthorized
							let error = new Error('[ERROR]: Session timed out - Please reauthenticate');
							error.code = 401;
							throw error;
						} else if (response.statusCode === 403) { // Forbidden
							console.log(response);
							let error = new Error('[ERROR]: Access denied - try again later');
							error.code = 403;
							throw error;
						} else {
							//console.log(response);
							return response;
						}
					}
				],
				beforeRedirect: [
					(options, response) => { // throw Error if credentials fail
						if(new RegExp('errorCode=AUTH-ERR', 'g').exec(response.redirectUrls[0])) {
							throw new Error('[' + red('ERROR') + ']: AUTH-ERROR please check environment variables ' + blue('$VMWUSER') + ' and ' + blue('$VMWPASS') + ' are correct and try again!');
						}
					}
				],
				beforeRequest: [
					(options, response) => {
						console.error('[' + options.method + '] ' + options.url.origin + options.url.pathname);
					}
				]
			}
		});
		this.client = this.base.extend({
			prefixUrl: 'https://my.vmware.com/'
		});
	}
	async login(options) {
		// step 1 - Ingest cookies from landing sequence
		this.cookieJar.removeAllCookiesSync();
		await this.base.get('https://my.vmware.com/web/vmware/login');

		// step 2 - Post creds for Auth
		let body = await this.base.post('https://auth.vmware.com/oam/server/auth_cred_submit', {
			searchParams: new URLSearchParams([
				['Auth-AppID', 'WMVMWR']
			]),
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			form: {
				username: options.username,
				password: options.password
			}
		}).text();

		// strip whitespace and extract SAMLRequest string
		let found = body.replace(/\r?\n|\r/g, "").match(/NAME="SAMLResponse" VALUE="(.+)"/);
		let SAMLResponse;
		if(found[1]) {
			SAMLResponse = found[1];
		}

		// step 3 - post SSO request
		await this.base.post('https://my.vmware.com/vmwauth/saml/SSO', {
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			},
			form: { SAMLResponse }
		});

		// step 4 - get XSRF-TOKEN token and set in client header
		let headers;
		this.cookieJar.getCookies('https://my.vmware.com', (err, cookies) => {
			headers = {
				'X-XSRF-TOKEN': cookies.filter((cookie) => {
					return (cookie.key == 'XSRF-TOKEN');
				})[0].value
			};
			this.client = this.base.extend({ // update default client options
				prefixUrl: 'https://my.vmware.com/',
				headers
			});
		});

		return headers;
		// other links
		//https://my.vmware.com/web/vmware/checksession
		//https://my.vmware.com/vmwauth/loggedinuser
		//https://my.vmware.com/channel/api/v1.0/evals/active
		//https://my.vmware.com/channel/api/v1.0/sdp/services
		//https://my.vmware.com/group/vmware/extend_session
	}
	async accountInfo() {
		return this.client.post('channel/api/v1.0/ems/accountinfo', {
			headers: {
				'Accept': 'application/json, text/plain, */*'
			},
			json: {
				"rowLimit": "3"
			}
		}).json();
	}
	async getProducts() {
		let params = {
			'isPrivate': 'true'
		}
		return this.client.get('channel/public/api/v1.0/products/getProductsAtoZ', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async getProductHeader(params) {
		return this.client.get('channel/public/api/v1.0/products/getProductHeader', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async getRelatedDLGList(params) {
		return this.client.get('channel/public/api/v1.0/products/getRelatedDLGList', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async getDLGHeader(params) {
		return this.client.get('channel/public/api/v1.0/products/getDLGHeader', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async getDLGDetails(params) {
		return this.client.get('channel/api/v1.0/dlg/details', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async eulaAccept(params) {
		return this.client.get('channel/api/v1.0/dlg/eula/accept', {
			searchParams: new URLSearchParams(Object.entries(params))
		}).json();
	}
	async getMyLicensedProducts() {
		return this.client.post('channel/api/v1.0/products/getMyLicensedProducts');
	}
	async getDownload(json) {
		return this.client.post('channel/api/v1.0/dlg/download', {json}).json();
	}
}
