#!/usr/bin/env node
var xcell = require('./xcell.js');
var self = xtable.prototype;

// colours
const chalk = require('chalk');
const red = chalk.bold.red;
const orange = chalk.keyword('orange');
const green = chalk.green;
const blue = chalk.blueBright;
const cyan = chalk.cyan;

// rework as class

// constructor
function xtable(opts) { // Object.assign?
	this.cache = {};
	this.view = [];
	this.header = opts.header;
	this.cell = new xcell({
		data: opts.data
	});
	this.data = this.cell.data;
	this.column = opts.column;
	this.filters = [];
}
module.exports = xtable;

self.out = function(cols) {
	if(this.cell.data.length > 0) {
		if(!this.header) { // learn cols from first record
			this.header = [];
			Object.keys(this.cell.data[0]).forEach((item) => {
				this.header.push(item);
			});
		}
		if(!cols) {
			cols = this.header;
		}
		let col = {};
		cols.forEach((item) => {
			col[item] = '<' + item + '>';
		});
		this.runColWidth(col);

		// scan widths
		if(this.view.length == 0) {
			this.run();
		}
		this.view.forEach((item) => {
			this.runColWidth(item);
		});

		// build header string
		let headString = '';
		let dashString = '';
		let spacer = ' ';
		let gap = spacer.repeat(2);
		cols.forEach((item) => {
			if(headString.length > 0) {
				headString += gap;
				dashString += gap;
			}
			headString += '<' + item + '>' + spacer.repeat(this.cache[item] - (item.length + 2));
			dashString += '-'.repeat(this.cache[item]);
		});
		console.log(blue(headString));
		//console.log(dashString);

		// build data string
		this.view.forEach((item) => {
			let dataString = '';
			cols.forEach((col) => {
				if(dataString.length > 0) {
					dataString += gap;
				}
				if(item[col]) {
					dataString += item[col] + spacer.repeat(this.cache[col] - self.getLength(item[col]));
				} else {
					dataString += spacer.repeat(this.cache[col]);
				}
			});
			console.log(dataString);
		});

		// display filter
		//console.error(blue('[ ' + this.view.length + '/' + this.data.length + ' ] entries - filter [ ' + this.filterString() + ' ]'));
		//console.error(blue('[ ' + green(this.view.length + '/' + this.data.length) + ' ] entries - filter [ ' + green(this.filterString()) + ' ]'));
	}
}

// determine maximum string length for column
self.runColWidth = function(item) {
	for(let key in item) { // per record
		if(value = item[key]) {
			let length = self.getLength(value);
			if(!this.cache[key] || this.cache[key] < length) {
				this.cache[key] = length;
			}
		}
        }
};

// determine maximum string length for column
self.getLength = function(value) {
	switch(typeof(value)) {
		case "number":
			return value.toString().length;
		break;
		case "string":
			return value.length;
		break;
	}
};

// stringify this.filters[];
self.filterString = function() {
	let string = '';
	let comma = '';
	this.filters.map((filter) => {
		string += comma + filter.field + ':' + filter.value;
		comma = ',';
	});
	return string;
};

// parse and construct filter objects
self.buildFilters = function(string) {
	let filters = [];
	var rgxFilter = new RegExp('([^,:]+):([^,:]*)', 'g');
	while(m = rgxFilter.exec(string)) {
		let val1 = m[1];
		let val2 = m[2];
		filters.push({
			field: val1,
			value: val2
		});
	}
	if(filters.length == 0) {
		if(!string) string = '';
		filters.push({
			field: 'name',
			value: string
		});
	}
	filters.forEach((filter) => {
		this.addFilter(filter);
	});
};

// add map
self.addMap = function(field, mapper) {
	this.cell.addMap(field, mapper);
	return this;
};

// add filter
self.addFilter = function(filter) {
	this.filters.push(filter);
	this.cell.addFilter(filter);
	return this;
};

// filter and transform current view
self.run = function(data = this.data) {
	this.view = this.cell.run(data);
};
