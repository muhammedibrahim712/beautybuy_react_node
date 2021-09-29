import * as helper from './helper.js';
import {saveProduct} from './user.js';
import {getProductById, formatProduct} from './products.js';
import {doGet} from './api.js';
import {dom} from 'glize';


/**
 * Initializes search form.
 */
export const renderSearch = () => {
  helper.render('search', null, () => {
    const form =
      /** @type {!HTMLFormElement} */ (dom.getElement('product-search-form'));
    const input =
      /** @type {!HTMLInputElement} */ (form && form.elements['q']);

    if (form && input) {
      initSearchForm_(form, input);
      // initTypeahead_(input);
      initTopBrands_();
      initFilters_();
      initFilterButtons_(form);
    }
  });
};


/**
 * Renders product checkout page.
 */
export const renderCheckout = () => {
  const /** string */ productId = location.hash.split('/').pop();
  getProductById(productId, (product) => {
    if (product) {
      const /** number */ price = product['current_discount_price'];
      product['drops'] = {
        '5off': helper.formatPrice(price - price * 0.05),
        '10off': helper.formatPrice(price - price * 0.1),
        '20off': helper.formatPrice(price - price * 0.2),
        '30off': helper.formatPrice(price - price * 0.3),
        '50off': helper.formatPrice(price - price * 0.5),
        '75off': helper.formatPrice(price - price * 0.75),
      };

      helper.render('checkout', product, () => {
        const /** ?Element */ button = dom.getElement('btn-action');
        dom.addEvent(/** @type {!Node} */ (button), 'click', (event) => {
          event.preventDefault();

          const elements = button.form.elements;
          product['order'] = {
            'drop': elements['drop'].value,
            'term': elements['term'].value,
            'date': Date.now(),
          };

          saveProduct(product);
          location.assign('#/profile/');
        });
      });
    } else {
      location.replace('#/search/' + productId);
    }
  });
};


/**
 * Initializes search form.
 * @param {!HTMLFormElement} form The form element.
 * @param {?Element} input The input element.
 * @private
 */
const initSearchForm_ = (form, input) => {
  dom.addEvent(form, 'submit', (event) => {
    event.preventDefault();
    location.replace('#/search/' + getSearchQuery_(form));
  });

  const /** ?Element */ popular = dom.getElement('popular-products');
  const /** ?Element */ best = dom.getElement('best-deals');
  const /** string */ query = location.hash.split('?')[1];

  if (query && 0 == query.indexOf('q=')) {
    input.value = helper.getParameter('q');
    input.disabled = form.disabled = true;
    const /** ?Element */ results = dom.getElement('search-results');
    results.innerHTML = '<div class="loading">Loading...</div>';

    const /** string */ cached = cache_[query];
    if (cached) {
      results.innerHTML = cached;
      input.disabled = form.disabled = false;
      initPaging_(results);
    } else {
      doSearch_((data) => {
        getSearchResultsContent_(data).then((content) => {
          cache_[query] = content;
          results.innerHTML = content;
          input.disabled = form.disabled = false;
          initPaging_(results);
        });
      });
    }
    popular.style.display = 'none';
    best.style.display = 'none';
  } else {
    initPopularProducts_(popular);
    initBestDeals_(best);
  }
};


/**
 * @param {!Object} data The search results data.
 * @return {!Promise} Returns search result content as a Promise.
 * @private
 */
const getSearchResultsContent_ = (data) => {
  return new Promise((resolve, reject) => {
    formatResults_(data.rows, (content) => {
      if (data.count) {
        const found = data.count || 0;
        content = '<div class="loading">Found ' +
                  '<b>' + helper.formatNumber(found) + '</b> ' +
                  'products</div>' + content;
      }
      resolve(content);
    });
  });
};


/**
 * @param {!Element} container The search result HTML container element.
 * @private
 */
const initPaging_ = (container) => {
  const fn = () => {
    const nodes = dom.getElementsBySelectors(container, '.card:not(.visible)');
    Array.prototype.slice.call(nodes).slice(0, 10).forEach((node )=> {
      node.classList.add('visible');
      node.style.display = 'block';
    });
    btn.style.display = nodes.length < 10 ? 'none' : 'block';
  };
  const div = dom.appendNode(container, dom.makeNode('div'));
  div.className = 'div-show-more';
  const btn = dom.appendNode(div, dom.makeNode('a'));
  btn.textContent = 'View More';
  btn.className = 'btn-show-more nav-link btn-join';
  btn.onclick = () => {
    fn();
    return false;
  };
  fn();
};


/**
 * Initializes top brands section.
 * @private
 */
