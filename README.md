Airbrite.js
===========

Airbrite.js makes it easy to bring e-commerce logic in the client-side
of your application.

### Configuring the API

You should start by configuring your client API using your publishable
key:

    Airbrite.setPublishableKey('pk_test_7891f09e86196e4cca15b93141df3c4df7a92063');

You can optionally also configure a payment gateway. In that case,
Airbrite.js will handle tokenizing of the payment information for you:

    Airbrite.setPaymentToken({ stripe: {
      publishableKey: 'pk_test_nMd9IihA9sjwaMMeJAyZz7OZ'
    });

### Retrieving product information

Airbrite.js is based on Backbone.js Models and Collections

You can retrieve a list of products to display:

    var myProducts = Airbrite.Products();
    myProducts.fetch();
