#!/usr/bin/env node
const self = xcell.prototype;

// constructor
function xcell(opts) {
	this.data = opts.data.map(a => ({...a})); // deep copy
	this.view = [];
	this.maps = [];
}
module.exports = xcell;

// add map
self.addMap = function(field, rule) {
	this.maps.push({
		'field': field,
		'rule': rule
	});
	return this;
};

// add filter
self.addFilter = function(f) {
	return this.addMap(f.field, (val) => {
		if(typeof(val) === 'string' && val.match(new RegExp(f.value, 'i'))) {
			return val;
		} else {
			return null;
		}
	});
};

// check type and translate record
self.modify = function(m, item) {
	if(typeof(m.rule) === 'function') {
		return (item[m.field] = m.rule(item[m.field]));
	} else {
		return (item[m.field] = m.rule);
	}
};

// filter and transform current view
self.run = function(data = this.data) {
	return this.view = data.filter((item) => {
		return this.maps.every((m) => {
			return this.modify(m, item);
		});
	});
};
