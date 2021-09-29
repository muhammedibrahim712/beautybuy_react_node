import {dom} from 'glize';
import {renderSearch, renderCheckout} from './search.js';
import {renderProduct} from './products.js';
import {initAuth, renderSignIn, renderProfile, doSignOut} from './user.js';
import {renderAboutPage} from './about.js';
import {renderHomePage} from './home.js';
import {render} from './helper.js';

const /** string */ DEFAULT_PAGE = 'home';

/**
 * Initialises application.
 */
const init = () => {
  initAuth(() => {
    const root = /** @type {!Window} */ (dom.getRootContext());
    dom.addEvent(root, 'hashchange', render_);
    // Rendering `DEFAULT_PAGE` for first time page load.
    render_();
  });
};

/**
 * @private
 */
const render_ = () => {
  const /** string */ page = location.hash.split('/')[1] || DEFAULT_PAGE;
  const /** !Object<string, !Function> */ pages = {
    'home': renderHomePage,
    'about': renderAboutPage,
    'search': renderSearch,
    'product': renderProduct,
    'checkout': renderCheckout,
    'profile': renderProfile,
    'signin': renderSignIn,
    'signout': doSignOut,
  };

  render('loading', null, () => {
    (pages[page] ? pages[page] : pages[DEFAULT_PAGE])();
  });

  const body = dom.getDocument().body;

  // Adding the CSS class for easily stylize page specific needs.
  body.className = page;

  // Closing hamburger menu if it is opened.
  const checkbox = dom.getElementBySelectors(body, '#nav input');

  /* istanbul ignore else */
  if (checkbox) {
    checkbox.checked = false;
  }
};

init();
