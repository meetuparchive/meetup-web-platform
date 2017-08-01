# Tracking

## Activity tracking

## Click tracking

Click tracking consists of 3 related modules:

1. `clickWriter` for writing the click `Event` data to a Redux action.
2. `clickState` for defining Redux click actions and reducing those actions into
   Redux state, and writing click tracking data into a cookie.
3. `clickReader` for reading the click tracking data cookie on the server.

Ultimately, the only 'fixed' requirements are that the click tracking data must
be passed to the server in a cookie, and the serialization of that data must be
handled by the click tracking plugin/module - it is designed to work seamlessly
with parallel behavior implemented in Meetup Classic.

### Behavior

The platform currently adds `click` _and_ `change` listeners when creating the
Redux store for the browser - this is done on application setup and is
guaranteed not to run on the server. Each `click` and `change` event is sent
to `clickWriter`, which dispatches a Redux `CLICK_TRACK` action.

The click reducer is built into the platform reducer, and will store
click tracking data for the lifetime of the session, or until it is cleared with
a particular click 'clear' Redux action.

When the user navigates to a new page, the generated API request will read the
click tracking data from state, clear the click tracking state, and then set the
click tracking cookie. The cookie value will be sent with the API request, read
by the server, and then the server will force-clear the cookie.

### Leakage

Because click data only gets sent to the server when a user navigates to another
location within the application, there is a possibility of losing data when a
user navigates to another site, or even back to Meetup Classic, because a
'location change' action will not be dispatched and the Redux store will be
destroyed upon navigation.