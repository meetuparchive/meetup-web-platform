// @flow
declare var Intl: Object;

declare type FluxStandardAction = {
	type: string,
	payload: Object | Array<any>,
	meta?: any,
	error?: boolean
};

declare type Reducer = (state: Object, action: FluxStandardAction) => Object;

// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	params?: Object,
	type?: string,
	meta?: {
		flags?: Array<string>,
		method?: string
	},
}

declare type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
};

