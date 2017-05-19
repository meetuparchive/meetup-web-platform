// @flow
declare type Logger = (Object, Object) => mixed;
declare type Tracker = (response: Object, ...args: Array<any>) => mixed;
declare type TrackOpts = {
	log: Logger,
	trackIdCookieName: string,
	sessionIdCookieName: string,
	cookieOpts: CookieOpts,
};
declare type TrackGetter = TrackOpts => Tracker;
