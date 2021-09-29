
import {dom} from 'glize';
import {
  render,
  parseJson,
  getTemplateContent,
  parseTemplate,
} from './helper.js';
import {doGet} from './api.js';


/**
 * Preforms logout action.
 */
export const doSignOut = () => {
  getUser((user) => {
    const callback = () => location.replace('#/signin/');

    if (user) {
      if (confirm('Are you sure you want to sign out?')) {
        firebase.auth().signOut().then(callback);
      } else {
        history.back();
      }
    } else {
      callback();
    }
  });
};


/**
 * Renders login page.
 * @see https://firebase.google.com/docs/auth/web/firebaseui
 */
export const renderSignIn = () => {
  getUser((user) => {
    if (user) {
      const /** ?Object */ provider = user['providerData'][0];
      const /** ?Object */ metadata = user['metadata'];
      const /** !Object */ data = {...provider, ...metadata};

      saveData_('users', user['uid'], data).then(() => {
        location.replace('#/profile/');
      });
    } else {
      renderLogin_();
    }
  });
};


/**
 * Renders user profile page.
 * @see https://firebase.google.com/docs/auth/web/firebaseui
 */
export const renderProfile = () => {
  getUser((user) => {
    if (user) {
      const /** string */ userId = user['uid'];
      getData_('users', userId).then((snapshot) => {
        const /** !Object */ account = snapshot.exists ?
          snapshot['data']() : {};

        loadProducts_(user, (products) => {
          const values = {
            'uid': userId,
            'displayName': user['displayName'],
            'email': user['email'],
            'photoURL': user['photoURL'],
            'products': products,
          };

          render('profile', values, () => {
            intiPurchaseButton_();
            initRemoveButtons_(userId);
            initAccount_(userId, account);
          });
        });
      });
    } else {
      location.replace('#/signin/');
    }
  });
};


/**
 * Initializes auth module.
 * @param {function(?Object)} callback The callback function.
 * @see https://firebase.google.com/docs/web/setup#available-libraries
 */
export const initAuth = (callback) => {
  // Loading main Firebase library file.
  loadLibrary_('firebase-app.js', () => {
    // Loading Firebase configuration from BFF.
    doGet('firebase', (event) => {
      const /** string */ text = event.target.responseText;
      const /** !Object */ config = /** @type {!Object} */ (parseJson(text));
      firebase.initializeApp(config);

      loadLibrary_('firebase-auth.js', () => {
        getUser((user) => {
          initUserLinks_(user);
          callback(user);
        });
      });
      loadLibrary_('firebase-performance.js', () => firebase['performance']());
      loadLibrary_('firebase-analytics.js', () => firebase['analytics']());
    });
  });
};

/**
 * Gets signed in user.
 * @param {function(?Object)} callback The callback function.
 */
export const getUser = (callback) => {
  firebase.auth().onAuthStateChanged(callback);
};

/**
 * Adds product to the products list.
 * @param {?Object} product The product object.
 */
export const saveProduct = (product) => {
  products_.push(product);
};

/**
 * @param {string} userId The user Id.
 * @private
 */
const initRemoveButtons_ = (userId) => {
  const body = dom.getDocument().body;
  const cards = dom.getElementsBySelectors(body, '#saved-products .card');
  cards.forEach((card) => {
    const a = card.insertBefore(dom.makeNode('A'), card.firstChild);
    a.className = 'times';
    a.title = 'Remove product';
    a.onclick = () => {
      if (confirm('Are you sure you want to remove this product?')) {
        const productId = dom.getElementBySelectors(card, '.img').id.slice(5);
        getData_('products', userId).then((snapshot) => {
          const /** !Object */ data = snapshot.exists ? snapshot['data']() : {};
          if (productId in data) {
            delete data[productId];
            saveData_('products', userId, data);
            dom.deleteNode(card);
          }
        });
      }
      return false;
    };
  });
};

