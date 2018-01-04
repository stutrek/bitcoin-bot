const { getExecutedRecords, removeExpiredRecords, removeExecutedRecords, addRecord } = require('../src/orderReducers');

const userOrders = require('./orders.json');
const userFills = require('./fills.json');
const records = require('./records.json');

console.log('addRecord should add whatever to whatever')
console.log(addRecord([{one: 1}], {two:2}));
console.log('--')

console.log('getExecutedRecord should only return one record');
console.log(getExecutedRecords(records, userFills));
console.log('--');

console.log('removeExpiredRecords should remove one record');
console.log(removeExpiredRecords(records, userOrders));
console.log('original was', records);
console.log('--');

console.log('removeExecutedRecords should remove one record');
console.log(removeExecutedRecords(records, userFills));
console.log('original was', records);
console.log('--');
