import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { parseQueryResponse } from '../util/fetchUtils';

/**
 * on the server, we can proxy the API requests directly without making a
 * request to the server's own API proxy endpoint
 *
 * @param {Object} request Hapi request
 * @return {Promise} a promise that resolves with the parsed query responses
 *   from the REST API
 */
export default request => () => queries =>
	request
		.proxyApi$(queries)
		.map(responses => ({ responses })) // package the responses in object like the API proxy endpoint does
		.toPromise()
		.then(parseQueryResponse(queries));
