// @flow
export const CACHE_SET = 'CACHE_SET';
export const CACHE_REQUEST = 'CACHE_REQUEST';
export const CACHE_SUCCESS = 'CACHE_SUCCESS';
export const CACHE_CLEAR = 'CACHE_CLEAR';

type QueryStateAC = QueryState => FluxStandardAction;

export const cacheSet: QueryStateAC = ({ query, response }) => ({
	type: CACHE_SET,
	payload: { query, response },
});

export const cacheRequest = (queries: Array<Query>) => ({
	type: CACHE_REQUEST,
	payload: queries,
});

export const cacheSuccess: QueryStateAC = ({ query, response }) => ({
	type: CACHE_SUCCESS,
	payload: { query, response },
});

export const cacheClear = () => ({
	type: CACHE_CLEAR,
});
