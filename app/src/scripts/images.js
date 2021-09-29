/**
 * Gets product image.
 * @param {!Object} product The product object.
 * @return {string} Returns a product image.
 */
export const getImage = (product) => {
  let /** string */ src = product['img_url'];

  if (!src) {
    if ('sephora' === product['vendor']) {
      src = getSephoraImage_(product['sku_id']);
    }
  }

  return (
    src ||
    ('localhost' === location.hostname && getRamdomImage_()) ||
    'data:image/gif;base64,' +
      'R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='
  );
};

/**
 * @return {string} Gets ramdom image for local development.
 */
const getRamdomImage_ = () => {
  const skus = ['2270270', '2206092', '2054914', '1891779', '2320695'];
  const sku = skus[Math.floor(Math.random() * skus.length)];
  return getSephoraImage_(sku);
};

/**
 * @param {string} sku The product SKU ID.
 * @return {string} Returns product image URL.
 * @private
 */
const getSephoraImage_ = (sku) => {
  return (
    'https://www.sephora.com/productimages/sku/s' +
    sku +
    '-main-zoom.jpg?imwidth=300'
  );
};
