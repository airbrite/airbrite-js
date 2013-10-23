/**
 * Airbrite.Product
 */
Airbrite = (function(module) {
  module.Product = Backbone.Model.extend({
    idAttribute: '_id',
    urlRoot: module._getBaseUrl() + '/products',
    sync: module._syncWithKey
  });

  module.Products = Backbone.Collection.extend({
    model: module.Product,
    url: module._getBaseUrl() + '/products',
    sync: module._syncWithKey,
    parse: function(response, options) {
      return response.data;
    }
  });

  return module;
})(Airbrite);
