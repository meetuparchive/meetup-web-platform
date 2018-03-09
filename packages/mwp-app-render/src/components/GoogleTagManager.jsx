// @flow

import React from 'react';
import PropTypes from 'prop-types';

const GTM_KEYS = {
	'prod': 'GTM-T2LNGD', 
	'dev': 'GTM-W9W847',
};

/*
 * @description Gets google tag manager script with key applied
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
const getScript = (key: string) => {
	const script = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${key}');` 
	return <script>{script}</script>
};

/*
 * @description Gets google tag manager noscript with key applied
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
const getNoscript = (key: string) => { 
	const src = `https://www.googletagmanager.com/ns.html?id=${key}`;
	return <noscript><iframe src={src} height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
};

/*
 * @description Gets a google tag manager content (script or noscript)
 * @see {@link https://developers.google.com/tag-manager/quickstart}
 * @example
 * <head>
 * 	<!-- GTM script -->
 * 	<GoogleTagManager item="script" rtf={true} isProd={true} />
 * </head>
 * <body>
 *	<div>app html</div>
 * 	<!-- GTM noscript -->
 * 	<GoogleTagManager item="noscript" rtf={true} isProd={true} />
 * </body>
*/
const GoogleTagManager = ({item, rtf = false, isProd = false}) => {
	
	if(!rtf) {
		return null;
	}

	const key = GTM_KEYS[isProd ? 'prod' : 'dev'];

	if(item === 'script') {
		return getScript(key);
	}

	if(item === 'noscript') {
		return getNoscript(key);
	}

};

GoogleTagManager.propTypes = {
	rtf: PropTypes.bool,
	isProd: PropTypes.bool,
	item: PropTypes.string.isRequired, 
};

export default GoogleTagManager;
