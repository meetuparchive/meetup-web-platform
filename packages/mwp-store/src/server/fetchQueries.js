// @flow
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { parseQueryResponse, getAuthedQueryFilter } from '../util/fetchUtils';

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 */
export default (request: HapiRequest) => (apiUrl, member) => (
	queries: Array<Query>
): Promise<ParsedQueryResponses> => {
	const authedQueries = getAuthedQueryFilter(member);
	const validQueries = queries.filter(authedQueries);
	return request
		.proxyApi$(validQueries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
		.toPromise()
		.then(parseQueryResponse(validQueries));
};
