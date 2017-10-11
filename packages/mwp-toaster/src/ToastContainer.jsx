/*
 * 1. Creating toasts should _always_ be a Redux action, e.g. TOAST_MAKE
 * 2. TOAST_MAKE will go through the platform reducer to populate an array in {{state.toast.ready}}
 * 3. When the ToastMaster is instantiated, it will consume {{state.toast.ready}} and dispatch a new action TOAST_SHOW
 * 4. TOAST_SHOW will _clear_ {{state.toast.ready}}
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import withRouter from 'react-router-dom/withRouter';
import Toaster from 'meetup-web-components/lib/interactive/Toaster';
import Toast from 'meetup-web-components/lib/interactive/Toast';
import { makeToast, showToasts } from './actions';
import { getReadyToasts } from './reducer';

const mapStateToProps = state => ({ ready: getReadyToasts(state) });
const mapDispatchToProps = { makeToast, showToasts };

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
	/*
	 * When mounting on the client, check the current querystring params to
	 * determine whether there is a 'sysmsg' that should be displayed
	 * 
	 * This only needs to run on mount because it is only used for full-page
	 * renders linked from chapstick
	 */
	componentDidMount() {
		this.props.showToasts(); // dispatch action to tell app that toasts are shown
		const { location: { search }, sysmsgsKey, sysmsgs } = this.props;
		if (search) {
			const searchParams = new URLSearchParams(search);
			const sysmsgToast = sysmsgs[searchParams.get(sysmsgsKey)];
			if (sysmsgToast) {
				this.props.makeToast(sysmsgToast);
			}
		}
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
	makeToast: PropTypes.func.isRequired, // provided by `mapDispatchToProps`
	ready: PropTypes.arrayOf(PropTypes.object), // array of Toast props from `mapStateToProps`
	sysmsgs: PropTypes.object.isRequired, // map of sysmsg to <Toast> props
	sysmsgsKey: PropTypes.string.isRequired, // querystring param key
	showToasts: PropTypes.func.isRequired, // provided by `mapDispatchToProps`
	location: PropTypes.object.isRequired, // provided by `withRouter`
};
ToastContainer.defaultProps = {
	sysmsgsKey: 'sysmsg', // e.g. ?sysmsg=account_suspended
	sysmsgs: {},
};

export default connect(mapStateToProps, mapDispatchToProps)(
	withRouter(ToastContainer)
);
