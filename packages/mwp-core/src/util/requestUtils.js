// @flow

const HEADER_FASTLY_CLIENT_IP = 'fastly-client-ip';
const HEADER_FASTLY_X_REGION = 'x-region';

/**
 * Attempts to parse a client IP address from a request.
 *
 * @param request a request
 * @returns { string | undefined } maybe IP address
 */
export const getRemoteIp = (request: HapiRequest): ?string => {
	const { headers, info, query } = request;
	const fromQuery = query && query.__set_geoip && query.__set_geoip.toString();
	const fromHeaders = headers && headers[HEADER_FASTLY_CLIENT_IP];
	const fromInfo =
		info && typeof info.remoteAddress === 'string'
			? info.remoteAddress
			: undefined;

	return fromQuery || fromHeaders || fromInfo;
};

/**
 * Returns a client geo location provided by Fastly.
 *
 * @param request a request
 * @returns {GeoLocation} a client geo location
 */
export const getRemoteGeoLocation = (request: HapiRequest): GeoLocation => {
	const { headers } = request;

	const location = (headers && headers[HEADER_FASTLY_X_REGION]) || '';
	const [country, region] = location.split('/');

	const geoLocation: GeoLocation = {};

	if (country) {
		geoLocation.country = country;
	}
	if (region) {
		geoLocation.region = region;
	}

	return geoLocation;
};