const initTopBrands_ = () => {
  const /** ?Element */ container = dom.getElement('top-brands');
  container.innerHTML = '<div class="loading">Loading...</div>';

  doGet('top-brands', (event) => {
    const /** string */ text = event.target.responseText;
    const /** !Object */ data = /** @type {!Object} */ (helper.parseJson(text));
    const /** !Array<!Object> */ rows = data.rows.slice(0, 9);
    formatResults_(rows, (content) => {
      container.innerHTML = content;
    });
  });
};


/**
 * Initializes brands filter.
 * @private
 */
const initBrandsFilter_ = () => {
  doGet('brands-names', (event) => {
    const /** string */ text = event.target.responseText;
    const /** !Object */ data = /** @type {!Object} */ (helper.parseJson(text));

    helper.getTemplateContent('filter-item', (template) => {
      const filter = dom.getElement('brand-filter');
      const length = Math.min(data.rows.length, 150);
      const param = helper.getParameter('designers').toLowerCase();
      let content = '<option value="">All brands</option>';
      for (let i = 0; i < length; ++i) {
        const product = data.rows[i];
        const value = product['designer'];
        content += helper.parseTemplate(template, {
          'name': 'designers',
          'id': value,
          'value': value,
          'text': value,
          'selected': param.includes(value.toLowerCase()) ? 'selected' : '',
        });
      }
      filter.innerHTML = content;
    });
  });
};


/**
 * Initializes filters sidebar.
 * @private
 */
const initFilters_ = () => {
  initBrandsFilter_();

  const mapping = {
    'concern': [ // skin-concern
      {'value': '', 'text': 'All skin concerns'},
      {'value': 'acne_prone', 'text': 'Acne Prone'},
      {'value': 'anti_ageing', 'text': 'Anti Ageing'},
      {'value': 'dark_circles', 'text': 'Dark Circles'},
      {'value': 'dry', 'text': 'Dry'},
      {'value': 'normal_combination', 'text': 'Normal'},
      {'value': 'oily', 'text': 'Oily'},
      {'value': 'sensitive', 'text': 'Sensitive'},
    ],
    'savings': [
      {'value': '', 'text': 'All savings'},
      'Up to 25%', '25%-50%', '50%-75%', 'More than 75%',
    ],
    'skincare': [ // skincare-products
      {'value': '', 'text': 'All skincare products'},
      {'value': 'cleansers', 'text': 'Cleansers'},
      {'value': 'exfoliators', 'text': 'Exfoliators'},
      {'value': 'make_up_removers', 'text': 'Makeup Removers'},
      {'value': 'toners', 'text': 'Toners'},
      {'value': 'moisturisers', 'text': 'Moisturisers'},
      {'value': 'lotions', 'text': 'Lotions'},
      {'value': 'serums', 'text': 'Serums'},
      {'value': 'oils', 'text': 'Oils'},
      {'value': 'mists', 'text': 'Mists'},
      {'value': 'balms', 'text': 'Balms'},
      {'value': 'masks', 'text': 'Masks'},
      {'value': 'peels', 'text': 'Peels'},
      {'value': 'eye_care', 'text': 'Eye Care'},
      {'value': 'lip_balm', 'text': 'Lip Balm'},
      {'value': 'retinal_products', 'text': 'Retinal Products'},
      {'value': 'supplements', 'text': 'Supplements'},
      {'value': 'mineral', 'text': 'Mineral'},
      {'value': 'spf30', 'text': 'SPF 30'},
      {'value': 'spf50', 'text': 'SPF 50'},
      {'value': 'tinted', 'text': 'Tinted'},
      {'value': 'pharmacy_brands', 'text': 'Pharmacy Brands'},
      {'value': 'acne_prone', 'text': 'Acne Prone'},
      {'value': 'anti_ageing', 'text': 'Anti Ageing'},
      {'value': 'dark_circles', 'text': 'Dark Circles'},
      {'value': 'dry', 'text': 'Dry'},
      {'value': 'normal_combination', 'text': 'Normal'},
      {'value': 'oily', 'text': 'Oily'},
      {'value': 'sensitive', 'text': 'Sensitive'},
    ],
    'price_range': [
      {'value': '', 'text': 'All price ranges'},
      '>$500', 'Between $200 and $500', 'Between $100 and $200',
      'Between $50 and $100', 'Between $20 and $50', '<$20',
    ],
  };

  for (const key in mapping) {
    if (Object.prototype.hasOwnProperty.call(mapping, key)) {
      const param = helper.getParameter(key).toLowerCase();
      helper.getTemplateContent('filter-item', (template) => {
        const filter = dom.getElement(key + '-filter');
        if (filter) {
          const data = mapping[key];
          const length = Math.min(data.length, 50);
          let content = '';
          for (let i = 0; i < length; ++i) {
            const item = data[i];
            const value = item['value'] != undefined ? item['value'] : item;
            const text = item['text'] || item;

            content += helper.parseTemplate(template, {
              'name': key,
              'value': value,
              'text': text,
              'selected': param.includes(value.toLowerCase()) ? 'selected' : '',
            });
          }
          filter.innerHTML = content;
        }
      });
    }
  }
};


