import { DISH_LIBRARY } from '../../meal/constants/dishLibrary';
import { dishCuisineKeys } from '../../utils/dishTaste';
const south = DISH_LIBRARY.filter(d => dishCuisineKeys(d).includes('south-indian') && d.id !== 'rasam');
const northNoSouth = DISH_LIBRARY.filter(d => d.region === 'north' && !dishCuisineKeys(d).some(k => k.includes('south')));
console.log('south-indian-tagged:', south.slice(0,5).map(d => `${d.id}(${d.name})`).join(', '));
console.log('north clean:', northNoSouth.slice(0,5).map(d => `${d.id}(${d.name})`).join(', '));
// what id does rasam have?
console.log('rasam-ish:', DISH_LIBRARY.filter(d => d.name.toLowerCase().includes('rasam')).map(d => d.id).join(','));
console.log('chole-ish:', DISH_LIBRARY.filter(d => d.name.toLowerCase().includes('chole')).map(d => d.id).join(','));
