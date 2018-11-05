// @flow
import React from 'react';

type Props = {
	fontFamily: string,
	mark: string,
};

export const fontLoaderSrc =
	'https://ajax.googleapis.com/ajax/libs/webfont/1.5.10/webfont.js';

const generateUXCaptureFontJS = (fontFamily: string, mark: string) => `
    WebFont.load({
        custom: {
            families: ['${fontFamily}']
        },
        active: function() {
            window.performance.mark('${mark}');
        },
    });
`;
const UXCaptureFont = ({ fontFamily, mark }: Props) =>
	<script
		dangerouslySetInnerHTML={generateUXCaptureFontJS(fontFamily, mark)}
	/>; // eslint-disable-line react/no-danger

export default UXCaptureFont;
