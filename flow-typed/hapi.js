// @flow

/**
 * @see Typescript HapiJS v17 https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/hapi/index.d.ts
 */

// ToDo: import { SealOptions, SealOptionsSub } from "iron";
declare type SealOptionsSub = any;
declare type SealOptions = any;

// ToDo: update to actual values
declare type HapiApplicationState = any;
declare type HapiResponseEvents = any;
declare type HapiPluginsStates = any;
declare type HapiResponseSettings = any;

declare type HapiRequestUrl = URL & {
	path: string,
};

declare type HapiHandlerReturnValue = HapiResponseObject | Error | string | { [string]: any };
declare type HapiHandler = (HapiRequest, HapiResponseToolkit) => HapiHandlerReturnValue | Promise<HapiHandlerReturnValue>;

declare type HapiRoute = Object;

declare type HapiResponseObjectHeaderOptions = {
	append?: boolean,
	separator?: string,
	override?: boolean,
	duplicate?: boolean,
};

declare type HapiServerStateCookieOptions = {
	ttl?: number | null,
	isSecure?: boolean,
	isHttpOnly?: boolean,
	isSameSite?: false | 'Strict' | 'Lax',
	path?: string | null,
	domain?: string | null,
	autoValue?: (request: HapiRequest) => void,
	encoding?: 'none' | 'base64' | 'base64json' | 'form' | 'iron',
	sign?: {
		integrity?: SealOptionsSub,
		password: string,
	},
	password?: string,
	iron?: SealOptions,
	ignoreErrors?: boolean,
	clearInvalid?: boolean,
	strictHeader?: boolean,
	passThrough?: any,
};

declare type HapiAuthenticationData = {
	credentials: Object,
	artifacts?: Object,
};

declare type HapiServerInfo = {
	id: string,
	created: number,
	started: number,
	port: number | string,
	host: string,
	address: void | string,
	protocol: 'http' | 'https' | 'socket',
	uri: string,
};

// ToDo: fill in the `any` types
declare type HapiServer = {
	app: {
		logger: (...args: any[]) => void,
	},
	auth: any,
	bind: (context: Object) => void,
	cache: any,
	decoder: (encoding: string, decoder: ((options: any) => any)) => void,
	decorate: (type: 'handler' | 'request' | 'toolkit' | 'server', property: string, method: (...args: any[]) => any, options?: {apply?: boolean, extend?: boolean}) => void,
	decorations: {
		request: string[],
		toolkit: string[],
		server: string[],
	},
	dependency: (dependencies: string | string[], after?: ((server: HapiServer) => Promise<void>)) => void,
	encoder: any,
	event: (events: any) => void,
	events: {
		on: (eventName: string, cb: () => void) => void,
	},
	expose: (key: string, value: any) => void,
	//expose: (obj: Object) => void,
	ext: (events: any) => void,
	ext: (event: any, method: any, options?: any) => void,
	info: HapiServerInfo,
	initialize: () => Promise<void>,
	inject: (options: any) => Promise<any>,
	listener: any,
	load: {
		eventLoopDelay: number,
		heapUsed: number,
		rss: number,
	},
	log: (tags: string | string[], data?: string | Object | (() => any), timestamp?: number) => void,
	lookup: (id: string) => any,
	match: (method: any, path: string, host?: string) => any,
	method: (...args: any[]) => void,
	methods: any,
	mime: any,
	path: (relativeTo: string) => void,
	plugins: {
		[string]: any,
	},
	realm: any,
	register: any,
	registrations: any,
	route: (route: HapiRoute | HapiRoute[]) => void,
	rules: (processor: any, options?: { validate: Object }) => void,
	settings: {
		app: { isProd: boolean, supportedLangs: string[], [string]: any },
		api: { host: string, isProd: boolean },
	},
	start: () => Promise<void>,
	state: (name: string, options?: HapiServerStateCookieOptions) => void,
	states: any,
	stop: (options?: { timeout: number }) => Promise<void>,
	table: (host?: string) => Array<{settings: any; method: any; path: string;}>,
	type: 'socket' | 'tcp',
	version: string,
};

declare type HapiRequest = {
	getLanguage: () => string,
	getLangPrefixPath: () => string,
	log: (string[], string) => void,
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

declare type HapiResponseValue = string | Object;

declare type HapiResponseObject = {
	app: HapiApplicationState,
	events: HapiResponseEvents,
	headers: any,
	plugins: HapiPluginsStates,
	settings: HapiResponseSettings,
	source: any,
	statusCode: number,
	variety: 'plain' | 'buffer' | 'stream',
	bytes: (length: number) => HapiResponseObject,
	charset: (charset: string) => HapiResponseObject,
	code: (statusCode: number) => HapiResponseObject,
	message: (httpMessage: string) => HapiResponseObject,
	created: (uri: string) => HapiResponseObject,
	encoding: (encoding: 'ascii' | 'utf8' | 'utf16le' | 'ucs2' | 'base64' | 'latin1' | 'binary' | 'hex') => HapiResponseObject,
	etag: (tag: string, options?: {weak: boolean, vary: boolean}) => HapiResponseObject,
	header: (name: string, value: string, options?: HapiResponseObjectHeaderOptions) => HapiResponseObject,
	location: (uri: string) => HapiResponseObject,
	redirect: (uri: string) => HapiResponseObject,
	replacer: any,
	spaces: (count: number) => HapiResponseObject,
	state: (name: string, value: Object | string, options?: HapiServerStateCookieOptions) => HapiResponseObject,
	suffix: (suffix: string) => HapiResponseObject,
	ttl: (msec: number) => HapiResponseObject,
	type: (mimeType: string) => HapiResponseObject,
	unstate: (name: string, options?: HapiServerStateCookieOptions) => HapiResponseObject,
	vary: (header: string) => HapiResponseObject,
	takeover: () => HapiResponseObject,
	temporary: (isTemporary: boolean) => HapiResponseObject,
	permanent: (isPermanent: boolean) => HapiResponseObject,
	rewritable: (isRewritable: boolean) => HapiResponseObject,
};

declare type HapiResponseToolkit = {
	abandon: any,
	close: any,
	context: any,
	continue: any,
	realm: any,
	request: HapiRequest,
	authenticated: (data: HapiAuthenticationData) => Object,
	entity: (options?: {etag?: string, modified?: string, vary?: boolean}) => HapiResponseObject | void,
	redirect: (uri?: string) => HapiResponseObject,
	response: (value?: HapiResponseValue) => HapiResponseObject,
	state: (key: string, value: string | Object, options?: HapiServerStateCookieOptions) => HapiResponseObject,
	unauthenticated: (error: Error, data?: HapiAuthenticationData) => void,
	unstate: (key: string, options?: HapiServerStateCookieOptions) => HapiResponseObject,
};