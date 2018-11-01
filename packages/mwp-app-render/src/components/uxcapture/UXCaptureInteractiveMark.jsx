// @flow
import * as React from 'react';

type InteractiveMarkProps = {
	mark: string,
	children: React$Node,
};

// inject interactive UX.mark() call that only triggers in browser and not in in server-side render
// @see https://github.com/meetup/ux-capture#event-handler-attachment
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
