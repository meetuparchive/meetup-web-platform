// @flow
import querystring from 'querystring';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { parseQueryResponse, getAuthedQueryFilter } from '../util/fetchUtils';

const getCookieMember = memberCookie => {
	const memberObj = querystring.parse(memberCookie);
	memberObj.id = memberObj.id ? parseInt(memberObj.id, 10) : 0;
	return memberObj;
};

// prod API only needs to be set once, but is only accessible from the request object
let isProdApi;

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 */
export default (request: HapiRequest) => () => (
	queries: Array<Query>
): Promise<ParsedQueryResponses> => {
	if (isProdApi === undefined) {
		isProdApi = request.server.settings.app.api.isProd;
	}
	const member = getCookieMember(
		request.state[isProdApi ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV']
	);
	const authedQueries = getAuthedQueryFilter(member);
	const validQueries = queries.filter(authedQueries);
	return request
		.proxyApi$(validQueries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
		.toPromise()
		.then(parseQueryResponse(validQueries));
};
