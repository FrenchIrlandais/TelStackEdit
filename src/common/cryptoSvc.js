// -----------------------------------------------------------------------------
// -- Unique ID utilitary
// --
const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const RADIX = ALPHABET.length;
function randomCharacter(){
  const r = ~~(Math.random() * RADIX);
  return ALPHABET[r];
}

const FILE_UID_LENGTH = 12;
function randomFileUID(){
  let result = '';
  for(var i=0; i<FILE_UID_LENGTH; i++){
    result += randomCharacter();
  }
  return result;
}

// -----------------------------------------------------------------------------
// -- Hash utilitary
// --
function hashString(str) {
  // https://stackoverflow.com/a/7616484/1333165
  let hash = 0;
  if (!str) return 0;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

// -----------------------------------------------------------------------------
// -- Public
// --
module.exports = {
  randomCharacter,
  randomFileUID,
  hashString
};
