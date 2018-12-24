// @flow

const HEADER_FASTLY_CLIENT_IP = 'fastly-client-ip';
const HEADER_FASTLY_X_REGION = 'x-region';

/**
 * Populates a LaunchDarklyUser object with member and request properties.
 *
 * @param member  a member state object
 * @param request a request object
 */
export const getLaunchDarklyUser = (
	member: Object,
	request: HapiRequest
): LaunchDarklyUser => {
	const { id, name, email, country } = member;

	const ip = getRemoteIp(request);
	const key = (id && id.toString()) || '0';
	const anonymous = key === '0';
	const custom = getCustomAttributes(request);

	const user: LaunchDarklyUser = {
		key,
		anonymous,
		custom,
	};

	if (ip) {
		user.ip = ip;
	}
	if (name) {
		user.name = name;
	}
	if (email) {
		user.email = email;
	}
	if (country) {
		user.country = country;
	}

	return user;
};

const getRemoteIp = (request: HapiRequest): ?string => {
	const { headers, info, query } = request;
	const fromQuery = query && query.__set_geoip && query.__set_geoip.toString();
	const fromHeaders = headers && headers[HEADER_FASTLY_CLIENT_IP];
	const fromInfo =
		info && typeof info.remoteAddress === 'string'
			? info.remoteAddress
			: undefined;
	return fromQuery || fromHeaders || fromInfo;
};

const getCustomAttributes = (
	request: HapiRequest
): LaunchDarklyUser$CustomAttributes => {
	const { headers } = request;

	const location = (headers && headers[HEADER_FASTLY_X_REGION]) || '';
	const [country, region] = location
		.split('/')
		.map(value => (value ? value.toUpperCase() : value));

	const custom: LaunchDarklyUser$CustomAttributes = {};

	if (country) {
		custom.RequestCountry = country;
	}
	if (region) {
		custom.RequestRegion = region;
	}

	return custom;
};
