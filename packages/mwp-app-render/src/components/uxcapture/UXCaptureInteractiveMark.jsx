// @flow
import * as React from 'react';

type InteractiveMarkProps = {
	mark: string,
	children: React$Node,
};

// inject inline UX.mark() call into rendered markup
// @see https://github.com/meetup/ux-capture#text-without-custom-font
class UXCaptureInteractiveMark extends React.Component<InteractiveMarkProps> {
	render() {
		return this.props.children;
	}

	componentDidMount() {
		if (window.UX) {
			window.UX.mark(this.props.mark);
		}
	}
}
export default UXCaptureInteractiveMark;
