#!/usr/bin/env node
import stream from 'stream';
import got from 'got';
import ProgressBar from 'progress';
import { promisify } from 'util';
const pipeline = promisify(stream.pipeline);

// colours
import chalk from 'chalk';

const red = chalk.bold.red;
const green = chalk.green;
const blue = chalk.blueBright;

export default class vmwClient {
	constructor(options) {
                this.options = options;
		// setup stuff
	}
	async download(url, fileName, dstStream) {
		let bar;
		let current = 0;
		let prevTrans = 0;
		let label = 0;
		let labels = [
			'KB',
			'MB',
			'GB'
		];
		return pipeline(
			got.stream(url)
				.on('request', (request) => {
					//console.log('REQUEST START');
				})
				.on('response', (response) => {
					//console.log('FIRST RESPONSE');
				})
				.on('downloadProgress', (progress) => {console.log(progress);
				}),
			dstStream
				.on('finish', () => {
					//console.log('FINISHS RESPONSE');
				})
		);
	}
};

// pad/truncate zeros to left and right of number
function pad(num) {
	let rgx = /^([^.]+)\.([^.]+)/g
	if(m = rgx.exec(num.toFixed(2).toString())) {
		let left = m[1];
		if(left.length < 2) {
			left = ('00' + left).slice(-2);
		}
		return left + '.' + m[2];
	}
}
