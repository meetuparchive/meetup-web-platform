declare type RouterTo = string | LocationShape | URL;

declare type Match = {
	params: Params,
	isExact: boolean,
	path: string,
	url: string,
};

declare type MatchedRoute = { route: PlatformRoute, match: Match };
declare type MatchPathOptions = {
	path: string,
	exact?: boolean,
	strict?: boolean,
};

declare module 'react-router-dom/matchPath' {
	declare function matchPath(
		pathname: string,
		options: MatchPathOptions
	): null | Match;
	declare module.exports: typeof matchPath;
}

declare type LocationShape = {
	pathname?: string,
	search?: string,
	hash?: string,
	state?: any,
};

declare class RouterRedirect extends React$Component<{
	to: string | LocationShape,
	push?: boolean,
}> {}
declare module 'react-router-dom/Redirect' {
	declare export default typeof RouterRedirect
}

declare type LocationAction = { type: string, payload: LocationShape };