/**
 * Initializes filter toggler.
 * @param {!HTMLFormElement} form The form element.
 * @private
 */
const initFilterButtons_ = (form) => {
  const body = dom.getDocument().body;
  const aside = form.nextElementSibling;
  helper.isMobile && aside.classList.toggle('hidden');

  dom.getElementsBySelectors(body, '.btn-filter').forEach((btn) => {
    btn.onclick = () => {
      form.classList.toggle('hidden');
      aside.classList.toggle('hidden');
      return false;
    };
  });
};


/**
 * Initializes popular product section.
 * @param {?Element} container An HTML container.
 * @private
 */
const initPopularProducts_ = (container) => {
  container.innerHTML = '<div class="loading">Loading...</div>';

  doGet('recommended-products', (event) => {
    const /** string */ text = event.target.responseText;
    const /** !Object */ data = /** @type {!Object} */ (helper.parseJson(text));
    const random = data.rows.sort(() => .5 - Math.random()).slice(0, 8);
    formatResults_(random, (content) => {
      container.innerHTML = content;
    });
  });
};


/**
 * Initializes best deals section.
 * @param {?Element} container An HTML container.
 * @private
 */
const initBestDeals_ = (container) => {
  container.innerHTML = '<div class="loading">Loading...</div>';

  doGet('best-deals', (event) => {
    const /** string */ text = event.target.responseText;
    const /** !Object */ data = /** @type {!Object} */ (helper.parseJson(text));
    const /** !Array<!Object> */ rows = data.rows.slice(0, 9);
    formatResults_(rows, (content) => {
      container.innerHTML = content;
    });
  });
};


// /**
//  * Initializes input auto-complete.
//  * @param {?HTMLInputElement} input The input element.
//  * @private
//  */
// const initTypeahead_ = (input) => {
//   helper.isMobile || dom.addEvent(
//       /** @type {!Node} */ (input), 'keyup', utils.events.debounce(() => {
//         if (input.value.length > 2) {
//           const callback = (data) => {
//             const typeahead = dom.getElement(input.getAttribute('list'));
//             const clone = typeahead.cloneNode(false);
//             data.rows.forEach((product) => {
//               const option = dom.appendNode(clone, dom.makeNode('option'));
//               option.value = product['product_name'];
//             });
//             typeahead.parentNode.replaceChild(clone, typeahead);
//           };
//           doSearch_(callback, input.value);
//         }
//       }));
// };


/**
 * @param {!Array<!Object>} data The data to format.
 * @param {function(string)} callback The callback function.
 * @private
 */
const formatResults_ = (data, callback) => {
  let /** string */ content = '';
  let /** number */ length = data.length;

  if (length) {
    data.forEach((item) => {
      const parse = (product) => {
        helper.getTemplateContent('search-result', (template) => {
          product = formatProduct(product);
          content += helper.parseTemplate(template, product);
          !--length && callback(content);
        });
      };

      parse(item);
    });
  } else {
    callback('<div class="loading empty">No result found</div>');
  }
};


/**
 * @param {function(!Object)} callback The callback function.
 * @param {string=} keyword The keyword to search.
 * @private
 */
const doSearch_ = (callback, keyword=undefined) => {
  const /** string */ path = 'search?' + (
    keyword ? 'q=' + keyword : location.hash.split('?')[1]
  );

  doGet(path, (event) => {
    const /** string */ text = event.target.responseText;
    const /** !Object */ data = /** @type {!Object} */ (helper.parseJson(text));

    callback(data);
  });
};

/**
 * @param {!HTMLFormElement} form The HTML form element.
 * @return {string} Returns query string based on form values.
 * @private
 */
const getSearchQuery_ = (form) => {
  const /** !Object */ params = {};
  for (const /** !Element */ element of form.elements) {
    const /** string */ name = element.name;
    const /** string */ type = element.type;

    if ('text' === type || 'search' === type || 'select-one' === type) {
      params[name] = element.value;
    } else if ('checkbox' === type && element.checked) {
      params[name] = params[name] || [];
      params[name].push(element.value);
    }
  }

  const /** !Array<string> */ qs = [];
  for (const /** string */ key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key].toString();
      if (value || 'q' === key) { // Allow empty 'q' paramenter.
        qs.push(key + '=' + encodeURIComponent(value));
      }
    }
  }

  return '?' + qs.join('&');
};


/**
 * Cache for rendered content.
 * @type {!Object<string, string>}
 * @private
 */
const cache_ = {};
