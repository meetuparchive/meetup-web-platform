/**
 * These function convert params captured from the URL by React Router into
 * an `endpoint` and `params` that will be used to make a call to the Meetup
 * API
 *
 * @module apiConfigCreators
 */

/**
 * For the home/Find page - always uses the self/home endpoint
 */
export function home(params) {
	params.fields = params.fields ? `${params.fields},photo_gradient` : 'photo_gradient';
	return {
		endpoint: 'self/home',
		params
	};
}

/**
 * all the group-related endpoints
 */
export function group(params) {
	params.fields = params.fields ? `${params.fields},photo_gradient` : 'photo_gradient';
	const endpoint = params.self ? 'self/groups' : params.urlname;
	return {
		endpoint,
		params
	};
}

/**
 * all the endpoints that return event objects
 */
export function event(params) {
	params.fields = ['rsvp_sample'];
	const pathExtension = params.id ? `/${params.id}` : '';
	return {
		endpoint: `${params.urlname}/events${pathExtension}`,
		params
	};
}

/**
 * member object endpoints
 *
 * Note, this is different than 'Profiles' which are used to represent the
 * group-specific profile informat for a member within a group context
 */
export function member(params) {
	return {
		endpoint: `2/member/${params.id}`,
		params
	};
}

/**
 * login endpoint - 'sessions/'
 */
export function login(params) {
	return {
		endpoint: 'sessions',
		params
	};
}

