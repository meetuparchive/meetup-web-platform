import React from 'react';
import { shallow } from 'enzyme';
import withIntl from './withIntl';

const messages = { 'en-US': { foo: 'bar' }, 'fr-FR': { baz: 'qux' } };
const Dummy = () => <div />;
const DummyIntl = withIntl(messages)(Dummy);

it('renders an IntlProvider-wrapped component', () => {
	const wrapper = shallow(<DummyIntl />);
	expect(wrapper).toMatchSnapshot();
});
it('passes messages[requestLanguage] as a prop to IntlProvider wrapper', () => {
	Object.keys(messages).forEach(requestLanguage => {
		const wrapper = shallow(
			<DummyIntl requestLanguage={requestLanguage} />
		);
		expect(wrapper.prop('messages')).toBe(messages[requestLanguage]);
	});
});
it('passes messages["en-US"] as a prop to IntlProvider wrapper for unsupported requestLanguage', () => {
	const wrapper = shallow(<DummyIntl requestLanguage="fo-BA" />);
	expect(wrapper.prop('messages')).toBe(messages['en-US']);
});
it('passes messages["en-US"] as a prop to IntlProvider wrapper for missing requestLanguage', () => {
	const wrapper = shallow(<DummyIntl />);
	expect(wrapper.prop('messages')).toBe(messages['en-US']);
});
