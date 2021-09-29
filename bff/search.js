
const CONCERNS = [
  'acne_prone',
  'anti_ageing',
  'dark_circles',
  'dry',
  'normal_combination',
  'oily',
  'sensitive',
];

const SKINCARE = [].concat(CONCERNS, [
  'cleansers',
  'exfoliators',
  'make_up_removers',
  'toners',
  'moisturisers',
  'lotions',
  'serums',
  'oils',
  'mists',
  'balms',
  'masks',
  'peels',
  'eye_care',
  'lip_balm',
  // 'retinal_products',
  'supplements',
  'mineral',
  'spf30',
  'spf50',
  'tinted',
  'pharmacy_brands',
]);

const SAVINGS = ['up to 25%', '25%-50%', '50%-75%', 'more than 75%'];

const doSearch = (client, params, offset) => {
  const query = `
    SELECT $COLUMNS FROM (
        SELECT product_id,
               product_id AS prod_id,
               price AS original_price,
               discount_price AS current_discount_price,
               discount_rate  AS current_discount_rate,
               updated_at, 
               CASE
                  WHEN discount_rate BETWEEN 0 AND 0.25 THEN 'Up to 25%'
                  WHEN discount_rate BETWEEN 0.25 AND 0.5 THEN '25% - 50%'
                  WHEN discount_rate BETWEEN 0.5 AND 0.75 THEN '50% - 75%'
                  WHEN discount_rate > 0.75 THEN 'More than 75%'
               END AS savings,
               CASE 
                  WHEN discount_price > 500 THEN '>$500'
                  WHEN discount_price BETWEEN 200 AND 500 THEN 'Between $200 and $500'
                  WHEN discount_price BETWEEN 100 AND 200 THEN 'Between $100 and $200'
                  WHEN discount_price BETWEEN 50 AND 100 THEN 'Between $50 and $100'
                  WHEN discount_price BETWEEN 20 AND 50 THEN 'Between $20 and $50'
                  WHEN discount_price < 20 THEN '<$20'
               END AS price_range
        FROM latest_price
        WHERE discount_price > 0
        AND ((discount_rate <= 0.9 AND discount_rate >= 0) OR discount_rate IS NULL)
    ) lp
    LEFT JOIN (
      SELECT * FROM products WHERE product_name IS NOT NULL
    ) prod ON lp.product_id = prod.product_id
    LEFT JOIN (
        SELECT product_id,
               ever_discount_price AS lowest_price,
               ever_discount_rate AS best_discount_rate
        FROM best_deals
        WHERE ever_discount_rate IS NOT NULL
    ) bd ON lp.product_id = bd.product_id
    LEFT JOIN (
        SELECT * FROM product_category
    ) pc ON lp.product_id = pc.product_id`;

  const conditions = [];
  const values = [];
  let index = 0;
  if (params.keyword) {
    if (Number.isInteger(+params.keyword)) {
      index = values.push(escape_(params.keyword));
      conditions.push(`lp.product_id=$${index}`);
    } else {
      index = values.push(`%${escape_(params.keyword)}%`);
      conditions.push(`(LOWER(product_name) LIKE $${index} OR 
                        LOWER(designer) LIKE $${index})`);
    }
  }

  if (params.designers) {
    if ('all' === params.designers) {
      conditions.push('(designer <> \'\' AND designer IS NOT NULL)');
    } else {
      const designers = getArgsList_(params.designers);
      conditions.push(`LOWER(designer) IN (${designers})`);
    }
  }

  if (params.savings) {
    const values =
      'all' === params.savings ? SAVINGS.join(',') : params.savings;
    const savings = getArgsList_(values);
    conditions.push(`LOWER(savings) IN (${savings})`);
  }

  if (params.price_range) {
    if ('all' === params.price_range) {
      conditions.push('(price_range <> \'\' AND price_range IS NOT NULL)');
    } else {
      const range = getArgsList_(params.price_range);
      conditions.push(`LOWER(price_range) IN (${range})`);
    }
  }

  if (params.concern) {
    const values =
      'all' === params.concern ? CONCERNS.join(',') : params.concern;
    const concerns = getBoolConditions_(values);
    concerns && conditions.push(concerns);
  }

  if (params.skincare) {
    if ('not' === params.skincare) {
      conditions.push(
        'lp.product_id NOT IN (SELECT product_id FROM product_category)'
      );
    } else {
      const values =
        'all' === params.skincare ? SKINCARE.join(',') : params.skincare;

      const skincare = getBoolConditions_(values);
      skincare && conditions.push(skincare);
    }
  }

  const condition = conditions.length && ('WHERE ' + conditions.join(' AND '));
  // console.log('condition:', condition);
  const queries = [{
    name: 'fetch-products',
    text: query.replace('$COLUMNS', '*') + 
         ' ' + (condition || '') + ' ' +
         'ORDER BY current_discount_rate DESC ' +
         `LIMIT 200 OFFSET $${index + 1}`,
    values: [...values, +offset || 0]
  }, {
    name: 'fetch-count',
    text: query.replace('$COLUMNS', 'COUNT(DISTINCT lp.product_id)') +
          ' ' + (condition || '') + ' ',
    values: values
  }]

  const promises = [];
  queries.forEach(query => promises.push(client.query(query)));
  return promises;
};

const escape_ = (str) => {
  return unescape(str).replace(/['"]/g, '');
};

const getArgsList_ = (value) => {
  return `'${value.split(',').map(escape_).join("','")}'`;
};

const getBoolConditions_ = (params) => {
  const values = params.split(',').map(escape_);
  const conditions = [];

  for (let value of values) {
    if (SKINCARE.includes(value)) {
      conditions.push(value + '=TRUE');
    }
  }

  return conditions.length && '(' + conditions.join(' OR ') + ')';
}

module.exports = { doSearch };
