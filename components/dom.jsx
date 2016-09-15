import React from 'react';
import Helmet from 'react-helmet';
import escapeHtml from 'escape-html';
import { getLocaleCode } from '../util/localizationUtils';

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
 * @module DOM
 */
const DOM = (props) => {
	const {
		initialState,
		appMarkup,
		CONFIG
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

	const localeCode = getLocaleCode(initialState.app.self.value);

	return (
		<html>
			<head>
				{head.title.toComponent()}
				{head.meta.toComponent()}
				{head.link.toComponent()}
			</head>
			<body style={{ margin: 0, fontFamily:'sans-serif' }}>
				<div id='outlet' dangerouslySetInnerHTML={getInnerHTML(appMarkup)} />
				<script dangerouslySetInnerHTML={getInnerHTML(`window.INITIAL_STATE=${JSON.stringify(INITIAL_STATE_SAFE_JSONABLE)};`)} />
				<script src={`//${CONFIG.ASSET_SERVER_HOST}:${CONFIG.ASSET_SERVER_PORT}/${localeCode}/client.js`} />
			</body>
		</html>
	);
};

DOM.propTypes = {
	initialState: React.PropTypes.object.isRequired,
	appMarkup: React.PropTypes.string,
	CONFIG: React.PropTypes.object,
};

export default DOM;
