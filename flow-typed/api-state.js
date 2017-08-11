declare type QueryState = {
	query: Query,
	response: ?QueryResponse,
};
declare type ApiState = {
	[string]: QueryResponse,
	inFlight: Array<string>,
	fail?: boolean,
};
