/**
 * @fileoverview Defines API functions.
 *
 * @see https://google.github.io/styleguide/jsguide.html
 * @see https://developers.google.com/closure/compiler/docs/js-for-compiler
 */


/**
 * @const {string}
 * @see /server.js#API_BASE
 */
const API_BASE = '/bff/api/v1/';


/**
 * Performs GET request.
 * @param {string} path The URL path to which to send the request.
 * @param {function(!Event)} callback A JavaScript function object
 *     that is called whenever the <code>readyState</code> attribute equals
 *     to 4 (DONE).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
export const doGet = (path, callback) => {
  doRequest_('GET', path, callback);
};


/**
 * Performs HTTP POST request.
 * @param {string} path The URL path to which to send the request.
 * @param {function(!Event)} callback A JavaScript function object
 *     that is called whenever the <code>readyState</code> attribute equals
 *     to 4 (DONE).
 * @param {?Object|string} data Provides the request entity body.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
export const doPost = (path, callback, data) => {
  doRequest_('POST', path, callback, JSON.stringify(data));
};


/**
 * Performs DELETE request.
 * @param {string} path The URL path to which to send the request.
 * @param {function(!Event)} callback A JavaScript function object
 *     that is called whenever the <code>readyState</code> attribute equals
 *     to 4 (DONE).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 */
export const doDelete = (path, callback) => {
  doRequest_('DELETE', path, callback);
};


/**
 * Performs HTTP request.
 * @param {string} method The HTTP request method to use.
 * @param {string} path The URL path to which to send the request.
 * @param {function(!Event)} callback A JavaScript function object
 *     that is called whenever the <code>readyState</code> attribute equals
 *     to 4 (DONE).
 * @param {string=} data Provides optional request entity body.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
 * @see https://github.com/Datamart/Glize/blob/master/src/net/HttpRequest.js
 * @private
 */
const doRequest_ = (method, path, callback, data=undefined) => {
  const /** string */ url = API_BASE + path;
  const /** !XMLHttpRequest */ request = new XMLHttpRequest;

  request.addEventListener('load', callback);
  request.open(method, url, true);
  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send(data);
};
