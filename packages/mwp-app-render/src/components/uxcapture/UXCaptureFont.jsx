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
            if (window.UX) {
                window.UX.mark('${mark}');
            }
        }
    });
`;

// fontFamily attribute should include individual weights if separate files are used
// Example: "Graphik Meetup:n4,n5,n6"
// Attention, if no weight specified, only n4 (e.g. font-weight: 400) is tested for!
// See https://github.com/typekit/webfontloader#events for more detail
const UXCaptureFont = ({ fontFamily, mark }: Props) =>
	<script
		dangerouslySetInnerHTML={{
			__html: generateUXCaptureFontJS(fontFamily, mark),
		}}
	/>; // eslint-disable-line react/no-danger

export default UXCaptureFont;
