import store from '../store';
import networkSvc from './networkSvc';

/**
* Ce service gère les demande d'authentification, s'occupe de recupérer les tokens
* et de les stocker dans le store.
*/
// -----------------------------------------------------------------------------
// -- Token managment
// --
async function retrieveToken(rootRepoUID, password){
  try {
    const data = await networkSvc.post(`tokens/${rootRepoUID}`, {pwd: password});
    return (JSON.parse(data.body)).key; // TODO, pour l'instant on se fout de la date d'expiration
  } catch (e) {
    console.log(e.body); // TODO for logger, just an info : authentication failed
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// -- Authentication pop-up
// --
let alreadyAsking = false;

async function passwordPopUp(rootRepoUID, callback){
  try {
    await store.dispatch('modal/open', {
      type: 'password',
      rootRepoUID: rootRepoUID,
      callback,
    });
  } catch (e) { // catch reject
    callback(null);
  }
}

/**
* Ask for authentication
* Reject if a pop-up is already open to avoid resync opening pop-up
*/
async function askAuthentication(rootRepoUID){
  if(alreadyAsking) { // cancel
    return false;
  }

  alreadyAsking = true; // take the resource

  let success = true;
  // synchronous blocking call
  try {
    await new Promise((resolve, reject) => {
      passwordPopUp(rootRepoUID, async (password) => {
        if(password == null) {
          reject();
        }

        let token = await retrieveToken(rootRepoUID, password); // Même si token est undefined on continue puisque de toute façon on n'a déjà un mauvais token
        store.commit('rootRepositories/updateToken', {uid: rootRepoUID, token: token});
        resolve();
      });
    });
  } catch(e) { // reject
    success = false;
  }

  alreadyAsking = false; // free the resource
  return success;
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  askAuthentication,
};
