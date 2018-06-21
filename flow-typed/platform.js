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
declare type HapiRequestUrl = URL & {
	path: string,
};
declare type HapiRoute = Object;
declare type HapiServer = {
	app: {
		logger: (...args: Array<any>) => void,
	},
	expose: (key: string, value: any) => void,
	settings: {
		app: { isProd: boolean, supportedLangs: Array<string>, [string]: any },
		api: { host: string, isProd: boolean },
	},
	plugins: {
		[string]: any,
	},
	route: (routes: HapiRoute | Array<HapiRoute>) => Promise<HapiServer>,
	on: (eventName: string, cb: () => void) => void,
};
declare type HapiRequest = {
	getLanguage: () => string,
	getLangPrefixPath: () => string,
	log: (Array<string>, string) => void,
	url: HapiRequestUrl,
	server: HapiServer,
	state: {
		[string]: string,
	},
	info: {
		referrer: string,
		host: string,
		[string]: mixed,
	},
	headers: {
		[string]: string,
	},
	[string]: any,
};

declare type HapiResponseObject = {
	app: any,
	events: any,
	headers: any,
	plugins: any,
	settings: any,
	source: any,
	statusCode: any,
	variety: any,
	bytes: any,
	charset: any,
	code: any,
	message: any,
	created: any,
	encoding: any,
	etag: any,
	header: any,
	location: any,
	redirect: any,
	replacer: any,
	spaces: any,
	state: any,
	suffix: any,
	ttl: any,
	type: any,
	unstate: any,
	vary: any,
	takeover: any,
	temporary: any,
	permanent: any,
	rewritable: any,
};

declare type HapiResponseToolkit = {
	abandon: any,
	close: any,
	context: any,
	continue: any,
	realm: any,
	request: any,
	authenticated: any,
	entity: any,
	redirect: any,
	response: (value: string) => HapiResponseObject,
	state: (key: string, value: string | Object, options: ?{ [string]: any }) => HapiResponseObject,
	unauthenticated: any,
	unstate: (key: string, options: ?{ [string]: any }) => HapiResponseObject,
};

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

declare type QueryFunction = (location: { [string]: mixed }) => Query;

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
