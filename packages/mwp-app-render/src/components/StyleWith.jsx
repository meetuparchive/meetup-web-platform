import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

/**
 * @module StyleWith
 *
 * Adds style module CSS to `head` for both
 * server and client render via `Helmet`.
 *
 * Usage:
 * ```
 * import StyleWith from 'mwp-app-render/lib/components/StyleWith';
 * import styles from './myComponent.module.scss';
 *
 * const MyComponent = (props) => {
 *		return (
 *			<StyleWith styles={styles}>
	 *			<p className={styles.someClass}>Hello world!</p>
 *			</StyleWith>
 *		);
 * };
 * ```
 */
const StyleWith = props => {
	const { styles, children } = props;

	const moduleCSS = new Set();
	styles.forEach(style => {
		moduleCSS.add(style._getCss()); // eslint-disable-line no-underscore-dangle
	});

	return (
		<div>
			<Helmet defer={false}>
				<style type="text/css">
					{[...moduleCSS].join('')}
				</style>
			</Helmet>
			{children}
		</div>
	);
};
StyleWith.propTypes = {
	styles: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default StyleWith;
