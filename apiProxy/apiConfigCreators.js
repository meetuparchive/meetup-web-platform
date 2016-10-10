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
 * Single category groups, grouped by topic
 */
export function category_groups(params) {
	params.fields = params.fields ? `${params.fields},photo_gradient` : 'photo_gradient';
	return {
		endpoint: 'recommended/group_topics/binge',
		params
	};
}

/**
 * Groups matching a param
 */
export function find_groups(params) {
	params.fields = params.fields ? `${params.fields},photo_gradient` : 'photo_gradient';
	return {
		endpoint: 'find/groups',
		params
	};
}

/**
 * Topics
 */
export function topic(params) {
	return {
		endpoint: 'topics',
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
 * profiles
 *
 * Note, this is group-specific information, general Meetup user info is 'Members'
 */
export function profile(params) {
	const pathExtension = params.id ? `/${params.id}` : '';
	return {
		endpoint: `${params.urlname}/members${pathExtension}`,
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
 * open events
 */
export function open_events(params) {
	params.fields = ['rsvp_sample'];
	return {
		endpoint: '2/open_events',
		params
	};
}

/**
 * attendees (RSVPs)
 */
export function rsvps(params) {
	return {
		endpoint: '${params.urlname}/events/${params.eventId}/rsvps',
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

