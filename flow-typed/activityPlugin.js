// @flow
declare type Logger = (Object, Object) => mixed;
declare type Tracker = (...args: Array<any>) => mixed;
declare type TrackOpts = {
	log: Logger,
	trackIdCookieName: string,
	sessionIdCookieName: string,
};
type Request = Object;
declare type TrackGetter = TrackOpts => Request => Tracker;
