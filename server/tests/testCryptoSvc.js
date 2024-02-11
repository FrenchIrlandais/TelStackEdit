const fs = require('fs');
const path = require('path');
const cryptoSvc = require('../../src/common/cryptoSvc');

// -----------------------------------------------------------------------------
// -- Tests
// --
let password = "applepie";
console.log(cryptoSvc.hashString(password));
console.log(cryptoSvc.hashString(password)); // 1179400178


/**
* Exemple de test :
const sema = semaphoreConstructor(()=>console.log("Fin du semaphore"));
console.log(sema);
sema.take();
console.log(sema);
sema.take();
console.log(sema);
sema.release();
console.log(sema);
sema.release();
console.log(sema);
*/
