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

setTimeout( function() {
  const wrapper = dom.getElement('top-brands');
// console.log(wrapper.clientWidth);

// grab the dots
  const dots = document.querySelectorAll('.dot');
// the default active dot num which is array[0]
  let activeDotNum = 0;

  dots.forEach((dot, idx) => {
//   number each dot according to array index
    dot.setAttribute('data-num', idx);

//   add a click event listener to each dot
    dot.addEventListener('click', (e) => {

      let clickedDotNum = e.target.dataset.num;
      // console.log(clickedDotNum);
//     if the dot clicked is already active, then do nothing
      if(clickedDotNum == activeDotNum) {
        // console.log('active');

      }
      else {
        // console.log('not active');
        // shift the wrapper
        let displayArea = wrapper.parentElement.clientWidth;
        // let pixels = -wrapper.clientWidth * clickedDotNum;
        let pixels = -displayArea * clickedDotNum;
        wrapper.style.transform = 'translateX('+ pixels + 'px)';
//       remove the active class from the active dot
        dots[activeDotNum].classList.remove('active');
//       add the active class to the clicked dot
        dots[clickedDotNum].classList.add('active');
//       now set the active dot number to the clicked dot;
        activeDotNum = clickedDotNum;
      }

    });
  });
},3000);
setTimeout( function() {
  const wrapper = dom.getElement('best-deals');
// console.log(wrapper.clientWidth);

// grab the dots
  const dots = document.querySelectorAll('.doting');
// the default active dot num which is array[0]
  let activeDotNum = 0;

  dots.forEach((dot, idx) => {
//   number each dot according to array index
    dot.setAttribute('data-num', idx);

//   add a click event listener to each dot
    dot.addEventListener('click', (e) => {

      let clickedDotNum = e.target.dataset.num;
      // console.log(clickedDotNum);
//     if the dot clicked is already active, then do nothing
      if(clickedDotNum == activeDotNum) {
        // console.log('active');

      }
      else {
        // console.log('not active');
        // shift the wrapper
        let displayArea = wrapper.parentElement.clientWidth;
        // let pixels = -wrapper.clientWidth * clickedDotNum;
        let pixels = -displayArea * clickedDotNum;
        wrapper.style.transform = 'translateX('+ pixels + 'px)';
//       remove the active class from the active dot
        dots[activeDotNum].classList.remove('active');
//       add the active class to the clicked dot
        dots[clickedDotNum].classList.add('active');
//       now set the active dot number to the clicked dot;
        activeDotNum = clickedDotNum;
      }

    });
  });
},3000);
