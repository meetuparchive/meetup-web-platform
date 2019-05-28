// @flow
import React from 'react';
import type { ComponentType } from 'react';
import { IntlProvider, injectIntl } from 'react-intl';
import { AppContext } from 'mwp-app-render/lib/components/shared/PlatformApp';

const DEFAULT_LOCALE = 'en-US';
type TRNSource = { [string]: string };
// Messages must support 'en-US'
type Messages = { 'en-US': TRNSource, [string]: TRNSource };
type Props = { requestLanguage: string, __locale?: string, [string]: any };

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
	// first, provide 'intl' prop through injectIntl HOC, if requested
	if (doInjectIntl) {
		WrappedComponent = injectIntl(WrappedComponent);
	}

	// create a wrapped component that receives a 'requestLanguage' prop and
	// loads the corresponding messages into an IntlProvider HOC
	const BaseWithIntl = (props: Props) => {
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

	// define component that consumes requestLanguage from context
	const ContextEnhancedWithIntl = props => (
		<AppContext.Consumer>
			{appContext => (
				<BaseWithIntl
					{...props}
					requestLanguage={appContext.requestLanguage}
				/>
			)}
		</AppContext.Consumer>
	);

	// Define returned component - context-free component for tests, context-enhanced
	// component otherwise
	const WithIntl =
		process.env.NODE_ENV === 'test' // avoid AppContext dependency in tests
			? BaseWithIntl
			: ContextEnhancedWithIntl;

	// modify display name to hide internal context implementation
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';

	WithIntl.displayName = `WithIntl(${wrappedComponentName})`;

	return WithIntl;
};
