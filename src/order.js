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
     * Helper getter for line item information
     */
    getItems: function() {
      return this.get('line_items');
    },

    /**
     * High-level API for adding a payment
     */
    addPayment: function(params) {
      params = params || {};
      module._checkParams(['number','exp_month','exp_year','amount','currency'], params);
      var payments = this.get('payments');
      var payment = {
        amount: params.amount,
        currency: params.currency
      };
      payments.push(payment);

      // If the user has configured Stripe payment gateway through Airbrite.setPaymentToken,
      // load the Stripe library and tokenize the card automatically for her
      if(module._getPaymentGateway() == 'stripe') {
        var _this = this;
        Stripe.createToken(params, function(status, response) {
          if(response.error) {
            _this.trigger('error', _this, 'Error tokenizing card: ' + response.error.message, params);
          } else {
            payment.card_token = response.id;
            _this.trigger('change');
            _this.trigger('complete');
          }
        });
      } else {
        // If no gateway token has been confiured ... what to do? For now, just saving the card
        // information in the order as is
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
    submit: function() {
      return this.save({});
    },

    // Workaround to prevent sending to server when validation fails
    // even if the user doesn't provide a parameter object as argument
    save: function() {
      if(arguments.length == 0) {
        arguments = [{}];
      }
      return Backbone.Model.prototype.save.apply(this, arguments);
    }
  });

  return module;
})(Airbrite);
