/**
 * A module for middleware that would like to make external calls through `fetch`
 * @module fetchUtils
 */

export const parseQueryResponse = queries => ({
	responses,
	error,
	message,
}) => {
	if (error) {
		throw new Error(JSON.stringify({ error, message })); // treat like an API error
	}
	responses = responses || [];
	if (queries.length !== responses.length) {
		throw new Error('Responses do not match requests');
	}

	return responses.reduce(
		(categorized, response, i) => {
			const targetArray = response.error
				? categorized.errors
				: categorized.successes;
			targetArray.push({ response, query: queries[i] });
			return categorized;
		},
		{ successes: [], errors: [] }
	);
};
