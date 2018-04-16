/**
 * @module StyleWith (mock)
 * For tests, we do not need to write styles to a document.
 * This mock simply returns the wrapped component(s).
 */
const StyleWith = props => props.children;

module.exports = StyleWith;
