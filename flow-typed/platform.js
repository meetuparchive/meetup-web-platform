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
	},
	plugins: {
		[string]: any,
	},
	route: (routes: HapiRoute | Array<HapiRoute>) => Promise<HapiServer>,
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
const HapiReplyFn = (reply: string | Object) => HapiReplyFn;
HapiReplyFn.continue = () => {};
HapiReplyFn.code = (code: number) => HapiReplyFn;
HapiReplyFn.redirect = (url: string) => ({
	permanent: (isPermanent: ?boolean) => HapiReplyFn,
});
HapiReplyFn.state = (key: string, value: string, opts: ?{ [string]: any }) =>
	HapiReplyFn;
HapiReplyFn.header = (key: string, value: string) => HapiReplyFn;

declare type HapiReply = typeof HapiReplyFn;

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
	reply: ?HapiReply
) => Promise<RenderResult>;

declare type FluxStandardAction = {
	type: string,
	payload?: any,
	meta?: any,
	error?: boolean,
};

// API query structure
declare type Query = {
	ref: string,
	endpoint: string,
	params?: Params,
	type?: string,
	meta?: {
		flags?: Array<string>,
		method?: string,
		noCache?: boolean,
	},
};

declare type QueryResponse = {
	ref: string,
	value: Object | Array<Object>,
	type?: string,
	flags?: Array<string>,
	meta?: Object,
	query?: Query,
};

declare type QueryFunction = (location: { [string]: mixed }) => Query;

declare type PlatformRoute = {
	component: React$ComponentType<*>,
	getNestedRoutes?: () => Promise<Array<PlatformRoute>>,
	getIndexRoute?: () => Promise<PlatformRoute>,
	path?: string,
	exact?: boolean,
	strict?: boolean,
	query?: QueryFunction | Array<QueryFunction>,
	indexRoute?: PlatformRoute,
	routes?: Array<PlatformRoute>,
};

declare type CookieOpts = {
	path?: string,
	isHttpOnly?: boolean,
	isSecure?: boolean,
	encoding?: string,
};
