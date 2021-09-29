/**
 * Gets product lowest price.
 */
const getLowestPrice = (client, productId) => {
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
          AND CURRENT_DATE - DATE(updated_at) <= 7
          AND (discount_rate <= 0.9 AND discount_rate >= 0)
    ) promo	
    INNER JOIN (
        SELECT * FROM products where product_name IS NOT NULL
    ) prod ON promo.product_id = prod.product_id
    LEFT JOIN (
        SELECT product_id, 
               ever_discount_price AS lowest_price,
               ever_discount_rate AS best_discount_rate
        FROM best_deals
    ) bd on promo.product_id = bd.product_id
    WHERE prod.product_id=$1`;
  return client.query({text: query, values: [productId]});
};

const getPriceTimeline = (client, productId) => {
  const query = `
    SELECT DATE(updated_at),
           CASE
              WHEN discount_price IS NULL THEN price
              ELSE discount_price
           END AS price
    FROM history_price					
    WHERE discount_price IS NOT NULL AND product_id=$1
    ORDER BY updated_at LIMIT 365`;
  return client.query({text: query, values: [productId]});
};

module.exports = { getLowestPrice, getPriceTimeline };
