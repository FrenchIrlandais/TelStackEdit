const cryptoSvc = require('../../src/common/cryptoSvc');

// -----------------------------------------------------------------------------
// -- Token
// --
const TOKEN_LENGTH = 55;
function randomToken(){
  let result = '';
  for(var i=0; i<TOKEN_LENGTH; i++){
    result += cryptoSvc.randomCharacter();
  }
  return result;
}

const ONE_MONTH_TOKEN = 30 * 24 * 3600 * 1000;
const ONE_DAY_TOKEN = 24 * 3600 * 1000;
const ONE_HOUR_TOKEN = 3600 * 1000;
const FIFTEEN_MINUTES_TOKEN = 900 * 1000;

function generateToken(tokenType){
  const now = new Date().getTime();

  return {
    key: randomToken(),
    expiration: now + tokenType
  }
}

// -----------------------------------------------------------------------------
// -- Token Bunch (trousseau de clés)
// --
function bunchConstructor(tokenType){
  return {
    tokens: {},
    type: tokenType,
    clean: function(now){
      Object.entries(this.tokens).forEach(([key, token]) => {
        if(token.expiration < now) {
          delete this.tokens[key];
        }
      });
    },
    isValid: function(key) {
      const now = new Date().getTime();
      const token = this.tokens[key];
      return (token != undefined) && (token.expiration >= now);
    },
    generate: function() {
      const now = new Date().getTime();
      this.clean(now); // Start by doing some cleaning

      const newToken = generateToken(this.type);
      this.tokens[newToken.key] = newToken;
      return newToken;
    },
  }
}

// -----------------------------------------------------------------------------
// -- Public
// --
module.exports = {
  ONE_MONTH_TOKEN,
  ONE_DAY_TOKEN,
  ONE_HOUR_TOKEN,
  FIFTEEN_MINUTES_TOKEN,
  bunchConstructor
};
