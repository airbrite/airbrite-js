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
