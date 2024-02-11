const fs = require('fs');
const path = require('path');
const semaphore = require('../libs/semaphore');

// -----------------------------------------------------------------------------
// -- Tests
// --
const sema = semaphore( ()=>console.log("Fin du semaphore") );
console.log(sema);
sema.take();
console.log(sema);
sema.take();
console.log(sema);
sema.release();
console.log(sema);
sema.release();
console.log(sema);
