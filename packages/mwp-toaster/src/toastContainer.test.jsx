import React from 'react';
import { shallow } from 'enzyme';
import Toaster from 'meetup-web-components/lib/interactive/Toaster';
import { ToastContainer } from './ToastContainer';

describe('ToastContainer', () => {
	const toastPropsFoo = { message: 'foo' };
	const toastPropsBar = { message: 'bar' };
	const toastPropsBaz = { message: 'baz' };
	const sysmsgs = {
		key1: {
			foo: toastPropsFoo,
			bar: toastPropsBar,
		},
		key2: {
			baz: toastPropsBaz,
		},
	};
	const props = {
		readyToasts: [],
		sysmsgs,
		makeToast: jest.fn(),
		showToasts: jest.fn(),
		location: {},
	};
	it('renders a Toaster with toast props', () => {
		const readyToastsProps = {
			...props,
			readyToasts: [toastPropsFoo],
		};
		const wrapper = shallow(<ToastContainer {...readyToastsProps} />);
		const toasterWrapper = wrapper.find(Toaster);
		expect(toasterWrapper.exists()).toBe(true);
		expect(toasterWrapper.prop('toasts')).toHaveLength(
			readyToastsProps.readyToasts.length
		);
	});
	it('calls makeToast in componentDidMount when querystring param matches a sysmsg', () => {
		jest.clearAllMocks();
		const sysmsgProps = {
			...props,
			location: {
				...props.location,
				search: '?key1=foo',
			},
		};
		const wrapper = shallow(<ToastContainer {...sysmsgProps} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).toHaveBeenCalledWith(toastPropsFoo);
	});

	it('calls makeToast in componentDidMount with the querystring param that matches the first sysmsg key', () => {
		jest.clearAllMocks();
		const sysmsgProps = {
			...props,
			location: {
				...props.location,
				search: '?key2=foo&key1=bar',
			},
		};
		const wrapper = shallow(<ToastContainer {...sysmsgProps} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).toHaveBeenCalledWith(toastPropsBar);
	});

	it('does not call makeToast when querystring param is empty', () => {
		jest.clearAllMocks();
		const wrapper = shallow(<ToastContainer {...props} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).not.toHaveBeenCalled();
	});

	it('does not call makeToast when querystring param does not match a sysmsg', () => {
		jest.clearAllMocks();
		const sysmsgProps = {
			...props,
			location: {
				...props.location,
				search: '?key3=foo&key4=bar&key5=baz',
			},
		};
		const wrapper = shallow(<ToastContainer {...sysmsgProps} />);
		wrapper.instance().componentDidMount();
		expect(props.makeToast).not.toHaveBeenCalled();
	});

	it('calls showToasts when component renders (didmount, didupdate)', () => {
		const readyToastsProps = {
			...props,
			readyToasts: [toastPropsFoo],
		};

		jest.clearAllMocks();
		const wrapper = shallow(<ToastContainer {...readyToastsProps} />);
		wrapper.instance().componentDidMount();
		expect(props.showToasts).toHaveBeenCalled();

		props.showToasts.mockClear();
		wrapper.instance().componentDidUpdate();
		expect(props.showToasts).toHaveBeenCalled();
	});

	it('only updates when `readyToasts` contains new toasts (shouldComponentUpdate)', () => {
		const readyToastsProps = {
			...props,
			readyToasts: [toastPropsFoo],
		};
		const newReady = {
			...readyToastsProps,
			readyToasts: [readyToastsProps.readyToasts],
		};
		const noReady = { ...readyToastsProps, readyToasts: [] };
		const wrapper = shallow(<ToastContainer {...readyToastsProps} />);
		const instance = wrapper.instance();
		// test 'no change' props
		expect(instance.shouldComponentUpdate(readyToastsProps)).toBe(false);
		// test 'new `readyToasts` prop'
		expect(instance.shouldComponentUpdate(newReady)).toBe(true);
		// test 'no `readyToasts` prop`
		expect(instance.shouldComponentUpdate(noReady)).toBe(false);
	});
});
