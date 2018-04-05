import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

/**
 * @module WriteStyles
 *
 * Adds style module CSS to `head` for both
 * server and client render via `Helmet`.
 *
 * Usage:
 * ```
 * import WriteStyles from 'mwp-app-render/lib/components/WriteStyles';
 * import styles from './myComponent.module.scss';
 *
 * const MyComponent = (props) => {
 *		return (
 *			<div>
	 *			<WriteStyles styles={styles} />
	 *			<p className={styles.someClass}>Hello world!</p>
 *			</div>
 *		);
 * };
 * ```
 */
const WriteStyles = props => {
	const moduleCSS = new Set();
	props.styles.forEach(style => {
		moduleCSS.add(style._getCss()); // eslint-disable-line no-underscore-dangle
	});

	return (
		<Helmet defer={false}>
			<style type="text/css">
				{[...moduleCSS].join('')}
			</style>
		</Helmet>
	);
};
WriteStyles.propTypes = {
	styles: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default WriteStyles;
