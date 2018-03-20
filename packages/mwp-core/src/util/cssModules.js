// @flow
import { getStyles } from 'simple-universal-style-loader';

/**
 * Returns inline style tags from CSS accumulated by
 * `simple-universal-style-loader`. This allows us to
 * render styles from modules on the server.
 *
 * @returns {Array} - array of inline style tags
 */
export function getInlineStyleTags(): array {
	return getStyles() && getStyles()
		.map(style =>
			<style
				type="text/css"
				key={style.id}
			>
				{style.parts.map(part => part.css)}
			</style>
		);
};
