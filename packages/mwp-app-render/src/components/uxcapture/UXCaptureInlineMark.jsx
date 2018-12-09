// @flow
import React from 'react';

type Props = {
	mark: string,
};

const markJsString = (mark: string) => `
	if(window.UXCapture) {
		window.UXCapture.mark("${mark}");
	}
`;

const clearMark = (mark: string) => {
	if (window.UXCapture) {
		window.UXCapture.clearMark(this.props.mark);
	}
};
const recordMark = (mark: string) => {
	if (window.UXCapture) {
		window.UXCapture.mark(mark);
	}
};
// inject inline UXCapture.mark() call into rendered markup
// @see https://github.com/meetup/ux-capture#text-without-custom-font
class UXCaptureInlineMark extends React.Component<Props> {
	// when mounting on client, only call mark if mark does not already exist
	componentDidMount() {
		recordMark(this.props.mark);
	}
	// updated on client - if mark name has changed, clear old mark and trigger new
	componentDidUpdate(prevProps: Props) {
		const { mark } = this.props;
		if (prevProps.mark !== mark) {
			clearMark(prevProps.mark);
			recordMark(mark);
		}
	}
	// clear associated mark
	componentWillUnmount() {
		clearMark(this.props.mark);
	}
	render() {
		<div
			// eslint-disable-next-line react/no-danger
			dangerouslySetInnerHTML={{
				__html: `<script>${markJsString(this.props.mark)}</script>`,
			}}
		/>;
	}
}

export default UXCaptureInlineMark;
