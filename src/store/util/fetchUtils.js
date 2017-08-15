// @flow

/**
 * A module for middleware that would like to make external calls through `fetch`
 */
export const parseQueryResponse = (queries: Array<Query>) => (
	proxyResponse: ProxyResponse
): ParsedQueryResponses => {
	if (proxyResponse.error) {
		throw new Error(JSON.stringify(proxyResponse)); // treat like an API error
	}
	const { responses } = proxyResponse;
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
