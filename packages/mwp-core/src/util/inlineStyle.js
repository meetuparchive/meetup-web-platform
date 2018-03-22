// @flow

import React from 'react';
import { getStyles } from 'simple-universal-style-loader';

/**
 * Returns inline style tags from CSS accumulated by
 * `simple-universal-style-loader`. This allows us to
 * render styles from CSS modules on the server.
 *
 * @returns {Array} - array of style tags
 */
export function getInlineStyleTags(): Array<React$Element<'style'>> {
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
