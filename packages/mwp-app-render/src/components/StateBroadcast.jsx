// @flow
import React from 'react';
import { connect } from 'react-redux';

type OwnProps = {||}; // expected to be called with NO props
type Props = {
	...OwnProps,
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
		return null;
	}
}

export default connect<Props, OwnProps, _, _, _, _>(
	mapStateToProps,
	() => ({})
)(StateBroadcastComponent);
