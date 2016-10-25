import crypto from 'crypto';

/**
 * Utility methods for working with duotone URLs
 *
 * @module duotone
 */

/**
 * The canonical string reference to a duotone is the 'spec'
 * defined by the photo scaler routing rules.
 *
 * @link www.meetup.com/meetup_api/docs/sign/photo_transform/
 * @param {String} light the hex value for the 'light' color of the duotone
 * @param {String} dark the hex value for the 'dark' color of the duotone
 */
export function duotoneRef(light, dark) {
	return `dt${dark}x${light}`;
}

// duotone pairs in the format [multiply, screen] (or [light, dark])
const HYPERCOLOR = ['ff7900', '7700c8'];
const SIZZURP = ['48ffcb', '8a00eb'];
const JUNIOR_VARSITY = ['ffc600', '2737ff'];
const MIGHTY_DUCKS = ['00d8ff', 'fa002f'];
const MERMAID = ['36c200', '002fff'];
const GINGER_BEER = ['ffde00', '55005a'];
const BUBBLICIOUS = ['ff646a', '000ddf'];
const LEMON_LIME = ['fed239', '36c200'];

/**
 * Supported duotone color pairs (hex)
 *
 * @link {https://meetup.atlassian.net/wiki/pages/viewpage.action?pageId=19234854}
 * @const
 */
export const duotones = [
	HYPERCOLOR,
	SIZZURP,
	JUNIOR_VARSITY,
	MIGHTY_DUCKS,
	MERMAID,
	GINGER_BEER,
	BUBBLICIOUS,
	LEMON_LIME,
];

/**
 * Server-side utilities for managing signed duotone photo scaler URLs
 *
 * **Important** Do not import this module in client-side code
 *
* - All duo-toning is done in the photo scaler (http://photos1.meetupstatic.com/photo_api/...)
 *   the duotoned images aren't saved anywhere
 * - The photo scaler requires signed URLs in order to ensure that requests are
 *   coming from "authorized" clients that aren't going to DDoS it.
 * - The URL signature corresponds to a particular photo scaler transform 'spec',
 *   including dimensions, which can then be applied to any photo. The REST API
 *   does not provide the duotoned URLs because they tend to be application-
 *   specific - it just returns a pair of hex values corresponding to the
 *   duotone 'light_color' and 'dark_color'.
 * - In order to sign the URL, the application needs a secret salt for the hash,
 *   which means the signing needs to happen on the server for a fixed set of
 *   transformations (one for each duotone color pair).
 * - Once the server has the signed URLs (which never change - they can be
 *   applied to any photo ID), it needs to send them to the client through
 *   application state, which is the only data link that currently exists
 *   between the server and the application.
 *
 * @module duotoneServer
 */

/**
 * Using a passed in *SECRET* salt, generate the photo scaler URL templates
 * in the format described by the sign/photo_transform API. Return the values
 * in an object keyed by the duotone 'spec'
 *
 * @link {https://www.meetup.com/meetup_api/docs/sign/photo_transform/}
 * @param {String} salt The salt used by all platforms generating signed URLs
 * for the photo scaler - this is a shared secret that should *never* be
 * managed on the client
 * @param {Array} duotone [light, dark] hex codes for a duotone pair
 * @return {Object} a [duotoneRef]: URLroot key-value pair
 */
export function generateSignedDuotoneUrl(salt, [light, dark]) {
	const ref = duotoneRef(light, dark);
	const spec = `event/rx300x400/${ref}`;
	const signature = crypto.createHash('sha1').update(`${spec}${salt}`).digest('hex').substring(0, 10);
	return {
		[ref]: `http://photos1.meetupstatic.com/photo_api/${spec}/sg${signature}`
	};
}

/**
 * Build the complete "[ref]: urlroot" object containing signed url roots for
 * all the supported duotone pairs
 *
 * @param {String} PHOTO_SCALER_SALT **Secret** salt for generating signed urls
 */
export const getDuotoneUrls = (duotones, PHOTO_SCALER_SALT) => {
	return duotones.reduce((duotoneMap, [light, dark]) => ({
		...duotoneMap,
		...generateSignedDuotoneUrl(PHOTO_SCALER_SALT, [light, dark])
	}), {});
};

