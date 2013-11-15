/**
 * Core component
 * SDK configuration, common functions, etc.
 */
window.Airbrite = (function(module){
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
      throw new Error('Please provide a supported gateway configuration.'+
                     ' Currently supported payment gateways: stripe');
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
})(window.Airbrite || {});

// From https://gist.github.com/badave/6997681
_.extend(_, {
  flattenObject: function(obj) {
    var ret = {},
        separator = ".";

    if(_.isArray(obj)) {
      ret = [];
    }

    for (var key in obj) {
      if(!_.isNaN(Number(key))) {
        key = Number(key);
      }
      var val = obj[key];

      var obj2;
      if(!_.isEmpty(val) && _.isArray(val)) {
        //Recursion for embedded objects
        obj2 = _.flattenObject(val);

        ret[key] = obj2;
      } else if (!_.isEmpty(val) && _.get(val, "constructor") === Object) {
        //Recursion for embedded objects
        obj2 = _.flattenObject(val);

        for (var key2 in obj2) {
          var val2 = obj2[key2];

          ret[key + separator + key2] = val2;
        }
      } else {
        ret[key] = val;
      }
    }

    return ret;
  },

  get: function(object, string, defaultReturnObj) { 
    if(_.isEmpty(object) || _.isEmpty(string)) {
      return defaultReturnObj;
    }

    if(!_.isString(string)) {
      string = string.toString();
    }

    string = string.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    string = string.replace(/^\./, ''); // strip leading dot

    var keys = string.split('.');
    var key;

    while (keys.length > 0) {
      key = keys.shift();

      if(_.has(object, key)) {
        object = object[key];
      } else {
        return defaultReturnObj;
      }
    }

    return object;
  },

  set: function(object, string, value) {
    if(_.isUndefined(object)) {
      object = {};
    }

    if(!_.isString(string)) {
      // try anyway
      string = string.toString();
    }

    string = string.replace(/\[(\w+)\]/g, '.$1');  // convert indexes to properties
    string = string.replace(/^\./, ''); // strip leading dot

    var keys = string.split('.');
    var key, val, ptr;

    ptr = object;
    while (keys.length > 0) {
      // Pop first key
      key = keys.shift();

      // This is much cleaner for arrays
      if(!_.isNaN(Number(key))) {
        key = Number(key);
      }

      if (keys.length === 0) {
        // If no more keys left, this is the final key
        ptr[key] = value;
      } else if (ptr[key] && _.isObject(ptr[key])) {
        // Found an object or array at key, keep digging
        ptr = ptr[key];
      } else if(!ptr[key] || !_.isObject(ptr[key])) {
        // undefined or not an object, create an object to have prop
        if(!_.isNaN(Number(key))) {
          ptr[key] = [];
        } else {
          ptr[key] = {};
        }
        ptr = ptr[key];
      } else {
        break;
      }
    }
  }
});

// From https://gist.github.com/badave/6997710

// Getters and setters for backbone model
// Set a hash of model attributes on the object, firing `"change"`. This is
// the core primitive operation of a model, updating the data and notifying
// anyone who needs to know about the change in state. The heart of the beast.
_.extend(Backbone.Model.prototype, {
  get: function(attr, returnObject) {
    return _.get(this.attributes, attr, returnObject);
  },
  set: function(key, val, options) {
    var attr, attrs, unset, changes, silent, changing, prev, current;
    if (key === null || key === undefined) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      _.set((attrs = {}), key, val);
    }

    options = options || {};

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    unset           = options.unset;
    silent          = options.silent;
    changes         = [];
    changing        = this._changing;
    this._changing  = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }

    current = this.attributes, prev = this._previousAttributes;

    // Check for changes of `id`.
    if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

    attrs = _.flattenObject(attrs);

    // For each `set` attribute, update or delete the current value.
    for (attr in attrs) {
      val = attrs[attr];

      if (!_.isEqual(current[attr], val)) changes.push(attr);
      if (!_.isEqual(prev[attr], val)) {
        this.changed[attr] = val;
      } else {
        delete this.changed[attr];
      }

      unset ? delete current[attr] : _.set(current, attr, val);
    }

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = true;
      for (var i = 0, l = changes.length; i < l; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  }
});

/**
 * Implements Airbrite.Order
 */
