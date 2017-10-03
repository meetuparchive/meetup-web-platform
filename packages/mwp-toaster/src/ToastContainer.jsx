/*
 * 1. Creating toasts should _always_ be a Redux action, e.g. TOAST_MAKE
 * 2. TOAST_MAKE will go through the platform reducer to populate an array in {{state.toast.ready}}
 * 3. When the ToastMaster is instantiated, it will consume {{state.toast.ready}} and dispatch a new action TOAST_SHOW
 * 4. TOAST_SHOW will _clear_ {{state.toast.ready}}
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Toaster from 'meetup-web-components/lib/Toaster';
import Toast from 'meetup-web-components/lib/Toast';
import { showToasts } from './actions';
import { getReadyToasts } from './selectors';

const mapStateToProps = state => ({ ready: getReadyToasts(state) });
const mapDispatchToProps = { showToasts };

/*
 * This component does *not* support server-rendered toasts. It must mount before
 * toasts are added to application state through `makeToast`.
 */
export class ToastContainer extends React.Component {
	// Custom 'shouldComponentUpdate' in order to avoid re-rendering when there are
	// no new toasts
	shouldComponentUpdate(nextProps) {
		return nextProps.ready.length > 0 && nextProps.ready !== this.props.ready;
	}
	componentDidUpdate() {
		this.props.showToasts(); // dispatch action to tell app that toasts are shown
	}
	render() {
		return (
			<Toaster
				toasts={this.props.ready.map((t, i) => <Toast {...t} key={i} />)}
			/>
		);
	}
}

ToastContainer.propTyes = {
	ready: PropTypes.arrayOf(PropTypes.object),
};

export default connect(mapStateToProps, mapDispatchToProps)(ToastContainer);
