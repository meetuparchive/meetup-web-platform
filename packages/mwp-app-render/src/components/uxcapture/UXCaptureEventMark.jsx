// @flow
import * as React from 'react';

type onLoadHTMLElements =
	| React.Element<'iframe'>
	| React.Element<'img'>
	| React.Element<'input'>;

type Props = {
	mark: string,
	children: onLoadHTMLElements,
};

/**
 * takes only a *single* child element
 * and injects event based UX.mark() call into the child
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
export default ({ mark, children }: Props) => {
	// if child has on onLoad prop
	// don't do anything
	if (children.props.onLoad) {
		return children;
	}

	return React.cloneElement(children, {
		onLoad: `if(window.UX) { UX.mark('${mark}'); }`,
	});
};
