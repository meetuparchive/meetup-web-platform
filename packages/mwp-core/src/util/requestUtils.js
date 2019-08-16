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
 * Returns a client geo location map derived from request properties
 *
 * Usually, the parameters are supplied by Fastly custom headers
 *
 * - `x-region`: a string in the format '[countrycode]/[regioncode]'
 * - `x-fastly-geo-city': city name as determined by Fastly
 * - `x-fastly-geo-latlon: string of '[latitude],[longitude]' floats
 *
 * Alternatively, override these value (or supply in dev) using querystring params
 *
 * - `__geo-region`
 * - `__geo-city`
 * - `__geo-latlon`
 */
export const getRemoteGeoLocation = (request: HapiRequest): GeoLocation => {
	const { headers, query } = request;
	const geoLocation: GeoLocation = {};

	// COUNTRY + REGION
	const location = query['__geo-region'] || headers['x-region'] || '';
	const [country, region] = location.split('/');
	if (country) {
		geoLocation.country = country;
	}
	if (region) {
		geoLocation.region = region;
	}

	// CITY
	const city = query['__geo-city'] || headers['x-fastly-geo-city'];
	if (city) {
		geoLocation.city = city;
	}

	// LATITUDE/LONGITUDE
	const [lat = NaN, lon = NaN] = (
		query['__geo-latlon'] ||
		headers['x-fastly-geo-latlon'] ||
		''
	)
		.split(',')
		.map(parseFloat);
	if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
		geoLocation.latlon = [lat, lon];
	}

	return geoLocation;
};
