import React from 'react';
import { shallow } from 'enzyme';
import Toaster from 'meetup-web-components/lib/interactive/Toaster';
import { ToastContainer } from './ToastContainer';

describe('ToastContainer', () => {
	const toastProps = {};
	const sysmsgs = {
		foo: toastProps,
		bar: toastProps,
	};
	const props = {
		readyToasts: [toastProps],
		sysmsgs,
		sysmsgsKey: 'key',
		makeToast: jest.fn(),
		showToasts: jest.fn(),
		location: {},
	};
	it('renders a Toaster with toast props', () => {
		const wrapper = shallow(<ToastContainer {...props} />);
		const toasterWrapper = wrapper.find(Toaster);
		expect(toasterWrapper.exists()).toBe(true);
		expect(toasterWrapper.prop('toasts')).toHaveLength(
			props.readyToasts.length
		);
	});
	it('calls makeToast in componentDidMount when querystring param matches a sysmsg', () => {
		jest.clearAllMocks();
		const sysmsgProps = {
			...props,
			location: {
				...props.location,
				search: '?key=foo',
			},
		};
		const wrapper = shallow(<ToastContainer {...sysmsgProps} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).toHaveBeenCalled();
	});
	it('does not call makeToast when querystring param does not match a sysmsg', () => {
		jest.clearAllMocks();
		const wrapper = shallow(<ToastContainer {...props} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).not.toHaveBeenCalled();
	});

	it('calls showToasts when component renders (didmount, didupdate)', () => {
		jest.clearAllMocks();
		const wrapper = shallow(<ToastContainer {...props} />);
		wrapper.instance().componentDidMount();
		expect(props.showToasts).toHaveBeenCalled();

		props.showToasts.mockClear();
		wrapper.instance().componentDidUpdate();
		expect(props.showToasts).toHaveBeenCalled();
	});

	it('only updates when `readyToasts` contains new toasts (shouldComponentUpdate)', () => {
		const newReady = { ...props, readyToasts: [...props.readyToasts] };
		const noReady = { ...props, readyToasts: [] };
		const wrapper = shallow(<ToastContainer {...props} />);
		const instance = wrapper.instance();
		// test 'no change' props
		expect(instance.shouldComponentUpdate(props)).toBe(false);
		// test 'new `readyToasts` prop'
		expect(instance.shouldComponentUpdate(newReady)).toBe(true);
		// test 'no `readyToasts` prop`
		expect(instance.shouldComponentUpdate(noReady)).toBe(false);
	});
});
