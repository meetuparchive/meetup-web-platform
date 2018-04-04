// @flow

// Production and dev keys
const GTM_KEY =
	process.env.NODE_ENV === 'production' ? 'GTM-T2LNGD' : 'GTM-W9W847';

/**
 * @description Gets dataLayer initialization snippet with initial values provided
 * It's important to use this snippet before getGoogleTagManagerSnippet()
 * @see {@link https://developers.google.com/tag-manager/devguide#datalayer}
 */
export const getDataLayerInitSnippet = (data: { [string]: string }): string =>
	`dataLayer=[${data ? JSON.stringify(data) : ''}]`;

/**
 * @description Method for passing additional variables to GTM
 * @see {@link https://developers.google.com/tag-manager/devguide}
 */
export const gtmPush = (data: { [string]: string }) => {
	if (typeof window !== 'undefined') {
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push(data);
	}
};

/**
 * @description Gets google tag manager JS snippet
 * @see {@link https://developers.google.com/tag-manager/quickstart}
*/
export const getGoogleTagManagerSnippet = (): string =>
	`(function(w,d,s,l,i){
		w[l]=w[l]||[];
		w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
		var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
		j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
		f.parentNode.insertBefore(j,f);
	})(window,document,'script','dataLayer','${GTM_KEY}');`;
