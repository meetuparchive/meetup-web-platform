import querystring from 'querystring';
import Boom from 'boom';
import Joi from 'joi';
import rison from 'rison';
import { querySchema } from './util/validation';

export function parseRequestQueries(request) {
	const { method, mime, payload, query } = request;
	const queriesRison =
		(method === 'post' || method === 'patch' || method === 'put') &&
		mime !== 'multipart/form-data'
			? payload.queries
			: query.queries;

	if (!queriesRison) {
		return null;
	}

	try {
		const validatedQueries = Joi.validate(
			rison.decode_array(queriesRison),
			Joi.array().items(querySchema)
		);
		if (validatedQueries.error) {
			throw validatedQueries.error;
		}
		return validatedQueries.value;
	} catch (err) {
		// any parsing error is a _request_ error that should be handled gracefully
		return err;
	}
}

/*
 * The default API proxy handler - just calls the decorated `proxyApi` method
 * and serializes the API responses
 */
export default (request, h) => {
	const queries = parseRequestQueries(request);
	if (queries instanceof Error) {
		return Boom.badRequest(queries); // returns a 400 error response with error message
	}
	const activityHeader = request.headers['x-meetup-activity'];
	const activityInfo = activityHeader ? querystring.parse(activityHeader) : {};
	return request.proxyApi(queries, activityInfo).then(
		responses => h.response({ responses }).type('application/json'),
		err => err // 500 error - will only be thrown on bad implementation
	);
};
