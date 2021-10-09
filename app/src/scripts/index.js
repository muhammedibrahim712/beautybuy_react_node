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

if (window.matchMedia("(max-width: 768px)").matches) {
  setTimeout(
    function() {
      // alert('here');
      $('#best-deals, #top-brands').slick({
        infinite: true,
        slidesToShow: 3,
        slidesToScroll: 3,
        dots: true,
        responsive: [
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 3,
              infinite: true,
              dots: true
            }
          }
          // You can unslick at a given breakpoint now by adding:
          // settings: "unslick"
          // instead of a settings object
        ]
      });
    }, 3000);

}
setTimeout(function (){

  const labels = [
    'January',
    'February',
    'April',
    'June',
  ];
  const data = {
    labels: labels,
    datasets: [{
      // label: 'My First dataset',
      backgroundColor: 'rgb(255, 99, 132)',
      borderColor: '#4CADCD',
      data: [ 10, 20, 8,25],
    }]
  };
  const config = {
    type: 'line',
    data: data,
    options: {
        plugins: {
          legend: {
            display: false
          }
        },
      scales: {
        y: {
          suggestedMin: 10,
          suggestedMax: 30
        }
      }
    }
  };

  var myChart = new Chart(
    document.getElementById('myChart'),
    config
  );
},5000)
