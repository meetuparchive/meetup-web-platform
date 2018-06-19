// @flow
import React from 'react';
import { connect } from 'react-redux';

type Props = {
	state: MWPState,
};
const mapStateToProps = state => ({ state });

export class StateBroadcastComponent extends React.PureComponent<Props> {
	componentDidMount() {
		window.getAppState = () => this.props.state;
	}
	render() {
		// don't actually need to render - this.props.state will always contain
		// latest Redux state
	}
}

export default connect(mapStateToProps, () => ({}))(StateBroadcastComponent);
