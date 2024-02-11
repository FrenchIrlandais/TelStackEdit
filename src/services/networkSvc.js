// -----------------------------------------------------------------------------
// -- Constants
// --
const NETWORK_TIMEOUT = 30 * 1000; // 30 sec

// -----------------------------------------------------------------------------
// -- Utilitaries
// --
function parseHeaders(xhr) {
  const pairs = xhr.getAllResponseHeaders().trim().split('\n');
  const headers = {};
  pairs.forEach((header) => {
    const split = header.trim().split(':');
    const key = split.shift().trim().toLowerCase();
    const value = split.join(':').trim();
    headers[key] = value;
  });
  return headers;
}

// -----------------------------------------------------------------------------
// -- HTTP request
// --
async function httpRequest(url, body = null, headers = {}, method = 'GET', withCredentials = false, isBlob = false, isJson = false) {
  let improvedHeaders = Object.assign({}, headers);
  let improvedBody = body;

  if (isJson) {
    improvedBody = JSON.stringify(body);
    improvedHeaders['Content-Type'] = 'application/json';
  }

  const attempt = async () => {
    try {
      return await new Promise((resolve, reject) => {
        // instantiate request
        const xhr = new window.XMLHttpRequest();
        xhr.withCredentials = withCredentials; // Cette propriété n'a aucun impact pour les requêtes effectuées sur le même site.

        // init time-out
        const timeoutId = setTimeout(() => {
          xhr.abort();
          reject(new Error('Network request timeout.')); // TODO autre type d'erreur ?
        }, NETWORK_TIMEOUT);

        // --
        // -- on load
        // --
        xhr.onload = () => {
          clearTimeout(timeoutId);

          // Build result
          const result = {
            status: xhr.status,
            headers: parseHeaders(xhr),
            body: isBlob ? xhr.response : xhr.responseText,
          };

          // Return result
          if (result.status >= 200 && result.status < 300) {
            resolve(result);
          } else {
            reject(result);
          }
        };

        // --
        // -- on error
        // --
        xhr.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error('Network request failed.')); // TODO autre type d'erreur ?
        };

        // set url
        xhr.open(method, url);

        // set headers
        Object.entries(improvedHeaders).forEach(([key, value]) => {
          if (value) {
            xhr.setRequestHeader(key, `${value}`);
          }
        });

        // set blob
        if (isBlob) {
          xhr.responseType = 'blob';
        }

        // --
        // -- send request
        // --
        xhr.send(improvedBody);
      });
    } catch (err) {
      throw err;
    }
  };

  return attempt();
};

// -----------------------------------------------------------------------------
// -- GET, POST, etc.
// --
async function get(url){
  return httpRequest(url);
}

async function getWithAuth(url, token){
  return httpRequest(url, null, {'Authorization': `Bearer ${token}`});
}

async function post(url, jsonBody = {}){
  return httpRequest(url, jsonBody, {}, 'POST', false, false, true);
}

// -----------------------------------------------------------------------------
// -- Public
// --
export default {
  get,
  getWithAuth,
  post
};
