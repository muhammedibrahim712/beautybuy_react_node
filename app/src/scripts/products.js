import {dom, utils} from 'glize';
import {render, parseJson, formatPrice} from './helper.js';
import {doGet} from './api.js';
import {getImage} from './images.js';
import {getUser} from './user.js';


/**
 * Gets the product at the specified product ID.
 * @param {string} productId The product Id.
 * @param {function(?Object)} callback The callback function.
 */
export const getProductById = (productId, callback) => {
  let /** ?Object */ product = products_[productId];
  if (product) {
    callback(product);
  } else {
    doGet('search/?q=' + productId, (event) => {
      const /** string */ text = event.target.responseText;
      const /** !Object */ data = /** @type {!Object} */ (parseJson(text));
      product = data['rows'][0];
      product && formatProduct(product);
      callback(product);
    });
  }
};

/**
 * Renders product page.
 */
export const renderProduct = () => {
  const /** string */ productId = location.hash.split('/').pop();
  getProductById(productId, (product) => {
    if (product) {
      product['lowest_price'] ?
        render_(product) :
        doGet('lowest-price/' + productId, (event) => {
          const /** string */ text = event.target.responseText;
          const /** !Object */ data = /** @type {!Object} */ (parseJson(text));
          product['lowest_price'] = (data.rows[0] || {})['lowest_price'] || 0;
          render_(product);
        });
    } else {
      location.replace('#/search/' + productId);
    }
  });
};

/**
 * Formats product data.
 * @param {!Object} product The product data.
 * @return {!Object} Returns formatted product data.
 */
export const formatProduct = (product) => {
  const /** number */ price = product['price'] ||
                              product['original_price'] || 0;
  const /** number */ discount = product['discount_price'] ||
                                 product['current_discount_price'] || 0;
  product['price_formatted'] = formatPrice(price);
  product['discount_formatted'] = formatPrice(discount || price);
  product['has_discount'] = !!(discount);
  product['image'] = getImage(product);
  product['product_id'] = product['product_id'] || product['prod_id'];
  products_[product['product_id']] = product;
  return product;
};

/**
 * Renders product page.
 * @param {!Object} product The product data.
 * @private
 */
const render_ = (product) => {

  getUser((user) => {
    product['lowest_price_formatted'] = user ?
      formatPrice(product['lowest_price']) : '...';
    product['product_link_url'] = user ?
      product['url'] : getRedirectURL_(product['url']);
    product['product_link_target'] = user ? '_blank' : '_self';

    render('product', product, () => {
      // const /** number */ productId = product['product_id'];

      // const /** ?Element */ button = dom.getElement('btn-action');
      // dom.addEvent(/** @type {!Node} */ (button), 'click', (event) => {
      //   event.preventDefault();
      //   location.assign('#/checkout/' + productId);
      // });

      // let /** ?Element */ script = dom.getElement('greylock');
      // if (!script) {
      //   script = dom.makeNode('SCRIPT');
      //   script.src = 'https://greylock.js.org/greylock.js';
      //   script.async = true;
      //   script.onload = () => drawChart_(productId);
      //   dom.appendNode(dom.getDocument().body, script);
      // } else {
      //   drawChart_(productId);
      // }
    });
  });
};

/**
 * @param {string} url
 * @return {string}
 * @private
 */
const getRedirectURL_ = (url) => {
  window.localStorage.setItem('product_redirect_url', url);
  return '/#/signin/' + utils.string.hash(url);
};

// /**
//  * @param {number} productId The product Id.
//  * @private
//  */
// const drawChart_ = (productId) => {
//   productId && doGet('price-timeline/' + productId, (event) => {
//     const /** string */ text = event.target.responseText;
//     const /** !Object */ data = /** @type {!Object} */ (parseJson(text));
//     if (data['count']) {
//       const /** !Object */ timeline = {};
//       data['rows'].forEach((row) => {
//         const /** string */ month = row['date'].slice(0, 7);
//         const /** number */ price = row['price'];
//         timeline[month] = timeline[month] || price;
//         timeline[month] = Math.min(timeline[month], price);
//       });
//       const rows = Object.keys(timeline).sort().map((month) => {
//         return [month, timeline[month]];
//       });
//       const options = {
//         'formatter': {'prefix': '$', 'fraction': 2},
//         'scale': 0,
//         'vAxis': 0,
//       };
//       const LineChart = dom.getRootContext()['charts']['LineChart'];
//       const chart = new LineChart('chart-container');
//       chart['draw']([['Date', 'Price']].concat(rows), options);
//     }
//   });
// };

/**
 * Products storage.
 * @type {!Object<string, !Object>}
 * @private
 */

const products_ = {};
setTimeout(function () {
  const btn = dom.getElement('test');
  btn.onclick = (e) => {
    e.stopPropagation();
    var modal = dom.getElement("myModal");
    modal.classList.add("otherclass");
    if(modal.classList.contains("modal")){
      modal.classList.add("otherclass");
    }

  }
},5000);
setTimeout(function(){
  const btns = dom.getElement('main');
  btns.onclick = (event) => {
    var modal = dom.getElement('myModal');
    if(modal.classList.contains("otherclass")){
      modal.classList.remove("otherclass");
    }
  }
},8000)
