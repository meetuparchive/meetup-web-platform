declare type ProxyResponseSuccess = {|
	responses: Array<QueryResponse>,
|};
declare type ProxyResponseError = {|
	error: string,
	message: string,
|};

declare type ProxyResponse = ProxyResponseSuccess | ProxyResponseError;
