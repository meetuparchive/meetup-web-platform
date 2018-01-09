// @flow
import React from 'react';
import type { ComponentType } from 'react';
import { IntlProvider, injectIntl } from 'react-intl';

type Messages = { [string]: string };
type Props = { __locale?: string, [string]: any };
/**
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
export default (messages: Messages, doInjectIntl?: boolean) => (
	WrappedComponent: ComponentType<any>
): ComponentType<*> => {
	if (doInjectIntl) {
		WrappedComponent = injectIntl(WrappedComponent);
	}
	/**
	 * A HOC that wraps the component in the context required for trn rendering
	 */
	const WithIntl = (props: Props) => {
		const {
			__locale, // optional 'forced' locale value for the wrapper
			...other
		} = props;

		const providerProps: typeof IntlProvider.propTypes = {
			defaultLocale: 'en-US',
			messages,
		};

		if (__locale) {
			providerProps.locale = __locale;
		}

		return (
			<IntlProvider {...providerProps}>
				<WrappedComponent {...other} />
			</IntlProvider>
		);
	};
	const wrappedComponentName =
		WrappedComponent.displayName || WrappedComponent.name || 'Component';
	WithIntl.displayName = `WithIntl(${wrappedComponentName})`;
	return WithIntl;
};
