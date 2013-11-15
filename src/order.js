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
