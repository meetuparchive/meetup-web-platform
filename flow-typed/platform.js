// @flow
declare var Intl: Object;

export type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean
};

export type Reducer = (state: Object, action: FluxStandardAction) => Object;

// API query structure
export type Query = {
	ref: string,
	endpoint: string,
	params?: Object,
	type?: string,
	meta?: {
		flags?: Array<string>,
		method?: string
	},
}

export type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
};

