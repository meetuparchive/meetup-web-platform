# Language plugin

This plugin provides two `request` helpers:

- `request.getLanguage()`: get the request's language code (xx-XX)
- `request.getPrefixedPath()`: get the correct request path relative to the
  request's specified language - useful for determining whether the server
  should redirect