
/**
 * Gets top brands.
 * @see https://github.com/vpodk/BeautyBuy/issues/59
 */
const getTopBrands = (client) => {
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
            /* AND CURRENT_DATE - DATE(updated_at) <= 2 */
            AND (discount_rate <= 0.9 and discount_rate >= 0)
    ) promo
    INNER JOIN (
        SELECT * FROM products 
        WHERE product_name IS NOT NULL 
            AND LOWER(designer) IN (SELECT LOWER(designer) FROM top_brands)
    ) prod ON promo.product_id = prod.product_id
    WHERE product_name NOT LIKE '%ankle%'
    ORDER BY updated_at DESC `;

  return client.query(query);
};


/**
 * Gets brands names.
 */
 const getBrandsNames = (client) => {
  const query = `
    SELECT DISTINCT(LOWER(designer)) AS designer FROM (
        SELECT product_id, discount_price, discount_rate
        FROM latest_price
        WHERE discount_price > 0
            AND (discount_rate <= 0.9 and discount_rate >= 0)
    ) promo
    INNER JOIN (
        SELECT * FROM products 
        WHERE product_name IS NOT NULL 
            AND LOWER(designer) IN (SELECT LOWER(designer) FROM top_brands)
    ) prod ON promo.product_id = prod.product_id
    WHERE designer NOT LIKE '%lancome%'`;

  return client.query(query);
};


module.exports = { getTopBrands, getBrandsNames };
