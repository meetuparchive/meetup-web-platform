// @flow

const HEADER_FASTLY_CLIENT_IP = 'fastly-client-ip';

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
	const geoLocation: GeoLocation = {};

	// COUNTRY + REGION
	const location = headers['x-region'] || '';
	const [country, region] = location.split('/');
	if (country) {
		geoLocation.country = country;
	}
	if (region) {
		geoLocation.region = region;
	}

	// CITY
	const city = headers['x-geo-city'];
	if (city) {
		geoLocation.city = city;
	}

	// LATTITUDE/LONGITUDE
	const [lat = '', lon = ''] = (headers['x-geo-latlon'] || '')
		.split(',')
		.map(parseFloat);
	if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
		geoLocation.latlon = [lat, lon];
	}

	return geoLocation;
};