window.Airbrite = (function(module) {
  module.Order = Backbone.Model.extend({
    idAttribute: '_id',
    sync: module._syncWithKey,
    urlRoot: module._getBaseUrl() + '/orders',
    parse: function(response, options) {
      return response.data;
    },
    defaults: {
      line_items: [],
      payments: []
    },
    validate: function(attrs, options) {
      if(!attrs.line_items || !attrs.line_items.length) {
        return "Order has no items. Use 'addItem' function to add items to your order";
      }
    },

    /**
     * Adds a product to the Order. If a product
     * is already in the order, it adds the requested quantity
     * If no quantity is provided, it will add one
     * The product can be specified by sku, or by Airbrite.Product
     * instance:
     *
     * addProduct({ sku: 1234, quantity: 10});
     * addProduct( 1234, 10);
     * addProduct( myAirbriteProduct, 10);
     **/
    addItem: function(sku_or_params, quantity) {
      // Decode how parameters were passed
      var sku;
      if(typeof sku_or_params == 'object') {
        module._checkParams(['sku', 'quantity'], sku_or_params);

        sku = sku_or_params.sku || (sku_or_params.get && sku_or_params.get('sku'));
        quantity = quantity || sku_or_params.quantity;
      } else {
        sku = sku_or_params;
      }
      quantity = quantity || 1;

      // Look to see if we have an existing product with the same SKU in the order
      // and either increase the quantity or create a new line item
      var lineItems = this.get('line_items');
      var lineItem = _.findWhere( lineItems, { sku: sku });
      if(!lineItem) {
        lineItem = { sku: sku, quantity: 0 };
        lineItems.push( lineItem);
      }
      lineItem.quantity += quantity;

      // We need to manually trigger the change event since we're not
      // changing the array reference
      this.trigger('change');
    },

    /**
     * Removes all the products of this type from the order
     * Returns 'true' iff the item was successfully found and removed
     */
    removeItem: function(sku_or_product) {
      var sku;
      if(typeof sku_or_product == 'object') {
        sku = sku_or_product.sku || (sku_or_product.get && sku_or_product.get('sku'));
      } else {
        sku = sku_or_product;
      }
      var lineItems = this.get('line_items');
      var lineItem = _.find( lineItems, function(li) { return li.sku == sku; });
      if( lineItem) {
        this.set({ line_items: _.without( lineItems, lineItem) });
        return true;
      }
    },

    /**
     * Helper getter for line item information
     */
    getItems: function() {
      return this.get('line_items');
    },

    /**
     * High-level API for adding a payment
     */
    addPayment: function(params, callback) {
      params = params || {};
      module._checkParams(['number','exp_month','exp_year','amount','currency', 'cvc'], params);
      var payments = this.get('payments');
      var payment = {
        amount: params.amount,
        currency: params.currency
      };
      payments.push(payment);

      // If the user has configured Stripe payment gateway through Airbrite.setPaymentToken,
      // load the Stripe library and tokenize the card automatically for her
      var _this = this;
      if(module._getPaymentGateway() == 'stripe') {
        Stripe.createToken(params, function(status, response) {
          if(response.error) {
            var msg =  'Error tokenizing card: ' + response.error.message;
            _this.trigger('error', _this, msg, params);
            if($.isFunction(callback)) {
              callback('error', msg);
            }
          } else {
            payment.card_token = response.id;
            _this.trigger('change');
            _this.trigger('tokenized');
            if($.isFunction(callback)) {
              callback('success');
            }
          }
        });
      } else {
        // If no gateway token has been confiured ... what to do? For now
        // generate an error message indicating the missing configuration
        var msg = 'No payment gateway configured. Use: Airbrite.setPaymentToken()';
        if($.isFunction(callback)) {
          _this.trigger('error', _this, msg);
          callback('error', msg);
        }
      }
    },

    /**
     * Helper method for setting a customer
     */
    setCustomer: function(customer) {
      this.set('customer', customer);
    },

    /**
     * Helper method for setting a shipping address
     */
    setShippingAddress: function(address) {
      this.set('shipping_address', address);
    },

    /**
     * Helper method, equivalent to save but maybe more intuitive for
     * SDK users
     */
    submit: function(callback) {
      var options = {};
      if($.isFunction(callback)) {
        options.success = function(model, response, options) {
          callback('success');
        };
        options.error = function(model, xhr, options) {
          // TODO: Be more specific about the error occurred
          var msg = 'Error submitting order';
          // A validation error arrives here with the return value of the
          // validate method in xhr
          if(typeof(xhr) == 'string') {
            msg += ': ' + xhr;
          }
          // Otherwise it was a network error
          if(typeof(xhr) == "object") {
            // Try to retrieve the message text from the server, if there is one
            try {
              var resp = JSON.parse(xhr.responseText);
              msg += ': ' + resp.meta.error_message;
            // Or fall back to whatever comes in the responseText filed if we can't
            } catch(e) {
              msg += ': ' + xhr.responseText;
            }
          }
          callback('error', msg);
        };
      }
      return this.save({}, options);
    },

    // Workaround to prevent sending to server when validation fails
    // even if the user doesn't provide a parameter object as argument
    save: function() {
      var args = arguments;
      if(args.length === 0) {
        args = [{}];
      }
      return Backbone.Model.prototype.save.apply(this, args);
    }
  });

  return module;
})(window.Airbrite || {});

/**
 * Airbrite.Product
 */
window.Airbrite = (function(module) {
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
})(window.Airbrite || {});
