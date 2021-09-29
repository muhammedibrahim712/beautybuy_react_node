/**
 * @fileoverview Defines helper methods.
 *
 * @see https://google.github.io/styleguide/jsguide.html
 * @see https://developers.google.com/closure/compiler/docs/js-for-compiler
 */

import {dom, formatters, net} from 'glize';

/**
 * Indicates a constant that can be overridden by the compiler at compile-time.
 * @define {boolean}
 */
const ENABLE_DEBUG = true;

/**
 * Formats number.
 * @param {number|string} number The number to format.
 * @return {string} Returns formatted number.
 */
export const formatNumber = (number) => formatters.formatNumber(+number);

/**
 * Formats price.
 * @param {number} price The price to format.
 * @return {string} Returns formatted price.
 */
export const formatPrice = (price) =>
  formatters.formatNumber(price, {'fraction': 2, 'prefix': '$'});

/**
* Renders template by name.
* @param {string} template The template name.
* @param {?Object} values The template values as dict.
* @param {!Function} callback The callback function.
* @param {?Node=} container Optional container element.
*/
export const render = (template, values, callback, container=undefined) => {
  getTemplateContent(template, (content) => {
    if (content) {
      container = container || dom.getElement('main');

      if (values) {
        content = parseTemplate(content, values);
      }

      container.innerHTML = content;
      callback();
      'main' == container.id && window.scrollTo(0, 0);
    } else {
      // console.log('Could not find template "' + template + '"');
    }
  });
};

/**
* Gets template content by template name.
* @param {string} template The template name.
* @param {function(string)} callback The callback function.
*/
export const getTemplateContent = (template, callback) => {
  const /** ?Element */ node = dom.getElement(template + '-template');

  if (node) {
    callback(node.textContent || '');
  } else if (ENABLE_DEBUG) {
    fetch('./templates/' + template + '.html?nocache' + Date.now())
        .then((response) => response.text())
        .then((html) => callback(html));
  }
};

/**
 * Parses template text content.
 * @param {string} content The template text content.
 * @param {!Object} values The template values as dict.
 * @return {string} Returns parsed template text content.
 */
export const parseTemplate = (content, values) =>
  dom.template.parseTemplate(content, values);

/**
 * Parses a JSON string, constructing the JavaScript object
 * described by the string.
 * @param {string} text The string to parse as JSON.
 * @return {?Object} The Object corresponding to the given JSON text.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 */
export const parseJson = (text) => {
  let /** ?Object */ result = null;

  try {
    result = /** @type {?Object} */ (JSON.parse(text));
  } catch (ex) /* istanbul ignore next */ {
    // console.error('helper.parseJson: ', ex.message || ex);
  }

  return result;
};

/**
 * Gets the value for the first cookie with the given name.
 * @param {string} key The name of the cookie to get.
 * @param {string=} value The optional default value.
 * @return {string} The value of the cookie. If no cookie is set this
 *     returns opt_default or an empty string if opt_default is not provided.
 * @see https://github.com/Datamart/Glize/blob/master/src/dom/cookies.js
 */
export const getCookie = (key, value=undefined) => dom.cookies.get(key, value);

/**
 * Returns the value of a request parameter as a <code>string</code>, or empty
 * <code>string</code> if the parameter does not exist.
 * @param {string} name A <code>string</code> specifying the name of the
 *     parameter.
 * @param {?Element|?Location|string=} url Optional location object.
 * @return {string} Returns a <code>string</code> representing the single
 *     value of the parameter.
 * @see https://github.com/Datamart/Glize/blob/master/src/net/request.js
 */
export const getParameter = (name, url=undefined) => {
  url = url || 'https://' + location.hash.slice(1);
  return net.request.getParameter(name, url);
};

export const isMobile = navigator.maxTouchPoints || 'ontouchstart' in document;
