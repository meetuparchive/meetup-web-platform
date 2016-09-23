import React from 'react';
import Helmet from 'react-helmet';
import escapeHtml from 'escape-html';

function getInnerHTML(__html) {
	return {
		__html,
	};
}

/**
 * Module that builds html, head, and body elements
 * And inserts app markup in the body
 *
 * Elements should only be added inside head via Helmet
 * @see {@link https://github.com/nfl/react-helmet}
 *
 * This component solves some "hard" problems related to wrapping a React
 * application in the full HTML markup needed to render it on the server.
 *
 * 1. Passing server-side app state to the client-side JS application - the
 * `window.INITIAL_STATE` setting, which has a few subtle gotchas if
 * implemented differently
 * 2. `<head>` management through `react-helmet` - there are lots of ways of
 * doing this wrong or implementing a fragile/inflexible solution
 * 3. Using an injected variable to write the client JS application bundle path
 * - there are lots of ways to introduce bugs into alternative implementations.
 *
 * @module DOM
 */
const DOM = (props) => {
	const {
		clientFilename,
		assetPublicPath,
		initialState,
		appMarkup,
	} = props;

	/**
	 * `initialState` has untrusted user-generated content that needs to be
	 * written into the DOM inside a <script> tag.
	 *
	 * It needs to be transformed into a plain object containing only escaped content
	 */

	// stringify the whole object so that it can be escaped in one pass
	const initialStateJson = JSON.stringify(initialState);

	// escape the string
	const escapedState = escapeHtml(initialStateJson);

	// create a plain object with the escaped string to write to the DOM with JSON.stringify
	const INITIAL_STATE_SAFE_JSONABLE = {
		escapedState
	};

	// Extract the `<head>` information from any page-specific `<Helmet>` components
	const head = Helmet.rewind();

	return (
		<html>
			<head>
				{head.title.toComponent()}
				{head.meta.toComponent()}
				{head.link.toComponent()}
			</head>
			<body style={{ margin: 0, fontFamily:'sans-serif' }}>
				<div id='outlet' dangerouslySetInnerHTML={getInnerHTML(appMarkup)} />
				<script dangerouslySetInnerHTML={getInnerHTML(`window.__webpack_public_path__='${assetPublicPath}';`)} />
				<script dangerouslySetInnerHTML={getInnerHTML(`window.INITIAL_STATE=${JSON.stringify(INITIAL_STATE_SAFE_JSONABLE)};`)} />
				<script src={`${assetPublicPath}${clientFilename}`} />
			</body>
		</html>
	);
};

DOM.propTypes = {
	initialState: React.PropTypes.object.isRequired,
	appMarkup: React.PropTypes.string,
};

export default DOM;
