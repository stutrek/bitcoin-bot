const createReplacementOrder = require('../src/createReplacementOrder');

let records = require('./records.json');
let replacementOrder = createReplacementOrder(records[0], 'bob');

console.log('replacement order');
console.log(replacementOrder, records[0].order);
console.log('--')
