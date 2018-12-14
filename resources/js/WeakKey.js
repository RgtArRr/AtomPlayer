var map = new WeakMap();
var index = 0;

/**
 * Unique key value for an object,
 * useful for iterate list and you don't care about the fck unique-key c:
 */
module.exports.wk = function (obj) {
	var key = map.get(obj);
	if (!key) {
		key = 'wk-' + index++;
		map.set(obj, key);
	}
	return key;
};

/**
 * Random Key Value, useful if you don't care about the fck unique-key c:
 */
module.exports.rk = function () {
	return +new Date() + Math.random();
};