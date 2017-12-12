const path = require('path');
/**
 * This loader MUST be used immediate after a module the produces a string when
 * executed, e.g. css-loader
 *
 * @param {String} source the module contents as a string delivered by the
 *   previous loader in the chain, e.g. from css-loader
 *   ```
 *   exports = module.exports = require("./../../../node_modules/css-loader/lib/css-base.js")();
 *   exports.push([module.id, "foo {\n  bar: 100; }\n", ""]);
 *   ```
 *
 * @return {String} the results of evaluating the source script
 */
module.exports = function(source) {
	this.cacheable && this.cacheable();
	/*
	 * We need to 'run' the module in its current state, which means `eval`ing
	 * the file contents contained in `source`. Node modules typically assign
	 * `module.exports`, but may also assign global `exports` variable -
	 * css-loader does both, so we need to 'capture' those values without
	 * allowing them to bubble up the global scope of this module.
	 *
	 * We therefore assign block-scoped `module` and `exports` variables that
	 * will be populated by the script when it is `eval`ed in-scope
	 */
	const module = {};
	let exports; // eslint-disable-line no-unused-vars

	/*
	 * css-loader also writes a `require` statement that contains a path relative
	 * to the script that `require`d it. We need to re-write this path so that
	 * it can be applied from this loader. Since it's a path to `node_modules`,
	 * and 	node_modules` is on the NODE_PATH for this loader, we can strip out
	 * the relative path to `node_modules/`
	 */
	const relativeNodePath = new RegExp(
		`\\..?\\${path.sep}(?:\\.{2}\\${path.sep})*node_modules\\${path.sep}`
	);
	const nodeSource = source.replace(relativeNodePath, '');

	// EVAL - safe because we are eval'ing webpack modules, not user content
	eval(nodeSource);

	// the eval has populated `module.exports` - we want the string version
	return module.exports.toString();
};
