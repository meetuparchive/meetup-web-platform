// @flow

import React from 'react';

// Production and dev keys
const GTM_KEY = process.env.NODE_ENV === 'production' ? 'GTM-T2LNGD' : 'GTM-W9W847';

/*
 * @description Gets google tag manager JS snippet
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
export const getGoogleTagManagerSnippet = (): string => (
	`(function(w,d,s,l,i){
		w[l]=w[l]||[];
		w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
		var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
		j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
		f.parentNode.insertBefore(j,f);
	})(window,document,'script','dataLayer','${GTM_KEY}');`
);

/*
 * @description Gets google tag manager noscript tag
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
export const GoogleTagManagerNoscript = () => {
	const iframe = `
		<iframe
			src="https://www.googletagmanager.com/ns.html?id=${GTM_KEY}"
			height="0" width="0" style="display:none;visibility:hidden">
		</iframe>`;
	return <noscript dangerouslySetInnerHTML={{ __html: iframe }}></noscript>
};
