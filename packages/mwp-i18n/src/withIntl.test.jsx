import React from 'react';
import { shallow } from 'enzyme';
import withIntl from './withIntl';

const messages = { 'en-US': { foo: 'bar' }, 'fr-FR': { baz: 'qux' } };
const Dummy = () => <div />;
const DummyIntl = withIntl(messages)(Dummy);

export const createFakeStore = fakeData => ({
	getState() {
		return fakeData;
	},
	dispatch() {},
	subscribe() {},
});

it('renders an IntlProvider-wrapped component', () => {
	const mockStore = createFakeStore({
		config: { requestLanguage: 'en-US' },
	});
	const wrapper = shallow(<DummyIntl />, { context: { store: mockStore } });
	expect(wrapper.dive()).toMatchSnapshot();
});
it('passes messages[requestLanguage] as a prop to IntlProvider wrapper', () => {
	Object.keys(messages).forEach(requestLanguage => {
		const mockStore = createFakeStore({
			config: { requestLanguage },
		});
		const wrapper = shallow(<DummyIntl />, {
			context: { store: mockStore },
		});
		expect(wrapper.dive().prop('messages')).toBe(messages[requestLanguage]);
	});
});
it('passes messages["en-US"] as a prop to IntlProvider wrapper for unsupported requestLanguage', () => {
	const mockStore = createFakeStore({
		config: { requestLanguage: 'fo-BA' },
	});
	const wrapper = shallow(<DummyIntl />, { context: { store: mockStore } });
	expect(wrapper.dive().prop('messages')).toBe(messages['en-US']);
});
