const express = require('express');
const compression = require('compression');
const fs = require('fs');
const path = require('path');
const pg = require('pg');
const brands = require('./brands');
const deals = require('./deals');
const search = require('./search');
const prices = require('./prices');
require('dotenv').config();

const app = express();
const CONTEXT_PATH = '/';
const API_BASE = CONTEXT_PATH + 'bff/api/v1/';
const APP_PATH = 'dev' === process.env.NODE_ENV ? 'src' : 'www';

const QUERY_MAPPING = {
  'best-deals': deals.getDeals,
  'recommended-products': deals.getRecommended,
  'top-brands': brands.getTopBrands,
  'brands-names': brands.getBrandsNames,
  'lowest-price': prices.getLowestPrice,
  'price-timeline': prices.getPriceTimeline,
};
const ROUTE_REGEXP = new RegExp(
  API_BASE +
  '(best-deals|recommended-products|top-brands|brands-names)'
 );

process.env.PORT = process.env.PORT || 4000;

app.use(compression({ threshold: 0 }));
app.use((req, res, next) => fixESModules_(req, res) || next());
app.use(CONTEXT_PATH, express.static('./app/' + APP_PATH, { maxAge: 864E5 }));

app.disable('x-powered-by');

/**
 * Gets mocked data for specified query.
 * @param {string} query The named query.
 * @param {!function(!Object)} callback The callback function.
 */
const getMockedData = (query, callback) => {
  query = query.replace(/\-+/g, '_').replace(/\W+/g, '').replace(/_/g, '-');
  const filepath = path.join(__dirname, 'mocks/' + query + '.json');
  fs.readFile(filepath, (err, data) => {
    if (err) console.error('fs.readFile:', err);
    callback(data);
  });
};

/**
 * @see https://github.com/vpodk/BeautyBuy/issues/58
 * @see https://github.com/vpodk/BeautyBuy/issues/59
 */
app.get(ROUTE_REGEXP, (req, res, next) => {
  getData_(req.path.slice(API_BASE.length), res);
});

app.get(API_BASE + 'lowest-price/:productId', (req, res, next) => {
  getData_('lowest-price', res, +req.params.productId);
});

app.get(API_BASE + 'price-timeline/:productId', (req, res, next) => {
  getData_('price-timeline', res, +req.params.productId);
});

/**
 * Handles search action.
 * Uses the same environment variables as libpq to connect to a PostgreSQL server.
 * @see https://node-postgres.com/features/connecting
 * @see .evn file in the root directory of this project.
 */
app.get(API_BASE + 'search', (req, res, next) => {
  const params = {
    keyword: (req.query.q || '').toLowerCase(),
    designers: (req.query.designers || '').toLowerCase(),
    savings: (req.query.savings || '').toLowerCase(),
    concern: (req.query.concern || '').toLowerCase(),
    skincare: (req.query.skincare || '').toLowerCase(),
    price_range: (req.query.price_range || '').toLowerCase(),
  };
  const offset = +req.query.offset || 0;
  const client = new pg.Client();

  // https://node-postgres.com/features/connecting
  client.connect()
        .then(() => {
          const promises = search.doSearch(client, params, offset);

          Promise.all(promises)
            .then(results => {
              const data = {};
              results.forEach((result) => {
                if (result.rowCount == 1 &&
                    result.fields.length == 1 &&
                    result.fields[0].name == 'count') {
                  data.count = +result.rows[0].count || 0;
                } else {
                  data.rows = result.rows;
                }
              });
              res.type('application/json').status(200)
                 .send(JSON.stringify(data).toString('utf8'));
            })
            .catch(err => console.error('client.query:', err))
            .finally(() => client.end())
        })
        .catch(err => {
          console.log('client.connect:', err);
          getMockedData('search', data => {
            data = (data || '{}').toString('utf8');
            res.type('application/json').status(200).send(data);
          })
        });
});

/**
 * Handles firebase action.
 */
app.get(API_BASE + 'firebase', (req, res, next) => {
  const data = JSON.stringify({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_PROJECT_ID + '.firebaseapp.com',
    databaseURL: 'https://' + process.env.FIREBASE_PROJECT_ID + '.firebaseio.com',
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_PROJECT_ID + '.appspot.com',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: 'G-JVWF9L3DWQ'
  });
  res.type('application/json').status(200).send(data.toString('utf8'));
});

/**
 * @param {string} query The named query.
 * @param {Response} response The response object.
 * @private
 */
const getData_ = (query, response, ...params) => {
  const fn = QUERY_MAPPING[query];
  if (fn) {
    const client = new pg.Client();
    client.connect()
    .then(() => {
      fn(client, ...params)
        .then((result) => { responseResult_(response, result) })
        .catch((err) => console.error('client.query:', query, params, err))
        .finally(() => client.end())
    })
    .catch(err => {
      console.log('client.connect:', query, err);
      getMockedData(query, (data) => {
        data = (data || '{}').toString('utf8');
        response.type('application/json').status(200).send(data);
      })
    });
  } else {
    console.error('Could not find handler for', query, 'query');
  }
};

const responseResult_ = (response, result) => {
  const data = {
    count: result.rowCount,
    rows: result.rows
  };
  response.type('application/json').status(200)
          .send(JSON.stringify(data).toString('utf8'));
};

/**
 * Fixes imports of ES modules for local development.
 */
const fixESModules_ = (req, res) => {
  let result = false;
  if ('dev' === process.env.NODE_ENV) {
    const file = req.url.split('?')[0];
    if (file.endsWith('.js')) {
      const src = __dirname + '/../app/src' + file;
      fs.readFile(src, (err, data) => {
        if (err) {
          res.sendStatus(404);
        } else {
          data instanceof Buffer && (data = data.toString());
          data = data.replace(
            " from 'glize';",
            " from 'https://unpkg.com/glize@latest/index.js?module';");
          res.type('text/javascript').status(200).send(data);
        }
      });
      result = true;
    }
  }
  return result;
};

app.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`));
