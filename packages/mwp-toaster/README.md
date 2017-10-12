# MWP Toaster

Triggering toasts with Redux actions from anywhere in an MWP app.

## Usage

First, you'll have to add the `<ToastConainer>` somewhere near the root of your
React application so that toasts will be visible on any route.

Then, the basic usage is to dispatch `makeToast(toastProps)` whenever you want
a `<Toast>` to appear. [Storybook UI demo](https://meetup.github.io/meetup-web-components/?selectedKind=Toast&selectedStory=multiple)

```js
import { makeToast } from 'mwp-toaster';

// ...

dispatch(makeToast({ action: () => {}, actionLabel: 'Get to the chopper' }));
```