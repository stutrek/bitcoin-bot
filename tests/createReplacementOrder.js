const createReplacementOrder = require('../src/createReplacementOrder');

let records = require('./records.json');
let tickers = require('./tickers.json');

console.log('Replacing a sell')
console.log('medium replacement order');
let replacementOrder = createReplacementOrder(records[0], tickers.medium);
console.log(replacementOrder, records[0].order, tickers.medium);
console.log('--')

console.log('small replacement order');
replacementOrder = createReplacementOrder(records[0], tickers.low);
console.log(replacementOrder, records[0].order, tickers.low);
console.log('--')

console.log('big replacement order');
replacementOrder = createReplacementOrder(records[0], tickers.high);
console.log(replacementOrder, records[0].order, tickers.high);
console.log('--')

console.log('Replacing a buy')
console.log('medium replacement order');
replacementOrder = createReplacementOrder(records[1], tickers.medium);
console.log(replacementOrder, records[1].order, tickers.medium);
console.log('--')

console.log('small replacement order');
replacementOrder = createReplacementOrder(records[1], tickers.low);
console.log(replacementOrder, records[1].order, tickers.low);
console.log('--')

console.log('big replacement order');
replacementOrder = createReplacementOrder(records[1], tickers.high);
console.log(replacementOrder, records[1].order, tickers.high);
console.log('--')