/**
 * Loads user saved products.
 * @param {?Object} user The user object.
 * @param {function(string)} callback The callback function.
 * @see https://googleapis.dev/nodejs/firestore/latest/DocumentReference.html
 * @private
 */
const loadProducts_ = (user, callback) => {
  const /** string */ userId = user['uid'];

  getData_('products', userId).then((snapshot) => {
    const /** !Object */ data = snapshot.exists ? snapshot['data']() : {};

    if (products_.length) {
      while (products_.length) {
        const /** ?Object */ product = products_.shift();
        product['checkout_at'] = Date.now();
        data[product['product_id']] = product;
      }

      saveData_('products', userId, data);
    }

    renderProducts_(data, callback);
  });
};

/**
 * Renders user saved products.
 * @param {!Object} products The products object.
 * @param {function(string)} callback The callback function.
 * @private
 */
const renderProducts_ = (products, callback) => {
  let /** string */ content = '';
  let /** number */ length = Object.keys(products).length;

  if (length) {
    const parse = (product) => {
      getTemplateContent('search-result', (template) => {
        const /** !Object */ order = product['order'];
        const /** string */ tmpPrice = product['price_formatted'];
        const /** string */ tmpDiscount = product['discount_formatted'];
        const /** string */ terms = '<span class="terms">Terms: ' +
                                    order['drop'] + ' / ' + order['term'] +
                                    '</span>';

        // TODO: Extract this logic to the different template.
        product['price_formatted'] += terms;
        product['discount_formatted'] += terms;

        content += parseTemplate(template, product);

        product['price_formatted'] = tmpPrice;
        product['discount_formatted'] = tmpDiscount;

        !--length && callback(content);
      });
    };

    for (const productId in products) {
      if (Object.prototype.hasOwnProperty.call(products, productId)) {
        parse(products[productId]);
      }
    }
  } else {
    callback('<div class="loading empty">No saved products</div>');
  }
};

/**
 * @param {string} collection The collection name.
 * @param {string} user The user ID.
 * @param {!Object} data The data to save.
 * @return {!Promise} Returns collection promise.
 * @private
 */
const saveData_ = (collection, user, data) => {
  const options =
    /** @type {!firebase.firestore.SetOptions} */ ({'merge': false});
  return getStorage_().then((storage) => {
    return storage.collection(collection).doc(user).set(data, options);
  });
};

/**
 * @param {string} collection The collection name.
 * @param {string} user The user ID.
 * @return {!Promise} Returns collection promise.
 * @private
 */
const getData_ = (collection, user) => {
  return getStorage_().then((storage) => {
    return storage.collection(collection).doc(user).get();
  });
};

/**
 * Gets user storage.
 * @return {!Promise} Returns the user storage as a Promise.
 */
const getStorage_ = () => {
  return new Promise((resolve, reject) => {
    if (firestore_) {
      resolve(firestore_);
    } else {
      loadLibrary_('firebase-firestore.js', () => {
        firestore_ = firebase.firestore();
        resolve(firestore_);
      });
    }
  });
};

/**
 * Gets the instance of Firebase Auth UI library.
 * @return {!Promise} Returns the instance as a Promise.
 */
const getFirebaseAuthUI_ = () => {
  return new Promise((resolve, reject) => {
    if (firebaseAuthUI_) {
      resolve(firebaseAuthUI_);
    } else {
      loadLibrary_('firebase-ui-auth.js', () => {
        loadLibrary_('firebase-ui-auth.css', () => {
          firebaseAuthUI_ = new firebaseui.auth.AuthUI(firebase.auth());
          resolve(firebaseAuthUI_);
        });
      });
    }
  });
};

/**
 * Renders login page.
 * @see https://firebase.google.com/docs/auth/web/firebaseui
 * @private
 */
