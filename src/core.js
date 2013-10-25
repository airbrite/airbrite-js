/**
 * Core component
 * SDK configuration, common functions, etc.
 */
Airbrite = (function(){
  var module = {};

  // Publishable key
  var _key;

  // Airbrite API endpoint
  var _baseUrl = 'https://api.airbrite.io/v2';

  // Keeps track of whether a client-side payment gateway has been successfully configured
  _paymentGateway = undefined;

  module._getPaymentGateway = function() {
    return _paymentGateway;
  };

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
      _loadLibrary({
        moduleVar: 'Stripe',
        versionTestFunc: function(stripe) {
          return stripe.version == 2;
        },
        moduleUrl: "https://js.stripe.com/v2/",
        callback: function() {
          _paymentGateway = 'stripe';
          Stripe.setPublishableKey(paymentToken.stripe.publishableKey);
        }
      });
    } else {
      throw new Error('Please provide a supported gateway configuration.'
                     +' Currently supported payment gateways: stripe');
    }
  };

  module._getBaseUrl = function() {
    return _baseUrl;
  };

  /**
   * Helper method to check for required params for specific methods
   */
  module._checkParams = function(requiredParams, providedParams, errorFunc) {
    // Default parameters
    errorFunc = errorFunc || function(mp) {
      throw Error('Missing parameters: ' + mp.join(', '));
    };
    providedParams = providedParams || {};
    if(typeof(providedParams) != 'object') {
      // Hmm ... not sure how to produce a user-friendly error when the params
      // provided are not the required form. For now, this will produce the default
      // arguments missing error message
      providedParams = {};
    }

    var missingParams = [];
    requiredParams.forEach(function(requiredParam) {
      if(!(requiredParam in providedParams)) {
        missingParams.push(requiredParam);
      }
    });
    if(missingParams.length > 0) {
      errorFunc(missingParams);
    }
  };

  /**
   * Checks for and loads if necessary a library we want to use
   * NOTE: This is only useful for runtime-dependencies and it can't deal very well
   * with collisions with different versions of libraries
   */
  _loadLibrary = function(options) {
    if(!window.console || !window.console.log) { var console = {}; console.log = function() {}; }

    /******** Load jQuery if not present *********/
    if (window[options.moduleVar] === undefined || !options.versionTestFunc(window[options.moduleVar])) {
        var script_tag = document.createElement('script');
        script_tag.setAttribute("type","text/javascript");
        script_tag.setAttribute("src", options.moduleUrl);

        if (script_tag.readyState) {
          script_tag.onreadystatechange = function () { // For old versions of IE
              if (this.readyState == 'complete' || this.readyState == 'loaded') {
                  options.callback();
              }
          };
        } else { // Other browsers
          script_tag.onload = options.callback;
        }
        // Try to find the head, otherwise default to the documentElement
        (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
    } else {

        // Add initialize call here
        options.callback();
    }
  };

  return module;
})();
