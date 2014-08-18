Airbrite.js (DEPRECATED)
===========

Airbrite.js makes it easy to bring e-commerce logic in the client-side
of your application.

This Airbrite.js SDK uses [Backbone.js](http://backbonejs.org/)
 models and collections to surface the [Airbrite
API](https://github.com/airbrite/airbrite-api)

## Configuring the SDK

Before using Airbrite.js, configure your client API using your publishable
key:

    Airbrite.setPublishableKey('pk_test_7891f09e86196e4cca15b93141df3c4df7a92063');

You can optionally also configure a payment gateway. In that case,
Airbrite.js will handle tokenizing of the payment information for you:

    Airbrite.setPaymentToken({ stripe: {
      publishableKey: 'pk_test_nMd9IihA9sjwaMMeJAyZz7OZ'
    }});

## Quick start: creating an order

Start by creating a new instance of the Airbrite.Order object

```
    var myOrder = new Airbrite.Order();
```

Add line items to the order:

```
    myOrder.addItem({ sku: '551019015', quantity: 3 });
    myOrder.addItem('551019017');
```

Add customer information:

```
    myOrder.setCustomer({
      'name': 'Jack Daniels',
      'email': 'jack@daniels.ru'
    });
```

Add shipping address

```
    myOrder.setShippingAddress({
        "name": "Jack Daniels",
        "phone": "4151234567",
        "line1": "123 Main St",
        "line2": "Unit 3A",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94105",
        "country": "US"
    });
```

Add payment information. If you configured a supported payment gateway
with Airbrite.setPaymentToken, Airbrite.js will perform tokenization
under the covers for you:

```
    myOrder.addPayment({
      number: ‘4242424242424242’,
      cvc: ‘892’,
      exp_month: ‘11’,
      exp_year: ‘16’,
      amount: 123400,
      currency: 'usd'
    }, responseHandler);
```

The second argument is an optionalcallback function that will be
called on success or error, as follows:

```
    function responseHandler(response, message) {
      if(response == 'error') {
        $('#status-div').val('Error adding payment information: ' + message);
      } else {
        $('#status-div').val('Payment information successfully added');
      }
    }
```

Finally, you submit the order simply by saving it into our backend:

```
    myOrder.submit(responseHandler);
```

You can optionally get notified of success or failure using a callback
function with the same signature described above.

## Retrieving product information

You can retrieve a list of products from your catalog:

```
    var myProducts = Airbrite.Products();
    myProducts.fetch();
```

## Events

Following Backbone convention, Airbrite.js models trigger events to
signal different circumsntances you want to be aware about, such as:

 - Error handling:

```
    myOrder.on('error', function(model, xhr_or_error, options) {
      // Deal with the error
    });
```

 - Model updates:

```
    myProduct.on('change', function(model, options) {
      // Refresh UI to new product property value
    });
```

 - Credit card tokenization complete:

```
    myProduct.on('tokenized', function(model) {
      // Airbrite.js has a payment gateway token ready
    });
```

We encourage you to check the [Backbone.js Catalog of Built-in
Events](http://backbonejs.org/#Events-catalog) for additional
documentation
