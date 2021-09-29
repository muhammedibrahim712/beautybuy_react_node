/**
 * Gets best deals.
 * @see https://github.com/vpodk/BeautyBuy/issues/58
 */
const getDeals = (client) => {
  const query = `
    SELECT * FROM (
      SELECT product_id,
             price AS original_price,
             discount_price AS current_discount_price,
             discount_rate AS current_discount_rate,
             updated_at
      FROM latest_price
      WHERE discount_price IS NOT NULL
          AND discount_price > 0
          AND CURRENT_DATE - DATE(updated_at) <= 5
          AND (discount_rate <= 0.9 and discount_rate >= 0)
    ) promo
    LEFT JOIN (
      SELECT * FROM products
      WHERE product_name IS NOT NULL
    ) prod ON promo.product_id = prod.product_id
  WHERE LOWER(product_name) NOT LIKE '%ankle%' and LOWER(product_name) NOT LIKE '%leather%'
   ORDER BY current_discount_rate DESC `;

  return client.query(query);
};


/**
 * Gets recommended products.
 */
 const getRecommended = (client) => {
  const query = `
    SELECT * FROM (
        SELECT product_id,
               price AS original_price,
               discount_price AS current_discount_price,
               discount_rate AS current_discount_rate,
               updated_at
        FROM latest_price
        WHERE discount_price > 0
            AND (discount_rate <= 0.9 and discount_rate >= 0)
            AND CURRENT_DATE - DATE(updated_at) <= 5
    ) promo
    INNER JOIN (
        SELECT * FROM products 
        WHERE product_name IS NOT NULL 
    ) prod ON promo.product_id = prod.product_id
    WHERE LOWER(product_name) NOT LIKE '%ankle%' and LOWER(product_name) NOT LIKE '%leather%'
    ORDER BY updated_at, current_discount_rate DESC`;

  return client.query(query);
};

module.exports = { getDeals, getRecommended };
