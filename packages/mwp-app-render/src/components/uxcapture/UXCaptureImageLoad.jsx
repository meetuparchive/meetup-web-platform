// @flow
import * as React from 'react';

type Props = React$ElementConfig<HTMLImageElement> & { mark: string };
type State = {
	loaded: boolean,
};

/**
 * Creates an image tag with provide props
 * and a UXCapture `onLoad` handler
 *
 * @see example https://github.com/meetup/ux-capture#image-elements
 */
export default class UXCaptureImageLoad extends React.Component<Props, State> {
	state = {
		loaded: false,
	};

	/*
	static getDerivedStateFromProps(nextProps: Props, prevState: State) {
		if (window && window.UX && window.UX[`${nextProps.mark}-LOADED`]) {
			console.log(`${nextProps.mark}-LOADED`);
			return {
				loaded: true,
			};
		}

		return null;
	}
	*/

	getOnLoadHTMLString = mark => {
		const onload = `
			if (window.UX && !window.UX[${mark}-LOADED]) {
				window.UX.mark('${mark}');
				console.log('MARKED: ${mark}');
			} else {
				window.UX[${mark}-LOADED] = true;
			}
		`;

		// Replace newlines and tabs with space characters
		return onload.replace(/[\n\t]+/g, ' ');
	};

	getPropsAsHTMLAttrString = props => {
		// TODO: other props need to be mapped from camelCase / JSX syntax
		return Object.keys(props).map(prop => `${prop}="${props[prop]}"`).join(' ');
	};

	render() {
		const { mark, src, ...other } = this.props;

		/*
		if (this.state.loaded) {
			return <img src={src} {...other} />;
		}
		*/

		const onLoadHTML = this.getOnLoadHTMLString(mark);
		const otherHTMLAttributes = this.getPropsAsHTMLAttrString(other);

		return (
			<div
				dangerouslySetInnerHTML={{
					__html: `
					<img id="ux-capture-${mark}" src="${src}" onload="${onLoadHTML}" ${otherHTMLAttributes} />
				`,
				}}
			/>
		);
	}
}
