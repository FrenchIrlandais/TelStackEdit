const fs = require('fs');
const path = require('path');
const token = require('../libs/authenticationToken');

// -----------------------------------------------------------------------------
// -- Tests
// --
const start = new Date().getTime();
console.log("Start: " + start);
let bunch = token.bunchConstructor(100);

let a = bunch.generate();
let b = bunch.generate();
console.log(b);
let c = bunch.generate();
let d = bunch.generate();
console.log(bunch);

setTimeout(() => {
  console.log("C is valid?: " + bunch.isValid(c.key));
  console.log(bunch);
  let f = bunch.generate();
  console.log(bunch);
  setTimeout(() => console.log("F is valid?: " + bunch.isValid(f.key)), 50);
  setTimeout(() => console.log("F is valid?: " + bunch.isValid(f.key)), 500);
}, 200);
