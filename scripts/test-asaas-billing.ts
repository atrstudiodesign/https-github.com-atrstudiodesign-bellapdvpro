import assert from 'node:assert/strict';
import { constantTimeEqual, expectedPrice, moneyToCents } from '../api/asaasBillingCore';
import { parseBellaExternalReference } from '../src/lib/commercialPlans';

assert.equal(constantTimeEqual('token-seguro', 'token-seguro'), true);
assert.equal(constantTimeEqual('token-errado', 'token-seguro'), false);
assert.equal(constantTimeEqual(undefined, 'token-seguro'), false);

assert.deepEqual(parseBellaExternalReference('bellapdv:6ba7b810-9dad-11d1-80b4-00c04fd430c8'), {
  intentId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
});
assert.equal(parseBellaExternalReference('bellapdv:../../outro'), null);
assert.equal(parseBellaExternalReference('outra-plataforma:6ba7b810-9dad-11d1-80b4-00c04fd430c8'), null);

assert.equal(moneyToCents(29.9), 2990);
assert.equal(moneyToCents(-1), null);
assert.equal(moneyToCents('29.90'), null);

assert.equal(expectedPrice('basic', 2990), true);
assert.equal(expectedPrice('basic', 8990), true);
assert.equal(expectedPrice('basic', 7900), false);
assert.equal(expectedPrice('pro', 14990), true);
assert.equal(expectedPrice('pro', 12900), false);
assert.equal(expectedPrice('premium', 24990), true);
assert.equal(expectedPrice('premium', 19700), false);

console.log('Asaas billing core: 16 checks passed');
