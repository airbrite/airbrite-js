// Tests src/core.js

// TODO: test setPublishableKey() and getPublishableKey() pair

describe('Airbrite', function() {
  describe('#setPublishableKey()', function() {
    it('getPublishableKey() should return the same value set by setPublishableKey()', function() {
      var testKeyValue = '1234';
      Airbrite.setPublishableKey(testKeyValue);
      // TODO: Use an assert framework
      if(Airbrite.getPublishableKey() != testKeyValue) {
        throw new Error("gaak");
      }
    })
  })
});
