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
// Closest to 100 ml wins: 3.4 oz over 6.7 oz, 4.2 oz when there's no 3.4 oz.
assert.equal(pick([{ title: '6.7 oz', price: '180' }, { title: '3.4 oz', price: '120' }, { title: '1.7 oz', price: '90' }]).size, 101);
assert.equal(pick([{ title: '6.7 oz', price: '180' }, { title: '4.2 oz', price: '150' }]).size, 124);
assert.equal(pick([{ title: '30 ml', price: '40' }, { title: '50 ml', price: '60' }]).size, 50);
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

// Accords and note icons
const { accords, noteIcon, ink } = await import('./accords.js');
assert.deepEqual(accords(['Rosemary']).map(a => a.name), ['Aromatic']); // not Rose
assert.equal(noteIcon('Rosemary'), '🌿');
assert.equal(noteIcon('Turkish Rose'), '🌹');
assert.deepEqual(accords(['Vanilla', 'Vanilla', 'Cedar']).map(a => [a.name, a.pct]), [['Sweet', 100], ['Vanilla', 100], ['Woody', 50]]);
assert.equal(ink('#f6e94a'), '#1a1714');
assert.equal(ink('#3e2e22'), '#fff');
const all = JSON.parse((await import('node:fs')).readFileSync(new URL('./data.json', import.meta.url), 'utf8'))
  .fragrances.flatMap(f => [...f.notes.top, ...f.notes.heart, ...f.notes.base]);
assert.deepEqual(all.filter(n => !accords([n]).length), []); // every note feeds an accord
console.log('accords ok');
