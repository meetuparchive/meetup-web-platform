# Content Security Policy

Sets the following headers:
- **Strict-Transport-Security**: Tells browser that it should only be accessed using HTTPS & how long to remember that
- **X-XSS-Protection**: Enables XSS filtering. Browser will prevent rendering of the page if an attack is detected.
- **Content-Security-Policy**: using [Blankie](https://github.com/nlf/blankie) to set this or a similar header for some older browsers. A CSP compatible browser will use the header to ignore scripts not whitelisted in our policy header.

