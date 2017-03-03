import React from 'react';
import { connect } from 'react-redux';

export const fooPathContent = 'Looking good';

function mapStateToProps(state) {
	console.log(JSON.stringify(state));
	return {
		data: (state.app.foo || {}).value
	};
}

/**
 * @module MockContainer
 */
class MockContainer extends React.Component {
	render() {
		return (
			<div>
				{fooPathContent}
				{JSON.stringify(this.props.data || 'nope', null, 2)}
			</div>
		);
	}
}

export default connect(mapStateToProps)(MockContainer);

