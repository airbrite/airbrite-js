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

      if(!_.isEmpty(val) && _.isArray(val)) {
        //Recursion for embedded objects
        var obj2 = _.flattenObject(val);

        ret[key] = obj2;
      } else if (!_.isEmpty(val) && _.get(val, "constructor") === Object) {
        //Recursion for embedded objects
        var obj2 = _.flattenObject(val);

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
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      _.set((attrs = {}), key, val);
    }

    options || (options = {});

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

/**
 * Implements Airbrite.Order
 */
Airbrite = (function(module) {
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

    /**
     * Returns a list of Airbite.Product
     * which are currently in the cart
     * TODO: Can't do this without an endpoint that allows fetching Product
     * by sku instead of product_id
     */
    getItemProducts: function() {
      return this.get('line_items').map(function(line_item) {
        var product = new Airbrite.Product({ sku: line_item.sku});
        product.fetch();
        return product;
      });
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
      if(typeof sku_or_params == 'object') {
        sku = sku_or_params.sku || (sku_or_params.get && sku_or_params.get('sku'));
      } else {
        sku = sku_or_params;
      }
      var lineItems = this.get('line_items');
      var lineItem = _.find( lineItems, function(li) { return li.sku == sku; });
      if( lineItem) {
        this.set({ line_items: _.without( lineItems, lineItem) });
        return true;
      }
    },

    /**
     * Calculates the total amount based on adding up the price for all items
     * in the order
     */
    getItemsSubtotal: function() {
      var priceSum = this.get('line_items').reduce(function(total, item) {
        return total + (item.price * item.quantity);
      }, 0);
      return priceSum / 100.0;
    },

    /**
     * High-level API for adding a payment
     */
    addPayment: function(params) {
      var payments = this.get('payments');
      var payment = {
        gateway: 'stripe',
        amount: params.amount,
        currency: params.currency
      };
      payments.push(payment);
      var _this = this;
      Stripe.createToken(params, function(status, response) {
        if(response.error) {
          // TODO: Handle errors
          console.log('error tokenizing card: ' + response.error.message);
        } else {
          payment.card_token = response.id;
          _this.trigger('change');
          _this.trigger('complete');
        }
      });
    },

    constructor: function() {
      this.on('change', onOrderChanged, this);
      Backbone.Model.apply(this, arguments);
    }
  });

  // Automatically perform some functions as the object is constructed
  // thus enabling more functionality for the user
  function onOrderChanged() {
    var changedValues = this.changedAttributes();
    if(changedValues && 'updated' in changedValues) {
      // This is a change triggered by a save, ignore
      return;
    }
  }

  return module;
})(Airbrite);
