// @flow
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import {
	parseQueryResponse,
	MEMBER_COOKIE_NAME,
	getValidQueries,
} from '../util/fetchUtils';

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 */
export default (request: HapiRequest) => () => (
	queries: Array<Query>
): Promise<ParsedQueryResponses> => {
	const memberCookie = request.state[MEMBER_COOKIE_NAME];
	const validQueries = getValidQueries(memberCookie)(queries);
	return request
		.proxyApi$(validQueries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
		.toPromise()
		.then(parseQueryResponse(validQueries));
};
