/**
 * Style module objects are expected to have className keys with
 * localized className values.
 *
 * This Proxy will return the name of the key being accessed, so snapshots
 * will be rendered with plain, unlocalized class names.
 */
const styleMock = new Proxy(
	{},
	{
		get: (target, key) => {
			if (key === '__esModule') {
				return false;
			}
			return key;
		},
	}
);

module.exports = styleMock;
