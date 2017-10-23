// @flow
import querystring from 'querystring';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { parseQueryResponse, getAuthedQueryFilter } from '../util/fetchUtils';

const isProd = process.env.NODE_ENV === 'production';
const getCookieMember = memberCookie => {
	const memberObj = querystring.parse(memberCookie);
	memberObj.id = memberObj.id ? parseInt(memberObj.id, 10) : 0;
	return memberObj;
};
/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 */
export default (request: HapiRequest) => () => (
	queries: Array<Query>
): Promise<ParsedQueryResponses> => {
	const member = getCookieMember(
		request.state[isProd ? 'MEETUP_MEMBER' : 'MEETUP_MEMBER_DEV']
	);
	const authedQueries = getAuthedQueryFilter(member);
	const validQueries = queries.filter(authedQueries);
	return request
		.proxyApi$(validQueries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
		.toPromise()
		.then(parseQueryResponse(validQueries));
};
