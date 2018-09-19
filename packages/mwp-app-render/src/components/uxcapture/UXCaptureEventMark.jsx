// @flow
import * as React from 'react';

type Props = {
	browserEvent: string,
	mark: string,
	children: React$Element<*>,
};

const generateUXCaptureJS = (mark: string) =>
	`if(window.UX) { UX.mark('${mark}'); }`;

/**
 * takes only a *single* child element
 * and injects event based UX.mark() call into the child
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
export default ({ browserEvent, mark, children }: Props) =>
	React.cloneElement(children, {
		[browserEvent]: generateUXCaptureJS(mark),
	});
