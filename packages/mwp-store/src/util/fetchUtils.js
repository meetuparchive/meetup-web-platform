// @flow
const getIsLoggedIn = (member: ?Object) => Boolean((member || {}).id);
// Higher order function that provides a filtering function for queries based
// on logged-in status
export const getAuthedQueryFilter = (member: ?Object) => {
	const isLoggedIn = getIsLoggedIn(member);
	return (q: Query): boolean => isLoggedIn || !q.endpoint.includes('members/self');
};
/**
 * A module for middleware that would like to make external calls through `fetch`
 */
export const parseQueryResponse = (queries: Array<Query>) => (
	proxyResponse: ProxyResponse
): ParsedQueryResponses => {
	if (!proxyResponse.responses) {
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
