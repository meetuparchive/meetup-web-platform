// @flow
declare var Intl: Object;

declare type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean,
};

declare type Reducer = (state: ?Object, action: FluxStandardAction) => Object;

// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	params?: Object,
	type?: string,
	meta?: {
		flags?: Array<string>,
		method?: string,
	},
};

declare type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
};

declare type QueryFunction = (location: Object) => Query;

type _RouteBase = {
	path?: string,
	exact?: boolean,
	query?: QueryFunction,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
};

declare type AsyncPlatformRoute = _RouteBase & {
	load: () => Promise<React$Element<any>>,
};

declare type SyncPlatformRoute = _RouteBase & {
	component: React$Element<any>,
};

declare type PlatformRoute = AsyncPlatformRoute | SyncPlatformRoute;
