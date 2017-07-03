// @flow
import React from 'react';
import RouterLink from 'react-router-dom/Link';
import { testForExternal } from './util';

type LinkProps = {
	to: string | LocationShape,
	replace?: boolean,
	children?: React$Element<*>,
};
export default class Link extends React.PureComponent {
	props: LinkProps;
	render() {
		const { to, children, ...props } = this.props;
		if (to instanceof URL || testForExternal(to)) {
			// external link - render a standard anchor tag
			return <a href={to.toString()} {...props}>{children}</a>;
		}
		// internal route URL - Delegate to react-router <Link>
		return <RouterLink to={to} {...props}>{children}</RouterLink>;
	}
}
