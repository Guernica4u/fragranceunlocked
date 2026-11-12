// Main accords and note icons, worked out from each fragrance's notes.
// A note can feed several accords (Orange Blossom: citrus, floral, white floral).
export const ACCORDS = [
  ['Citrus', '#f6e94a', 'bergamot lemon lime grapefruit mandarin orange tangerine neroli petitgrain'],
  ['Floral', '#f06d95', 'rose jasmine iris violet tuberose peony lily freesia ylang osmanthus honeysuckle gardenia heliotrope orchid creeper orris blossom'],
  ['White floral', '#f2e6dc', 'jasmine tuberose gardenia ylang lily honeysuckle blossom'],
  ['Rose', '#e8436f', 'rose'],
  ['Fruity', '#f2683f', 'cherry pear apple pineapple lychee plum peach apricot currant blackcurrant rhubarb fruit fruits berry berries strawberry raspberry blackberry'],
  ['Sweet', '#e8505b', 'vanilla caramel sugar praline marshmallow honey tonka cacao'],
  ['Vanilla', '#f4ecbc', 'vanilla'],
  ['Warm spicy', '#c8461f', 'cinnamon nutmeg saffron clove cumin tobacco cardamom spicy'],
  ['Fresh spicy', '#8fb341', 'pepper ginger coriander juniper cardamom'],
  ['Amber', '#c9671f', 'amber labdanum benzoin ambergris amberwood resin'],
  ['Aromatic', '#3fa58c', 'lavender sage rosemary mint artemisia geranium juniper'],
  ['Fresh', '#a6e3ea', 'mint tea flint'],
  ['Aquatic', '#4bb8d0', 'sea salt marine mineral'],
  ['Green', '#3f9a3a', 'leaf needles'],
  ['Woody', '#7a4a24', 'cedar sandalwood vetiver birch wood woods woody papyrus fir pine cashmeran amberwood agarwood oud'],
  ['Earthy', '#6a5a3e', 'patchouli vetiver moss oakmoss'],
  ['Musky', '#d9cbd6', 'musk ambrette aldehydes ambroxan ambrox cashmeran'],
  ['Powdery', '#ecd8c8', 'iris orris violet heliotrope aldehydes'],
  ['Leather', '#6e4433', 'leather'],
  ['Smoky', '#8b8a86', 'incense birch tobacco'],
  ['Oud', '#3e2e22', 'oud agarwood'],
  ['Coffee', '#5b3a22', 'coffee'],
  ['Nutty', '#c79a6b', 'almond pistachio'],
  ['Tropical', '#f2a33a', 'coconut pineapple'],
].map(([name, color, words]) => ({ name, color, words: words.split(' ') }));

const ICONS = [
  ['🍋', 'lemon lime'], ['🍊', 'orange mandarin tangerine bergamot neroli petitgrain grapefruit'],
  ['🍒', 'cherry'], ['🍐', 'pear'], ['🍍', 'pineapple'], ['🍏', 'apple'], ['🍑', 'peach apricot'],
  ['🫐', 'currant blackcurrant blackberry plum'], ['🍓', 'strawberry raspberry berry berries'], ['🍈', 'lychee'],
  ['🥥', 'coconut'], ['🍇', 'fruit fruits'], ['🌱', 'rhubarb'],
  ['🌹', 'rose'], ['🌺', 'peony orchid creeper'], ['💐', 'violet iris orris heliotrope'],
  ['🌸', 'jasmine gardenia tuberose ylang blossom lily honeysuckle freesia osmanthus'],
  ['🍦', 'vanilla'], ['🍬', 'caramel sugar praline marshmallow'], ['🍯', 'honey'], ['🍫', 'cacao'], ['☕', 'coffee'],
  ['🌰', 'almond pistachio tonka'], ['🫚', 'ginger'], ['🌶️', 'pepper cinnamon nutmeg clove cardamom cumin coriander saffron spicy'],
  ['🍵', 'tea'], ['🌿', 'lavender sage rosemary mint geranium juniper leaf needles artemisia'],
  ['🌊', 'sea marine'], ['🧂', 'salt'], ['🪨', 'mineral flint'],
  ['🍂', 'tobacco vetiver patchouli moss oakmoss'], ['💨', 'incense'], ['👜', 'leather'],
  ['🔶', 'amber ambergris labdanum benzoin resin'], ['☁️', 'musk ambrette aldehydes ambroxan ambrox cashmeran'],
  ['🪵', 'cedar sandalwood birch wood woods woody papyrus fir pine amberwood agarwood oud'],
].map(([icon, words]) => ({ icon, words: words.split(' ') }));

// Whole words only, so "rose" doesn't match "rosemary".
const wordsOf = note => note.toLowerCase().split(/[^a-z]+/);
const hit = (note, words) => wordsOf(note).some(w => words.includes(w));

export const noteIcon = note => ICONS.find(x => hit(note, x.words))?.icon || '✨';

// [{ name, color, pct }] strongest first; pct is relative to the strongest (like Fragrantica's bars).
export function accords(notes) {
  const n = new Map();
  for (const note of notes) for (const a of ACCORDS) if (hit(note, a.words)) n.set(a, (n.get(a) || 0) + 1);
  const max = Math.max(0, ...n.values());
  return [...n].sort((a, b) => b[1] - a[1]).map(([a, v]) => ({ name: a.name, color: a.color, pct: Math.max(30, Math.round(100 * v / max)) }));
}

// Dark or light label text for a bar color.
export function ink(hex) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1a1714' : '#fff';
}
