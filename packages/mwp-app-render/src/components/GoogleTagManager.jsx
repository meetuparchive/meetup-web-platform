// @flow

import React from 'react';
import PropTypes from 'prop-types';

// Runtime flag
export const GOOGLE_TAG_MANAGER_RTF = 'google_tag_manager';

// Production and dev keys
const GTM_KEYS = {
	'prod': 'GTM-T2LNGD', 
	'dev': 'GTM-W9W847',
};

/*
 * @description Gets google tag manager script with key applied
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
const getScript = (key: string) => {
	const script = `
		(function(w,d,s,l,i){
			w[l]=w[l]||[];
			w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
			var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
			j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
			f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','${key}');`
	return <script dangerouslySetInnerHtml={{ __html: script }} />
};

/*
 * @description Gets google tag manager noscript with key applied
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
const getNoscript = (key: string) => { 
	const iframe = `
		<iframe
			src="https://www.googletagmanager.com/ns.html?id=${key}"
			height="0" width="0" style="display:none;visibility:hidden">
		</iframe>`;
	return <noscript dangerouslySetInnerHtml={{ __html: iframe }}></noscript>
};

/*
 * @description Gets google tag manager tags (script or noscript)
 * @param {String} tag 'script' or 'noscript', indicating which GTM tag to return
 * @param {Boolean} rtf Whether or not the runtime flag is on or off
 * @param {Boolean} isProd Whether or not environment is production
 * @see {@link https://developers.google.com/tag-manager/quickstart}
 *
 * @example
 * <head>
 * 	<!-- GTM script -->
 * 	<GoogleTagManager tag="script" rtf={true} isProd={true} />
 * </head>
 * <body>
 * 	<!-- GTM noscript -->
 * 	<GoogleTagManager tag="noscript" rtf={true} isProd={true} />
 * </body>
*/
const GoogleTagManager = ({tag, rtf = false, isProd = false}) => {

	const validTagProp = ['script','noscript'].indexOf(tag) >= 0;
	
	if(!validTagProp || !rtf) {
		return null;
	}

	const key = GTM_KEYS[isProd ? 'prod' : 'dev'];

	if(tag === 'script') {
		return getScript(key);
	}

	if(tag === 'noscript') {
		return getNoscript(key);
	}

};

GoogleTagManager.propTypes = {
	rtf: PropTypes.bool,
	isProd: PropTypes.bool,
	tag: PropTypes.oneOf(['script','noscript']),
};

export default GoogleTagManager;
