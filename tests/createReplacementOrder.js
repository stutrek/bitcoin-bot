const createReplacementOrder = require('../src/createReplacementOrder');

const ui = require('../src/ui');
let records = require('./records.json');
let tickers = require('./tickers.json');

let config = {
	percent: 0.0015,
	replacementPercent: 0.0045,
	amount: 0.0015
}

let record = {
	...records[0],
	config
};


console.log('medium replacement order');
let replacementOrder = createReplacementOrder(record, tickers.medium);
ui.printReplacmentFilled({
	order: replacementOrder,
	original: record.order
});
console.log(replacementOrder, record, tickers.medium);
console.log('--')

console.log('small replacement order');
replacementOrder = createReplacementOrder(record, tickers.low);
ui.printReplacmentFilled({
	order: replacementOrder,
	original: record.order
});
console.log(replacementOrder, record, tickers.low);
console.log('--')

console.log('big replacement order');
replacementOrder = createReplacementOrder(record, tickers.high);
ui.printReplacmentFilled({
	order: replacementOrder,
	original: record.order
});
console.log(replacementOrder, record, tickers.high);
console.log('--')
