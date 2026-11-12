import assert from 'node:assert/strict';
import { ml, pick } from './functions/api/prices.js';

assert.equal(ml('3.4 oz / 100 ml Spray'), 100);
assert.equal(ml('1.7 oz. / 50ml'), 50);
assert.equal(ml('3.4 oz'), 101);
assert.equal(ml('Gift box'), 0);

// Real Beauty House variants: picks the 100 ml bottle, not the tester or vial.
assert.deepEqual(pick([
  { title: '1.7 oz / 50 ml Spray', price: '211.75' },
  { title: '3.4 oz / 100 ml Spray', price: '248.89' },
  { title: '3.4 oz / 100 ml Spray Tester', price: '228.49' },
  { title: '0.05 oz Vial Spray', price: '9.79' },
]), { size: 100, price: 248.89 });
assert.equal(pick([{ title: '5ml Travel Spray', price: '40' }]), null);
console.log('ok');
