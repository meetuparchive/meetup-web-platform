// @flow

import React from 'react';
import PropTypes from 'prop-types';

// Production and dev keys
const GTM_KEY = process.env.NODE_ENV === 'production' ? 'GTM-T2LNGD' : 'GTM-W9W847';

/*
 * @description Gets google tag manager script tag
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
export const GoogleTagManagerScript = (key : string = GTM_KEY) => {
	const script = `
		(function(w,d,s,l,i){
			w[l]=w[l]||[];
			w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
			var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
			j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
			f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','${GTM_KEY}');`
	return <script dangerouslySetInnerHtml={{ __html: script }}></script>

};

GoogleTagManagerScript.propTypes = {
	key: PropTypes.string,
};

/*
 * @description Gets google tag manager noscript tag
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
export const GoogleTagManagerNoscript = (key : string  = GTM_KEY) => {
	const iframe = `
		<iframe
			src="https://www.googletagmanager.com/ns.html?id=${GTM_KEY}"
			height="0" width="0" style="display:none;visibility:hidden">
		</iframe>`;
	return <noscript dangerouslySetInnerHtml={{ __html: iframe }}></noscript>
};

GoogleTagManagerNoscript.propTypes = {
	key: PropTypes.string,
};
