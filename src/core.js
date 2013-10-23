/**
 * Core component. 
 * SDK configuration, common functions, etc.
 */
Airbrite = (function(){
  var module = {};

  // Secret or public/publishable key
  var _key;

  // Airbrite API endpoint
  var _baseUrl = 'https://api.airbrite.io/v2';

  module._syncWithKey = function(method, model, options) {
    options.beforeSend = function(xhr) {
      xhr.withCredentials = true;
      xhr.setRequestHeader('Authorization', _key);
    };
    Backbone.sync.call(this, method, model, options);
  };

  module.setPublishableKey = function(key) {
    _key = key;
  };
  module.getPublishableKey = function() {
    return _key;
  };

  module.setPaymentToken = function(paymentToken) {
    if('stripe' in paymentToken) {
      Stripe.setPublishableKey(paymentToken.stripe.publishableKey);
    } else {
      throw new Error('Please provide a supported gateway configuration.'
                     +' Currently supported payment gateways: stripe');
    }
  };

  module._getBaseUrl = function() {
    return _baseUrl;
  };

  return module;
})();