const renderLogin_ = () => {
  render('login', null, () => {
    getFirebaseAuthUI_().then(() => {
      const /** !Object */ config = {
        'signInOptions': [
          firebase.auth.EmailAuthProvider.PROVIDER_ID,
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          // firebase.auth.TwitterAuthProvider.PROVIDER_ID
        ],
        'callbacks': {
          'signInSuccessWithAuthResult': () => {
            return false;
          },
          'signInFailure': (error) => {
            console.error('signInFailure:', error);
          },
        },
      };

      firebaseAuthUI_.start(
          '#firebaseui-auth-container',
          /** @type {!firebaseui.auth.Config} */ (config));
    });
  });
};

/**
 * Loads requested library.
 * @param {string} library The library file name.
 * @param {!Function} callback The callback function.
 * @see https://firebase.google.com/docs/web/setup#available-libraries
 * @see https://firebaseopensource.com/projects/firebase/firebaseui-web/
 * @private
 */
const loadLibrary_ = (library, callback) => {
  const /** string */ version = 0 === library.indexOf('firebase-ui-auth') ?
                                'ui/4.8.0/' : '8.3.0/';
  const /** string */ path = 'https://www.gstatic.com/firebasejs/' + version;
  const /** boolean */ isScript = '.js' === library.slice(-3);
  const /** string */ tagName = isScript ? 'script' : 'link';
  const /** ?Element */ element = dom.makeNode(tagName);

  if (isScript) {
    element.src = path + library;
    element.async = true;
  } else {
    element.href = path + library;
    element.rel = 'stylesheet';
  }

  element.onload = callback;
  dom.appendNode(dom.getDocument().body, element);
};

/**
 * Initializes user account form.
 * @param {string} user The user ID.
 * @param {!Object} account The account data.
 * @private
 */
const initAccount_ = (user, account) => {
  const button = dom.getElement('btn-save');
  const inputs = button.form.elements;
  const fields = ['age', 'income', 'skin-type', 'skin-concern', 'ethnicity'];

  fields.forEach((field) => {
    if (inputs[field]) {
      inputs[field].value = account[field] || '';
    }
  });

  dom.addEvent(button, 'click', (event) => {
    event.preventDefault();

    fields.forEach((field) => {
      if (inputs[field]) {
        account[field] = inputs[field].value;
      }
    });

    button.disabled = true;

    saveData_('users', user, account).then(() => {
      button.disabled = false;
      alert('Saved');
    });
  });
};

/**
 * Initializes user sign in, sign out, and profile links.
 * @param {?Object} user The user object.
 * @private
 */
const initUserLinks_ = (user) => {
  const doc = dom.getDocument();
  const root = doc.documentElement;
  const mapping = {
    '.auth-link': {
      href: ['#/signout/', '#/signin/'],
      text: ['Sign Out', 'Sign In'],
    },
    '.auth-profile': {
      href: ['#/profile/', '#/signin/'],
      text: ['My Profile', 'Join Now'],
    },
  };

  for (const selector in mapping) {
    if (mapping.hasOwnProperty(selector)) {
      const links = dom.getElementsBySelectors(root, selector);
      const attrs = mapping[selector];
      for (let i = 0; i < links.length;) {
        const link = links[i++];
        link.setAttribute('href', user ? attrs.href[0] : attrs.href[1]);
        link.textContent = user ? attrs.text[0] : attrs.text[1];
        link.style.visibility = 'visible';
      }
    }
  }

  user ?
    root.classList.add('is-authenticated') :
    root.classList.remove('is-authenticated');
};

/**
 * @private
 */
const intiPurchaseButton_ = () => {
  const btn = dom.getElement('btn-purchase');
  const url = window.localStorage.getItem('product_redirect_url');
  if (url) {
    btn.onclick = () => {
      window.localStorage.removeItem('product_redirect_url');
      window.open(url, '_blank');
    };
  } else {
    dom.deleteNode(btn);
  }
};

/**
 * Products storage.
 * @type {!Array<?Object>}
 * @private
 */
const products_ = [];

/**
 * @type {?firebaseui.auth.AuthUI}
 * @private
 */
let firebaseAuthUI_;

/**
 * @type {?firebase.firestore.Firestore}
 * @private
 */
let firestore_;
