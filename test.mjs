import assert from 'node:assert/strict';
import { ml, pick, clean, match } from './functions/api/prices.js';

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
assert.equal(clean('Creed Aventus Eau de Parfum for Men', 'Creed'), 'aventus');
assert.equal(clean('Aventus EDP 3.4 oz. / 100ml'), 'aventus');
assert.equal(clean("Love, Don't Be Shy EDP"), 'love don t be shy');
assert.equal(clean('Chanel No.5 Eau de Parfum', 'Chanel'), 'no 5');
assert.equal(clean('No. 5'), 'no 5');

// Real Arvella results: the flanker comes first but the original wins.
const sauvage = [{ title: 'Sauvage Elixir EDP' }, { title: 'Sauvage EDP' }];
assert.equal(match(sauvage, 'Sauvage', 'Dior').title, 'Sauvage EDP');
assert.equal(match([{ title: 'Aventus For Her EDP' }, { title: 'Aventus EDP' }], 'Aventus', 'Creed').title, 'Aventus EDP');
assert.equal(match([{ title: 'Sauvage Elixir EDP' }], 'Sauvage', 'Dior').title, 'Sauvage Elixir EDP'); // fallback
assert.equal(match([{ title: 'Bleu de Chanel' }], 'Aventus', 'Creed'), null);
assert.equal(match([{ title: 'Hero EDP', vendor: 'Burberry' }], 'Her', 'Burberry'), null);
assert.equal(match([{ title: 'Her Intense EDP', vendor: 'Burberry' }], 'Her', 'Burberry').title, 'Her Intense EDP');
assert.equal(match([{ title: "L'Homme EDT", vendor: 'Yves Saint Laurent' }], "L'Homme", 'Prada'), null);
assert.equal(match([{ title: "L'Homme EDT", vendor: 'Prada' }], "L'Homme", 'Prada').title, "L'Homme EDT");
assert.equal(match([{ title: "Terre d'Hermes EDT", vendor: 'Hermes' }], "Terre d'Hermès", 'Hermès').title, "Terre d'Hermes EDT");
console.log('ok');
