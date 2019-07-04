// @flow

// GTM key for the default GTM container (www.meetup.com)
const GTM_KEY = 'GTM-T2LNGD';

// public auth key for GTM Environment (production/development)
const GTM_PUBLIC_AUTH =
	process.env.NODE_ENV === 'production'
		? 'KofUFmSzY9oFkO_VAgxnWA'
		: 'OtzciJkDXO73MJ5VH2mTsA';

// preview ID for the GTM Environment (production/development)
const GTM_PREVIEW_ID = process.env.NODE_ENV === 'production' ? 'env-1' : 'env-265';

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
export const getGoogleTagManagerSnippet = (
	gtmKey: string = GTM_KEY,
	gtmPublicAuth: string = GTM_PUBLIC_AUTH,
	gtmPreviewId: string = GTM_PREVIEW_ID
): string =>
	`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl+ '&gtm_auth=${gtmPublicAuth}&gtm_preview=${gtmPreviewId}&gtm_cookies_win=x';f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmKey}');`;
