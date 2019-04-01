// @flow
import React from 'react';
import type { ComponentType } from 'react';
import { IntlProvider, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

const DEFAULT_LOCALE = 'en-US';
type TRNSource = { [string]: string };
// Messages must support 'en-US'
type Messages = { 'en-US': TRNSource, [string]: TRNSource };
type Props = { requestLanguage: string, __locale?: string, [string]: any };

const mapStateToProps = (state: MWPState) => ({
	requestLanguage: state.config.requestLanguage,
});
const mapDispatchToProps = () => ({}); // swallow the injected 'dispatch' props

/*
 * A HOC function that applies the necessary context to the component that is
 * passed in. It will always wrap the component in `<IntlProvider>` in order
 * to make the translated `messages` available for consumption in the component.
 *
 * If `doInjectIntl` is `true`, then the component will also be injected with an
 * `intl` prop that contains the React Intl injection API properties and
 * methods
 *
 * @see {@link https://github.com/yahoo/react-intl/wiki/API#injectintl}
 */
export default (
	messages: Messages = { [DEFAULT_LOCALE]: {} },
	doInjectIntl?: boolean
) => (WrappedComponent: ComponentType<any>): ComponentType<*> => {
	if (doInjectIntl) {
		WrappedComponent = injectIntl(WrappedComponent);
	}

	const WithIntl = (props: Props) => {
		const { __locale, requestLanguage, ...wrappedProps } = props;

		const providerProps: typeof IntlProvider.propTypes = {
			defaultLocale: DEFAULT_LOCALE,
			messages: messages[requestLanguage] || messages[DEFAULT_LOCALE],
		};

		// optional prop to force the locale for the wrapper - useful for tests
		if (__locale) {
			providerProps.locale = __locale;
		}

		return (
			<IntlProvider {...providerProps}>
				<WrappedComponent {...wrappedProps} />
			</IntlProvider>
		);
	};
	const ConnectedWithIntl =
		process.env.NODE_ENV === 'test' // avoid Redux context dependency in tests
			? WithIntl
			: connect(mapStateToProps, mapDispatchToProps, null, { pure: false })(
					WithIntl
				);

	// modify display name to hide internal 'connect' implementation
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	ConnectedWithIntl.displayName = `WithIntl(${wrappedComponentName})`;

	return ConnectedWithIntl;
};
