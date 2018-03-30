import React from 'react';
import PropTypes from 'prop-types';

class StylesContextProvider extends React.Component {
	getChildContext() {
		return { insertCss: this.props.onInsertCss };
	}
	render() {
		return React.Children.only(this.props.children);
	}
};

StylesContextProvider.childContextTypes = {
	children: PropTypes.element.isRequired,
	insertCss: PropTypes.func.isRequired,
};

export default StylesContextProvider;
