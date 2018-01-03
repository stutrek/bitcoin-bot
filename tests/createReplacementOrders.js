const createReplacementOrders = require('../src/createReplacementOrders');

let { state, executedOrders } = require('./stateAndExecutedOrders.json');

let replacementOrders = createReplacementOrders(state, executedOrders, 'bob');

console.log(replacementOrders);
debugger;
