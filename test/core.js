// Tests src/core.js

// Test setPublishableKey() and getPublishableKey() pair
describe('Airbrite', function() {
  describe('#setPublishableKey()', function() {
    it('getPublishableKey() should return the same value set by setPublishableKey()', function() {
      var testKeyValue = '1234';
      Airbrite.setPublishableKey(testKeyValue);
      chai.expect(Airbrite.getPublishableKey()).to.equal(testKeyValue);
    })
  })
});
