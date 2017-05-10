# State management tips

## Custom reducers

The majority of application state data is provided by the REST API, which the
platform manages in `state.api` using its own reducer. Custom reducers should
generally only be written when non-API data needs to live in global app state.

There are 5 levels of data storage for any rendered element:

1. REST API (BE database) - shared by the whole Meetup ecosystem
2. Redux state - shared across the entire user session - defined by _reducers_
3. Selectors/`mapStateToProps` - component-specific data, updated with changes
   in (2)
4. React element props - `this.props` - element-specific data, updated by
   parent components
5. React element state - `this.state` - element-specific data, updated by
   element itself

You should generally try to store data at the most-specific level possible so
that data changes do not interact with parts of the app outside of your direct
control, which means that you will generally be working with data from
selectors (3) on down

### API actions

If you think you need to write a custom reducer that listens for API-related
actions, make sure you are ready to solve the following problems:

1. clearing state when new data is requested
2. clearing state on logout (major privacy issues)
3. caching responses to prevent 'loading' UI on known data

Alternative: selectors, which will consume data from `state.api` that
automatically accounts for these behaviors.

