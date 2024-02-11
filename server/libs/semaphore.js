// -----------------------------------------------------------------------------
// -- Semaphore
// --
// Les fonctions asynchrones prennent le semaphore et prennent une ressource.
// Lorsqu'elles appelles leur callback, elle relache une ressource.
// Lorsque la ressource retombe à 0, la callback du sémaphore est appelée
//
// Attention, rien n'empêche la callback d'être appelée plusieurs fois !
//
// Les fonctions qui prennent des semaphores ne sont pas asynchrones, on peut donc
// se permettre de prendre la ressource à l'interieur de celles-ci et non avant leur
// appel.
function semaphoreConstructor(callback){
  return {
    n: 0,
    take: function(){
      this.n = this.n+1;
    },
    release: function(){
      this.n = this.n - 1;
      if(this.n === 0){
        callback();
      }
    }
  }
}

// Voir section test pour plus d'informations...

// -----------------------------------------------------------------------------
// -- Public
// --
module.exports = semaphoreConstructor;
