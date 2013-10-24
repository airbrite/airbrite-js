Airbrite.js
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
    });

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
      exp_year: ‘16’
    });
```

You will know that tokenization is ready by listening to the 'complete'
event:

```
    myOrder.on('complete', function() {
      console.log('payment token ready: ' +
        myOrder.get('payments[0].card_token'));
    });
```

Finally, you submit the order simply by saving it into our backend:

```
    myOrder.save();
```

## Retrieving product information

Airbrite.js is based on Backbone.js Models and Collections

You can retrieve a list of products from your catalog:

    var myProducts = Airbrite.Products();
    myProducts.fetch();
