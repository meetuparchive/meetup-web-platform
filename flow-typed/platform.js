// @flow
declare var Intl: Object;

declare type MatchMedia = {
	isAtSmallUp: boolean,
	isAtMediumUp: boolean,
	isAtLargeUp: boolean,
};

declare type MWPState = {
	api: ApiState,
	flags?: { [string]: boolean | string },
	config: {
		apiUrl: string,
		baseUrl: string,
		enableServiceWorker: boolean,
		requestLanguage: string,
		supportedLangs: Array<string>,
		initialNow: number,
		isQL: boolean,
		variants: mixed,
		entryPath: string,
		media: MatchMedia,
	},
};

declare type Params = { [string]: string };

type RedirectResult = {|
	redirect: {
		url: string,
		permanent?: boolean,
	},
|};
type HTMLResult = {|
	statusCode: number,
	result: string,
|};
declare type RenderResult = RedirectResult | HTMLResult;

declare type LanguageRenderer = (
	request: HapiRequest,
	h: ?HapiResponseToolkit
) => Promise<RenderResult>;

declare type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean,
};

declare type QueryListParam = {|
	dynamicRef: string, // dynamic ref that will be kept forever
	merge?: {
		idTest: (Object, Object) => boolean, // test for same object identity
		sort: (Object, Object) => number, // test for order
	},
|};
// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	list?: QueryListParam,
	params?: Params,
	type?: string,
	mockResponse?: () => any,
	meta?: {
		flags?: Array<string>,
		method?: 'get' | 'post' | 'delete' | 'patch',
		noCache?: boolean,
		metaRequestHeaders?: Array<string>,
		variants?: {
			[string]: string | Array<string>,
		},
	},
};

declare type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
	query?: Query,
	error?: string,
};

declare type QueryFunction = (location: { [string]: mixed }, state: MWPState) => Query;

type BasePlatformRoute = {|
	path?: string,
	exact?: boolean,
	strict?: boolean,
	query?: QueryFunction | Array<QueryFunction>,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
|};

type AsyncPlatformRoute = {|
	...BasePlatformRoute,
	getComponent: () => Promise<React$ComponentType<*>>,
|};

type StaticPlatformRoute = {|
	...BasePlatformRoute,
	component: React$ComponentType<*>,
|};

declare type PlatformRoute = AsyncPlatformRoute | StaticPlatformRoute;

declare type CookieOpts = {
	path?: string,
	isHttpOnly?: boolean,
	isSecure?: boolean,
	encoding?: string,
};
