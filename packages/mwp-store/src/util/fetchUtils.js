// @flow
const isProd = process.env.NODE_ENV === 'production';
export const MEMBER_COOKIE_NAME = isProd
	? 'MEETUP_MEMBER'
	: 'MEETUP_MEMBER_DEV';
const getIsLoggedIn = (memberCookie: ?string) => {
	return memberCookie && !/id=0&/.test(memberCookie);
};
export const getValidQueries = memberCookie => (
	queries: Array<Query>
): Array<Query> => {
	const isLoggedIn = getIsLoggedIn(memberCookie);
	return queries.filter(
		q => isLoggedIn || !q.endpoint.includes('members/self') // remove members/self call for logged-out
	);
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
