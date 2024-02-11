const serveStatic = require('serve-static');
const bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');
var express = require('express');
var https = require('https');
const rootRepository = require('./libs/rootRepositoryManager');
const authenticationToken = require('./libs/authenticationToken');

// -----------------------------------------------------------------------------
// -- Constants
// --
// default port where dev server listens for incoming traffic
const PORT = 4965;

// -----------------------------------------------------------------------------
// -- Utilitaries
// --
const REGEX_FILE_GUID = /^([A-Za-z0-9]*)-(.*)$/g

/**
* @return {rootRepo: , filepath: }
*/
function extractFileLocalPath(fileGUID){
  // Split GUID
  if(!fileGUID.match(REGEX_FILE_GUID)){
    return {rootRepo: undefined, filepath: undefined};
  }
  const repoUID = RegExp.$1;
  const fileUID = RegExp.$2;

  // Retrieve root repo
  let rootRepo = REPOSITORIES[repoUID];
  if(rootRepo == undefined){
    return {rootRepo: undefined, filepath: undefined};
  }

  // Retrieve file info
  // On a pas besoin de reload le root-repository puisque si on request cet ID c'est qu'on le connait.
  // Après il pourrait avoir disparu ...
  let fileInfo = rootRepo.filesUIDMap.get(fileUID);
  if(fileInfo !== undefined){
    return {
      rootRepo: rootRepo,
      filePath: path.join(rootRepo.rootPath, fileInfo.relativePath)
    };
  }
}

// -----------------------------------------------------------------------------
// -- HTTPS certificats
// --
const httpsConfiguration = {
  key: fs.readFileSync(path.join(__dirname, 'ssl', 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'ssl', 'cert.pem'))
}
// openssl req -x509 -newkey rsa:2048 -nodes -keyout key.pem -out cert.pem

// -----------------------------------------------------------------------------
// -- All repositories
// --
let REPOSITORIES = {};

function rootRepositoryConfiguration(repo){
  return {
    name: repo.name,
    description: repo.description,
    icon: repo.icon,
  };
}
function getConfigurations(){
  const result = {};
  Object.entries(REPOSITORIES).forEach(([key, value]) => result[key] = rootRepositoryConfiguration(value));
  return result;
}

function retrieveTokenType(securityLevel){
  if (securityLevel === "HIGH"){
    return authenticationToken.FIFTEEN_MINUTES_TOKEN;
  } else if (securityLevel === "MEDIUM"){
    return authenticationToken.ONE_DAY_TOKEN;
  } else if (securityLevel === "LOW"){
    return authenticationToken.ONE_MONTH_TOKEN;
  } else {
    throw '[Error]: Unknown security level: ' + securityLevel;
  }
}

//
// Add all active repositories
//
/**
* Read configuration.json file and import all root repositories
*/
fs.readFile(path.join(__dirname,'configuration.json'), 'utf8', (err, data) => {
  if (err) {
    console.log('[Error]: Unable to retrieve root repositories list.');
    console.error(err);
    return;
  }

  // Reset
  REPOSITORIES = {};
  try {
    console.log('[Info]: Retrieving root repositories list.');
    let configuration = JSON.parse(data);
    configuration.repositories.forEach((repo) => {
      let rootPath = path.join(__dirname, ...repo.chdir);
      console.log('[Info]: Loading <' + repo.name + '> from: ' + rootPath);

      // security level
      let tokenType = retrieveTokenType(repo.securityLevel);

      const result = rootRepository(repo.uid, repo.name, rootPath, repo.description, repo.icon, repo.ignore, repo.requested, repo.passwordHash, tokenType);

      // First load in order to test errors
      result.asyncUpdate(() => {
        console.log('[Info]: <' + result.name + '> has been loaded successfully.');
      });
      REPOSITORIES[repo.uid] = result;
    });
  } catch (e) {
    console.log('[Error]: Unable to retrieve root repositories list.');
    console.error(err);
  }
});


// -----------------------------------------------------------------------------
// -- Web server
// --
var app = express();

// -----------------------------------------------------------------------------
// -- Middleware
// --
// Les middlewares sont des fonction (req, res, next) qui vont intervenir avant la
// callback (req, res) des différents calls get, post, delete

//
// Application
// Expose the result of the build: /dist directory. Most of it will be in /static
app.use(serveStatic(path.join(__dirname, '..', 'dist')));

//
// Body parser
// Permet de recupérer dans req.body les POST parameters dans le cas d'une POST request
// Doc: https://stackabuse.com/get-http-post-body-in-express-js/

//app.use(bodyParser.urlencoded({ extended: true })); // Pour les url query parameters

// json(): Parses JSON-formatted text for bodies with a Content-Type of application/json
/* Je fais ici un safe body parser pour ne pas qu'il retourne des stacks avec des logs de mon serveur */
function safeBodyParser(req, res, next) {
  bodyParser.json()(req, res, (err) => {
      if(err){
        //console.log(err);
        res.status(400).send('Error, malformed JSON body.');
        return;
      }
      next();
  })
}
app.use(safeBodyParser);

//
// Extract token from request
//
function extractAuthenticationToken(req, res, next) {
  // Le header 'authorization' a la forme suivante :
  // Bearer eyJrIjoieUcwNWxHNTdmcWZ4aE9wSm1reUYzb1lkeXdoRklaVGUiLC
  let token = undefined;
  const authHeader = req.headers['authorization'];
  if(authHeader != undefined) {
    token = authHeader.split(' ')[1]; // On retire 'Bearer '
  }
  req.token = token;
  next();
}
app.use(extractAuthenticationToken);

// -----------------------------------------------------------------------------
// -- End points
// --

//
// /static
//
// Authentication: No authentication needed

// Expose the /static directory
app.get('/favicon.ico', (req, res) => res.sendFile(path.join(__dirname, '..', 'static', 'favicon.ico')));


//
// /tokens
//
// Authentication: By password

const REGEX_TOKEN_REQUEST = /^\/tokens\/([A-Za-z0-9]*)/g; // On /tokens/<repo-uid>
app.post('/tokens/*', (req, res) => {
  if(req.url.match(REGEX_TOKEN_REQUEST)){
    let repoUID = RegExp.$1;
    let repo = REPOSITORIES[repoUID];
    if(repo !== undefined){
      // Check password
      let pwd = req.body.pwd;
      if(pwd == undefined){
        res.status(401).send('Error, authentication failed.');
        return;
      }

      const token = repo.getToken(pwd);
      if(token == undefined){
        res.status(401).send('Error, authentication failed.'); // Invalid password
        return;
      }

      res.json(token);
      return;
    }
  }

  // HTTP status 404: NotFound
  res.status(404).send('Error, unknown root repository.');
  return;
});

//
// /repositories
//
// Authentication: By Token - Provide the repo token (sauf pour /repositories )

// List of repo on /repositories
app.get('/repositories', (req, res) => res.json(getConfigurations()));

const REGEX_REPO_UID_REQUEST = /^\/repositories\/([A-Za-z0-9]*)/g; // Explorer on /repositories/<repo-uid>
app.get('/repositories/*', (req, res) => {
  if(req.url.match(REGEX_REPO_UID_REQUEST)){
    let repoUID = RegExp.$1;
    let repo = REPOSITORIES[repoUID];
    if(repo !== undefined){

      // Check authentication
      if(!repo.authenticate(req.token)){
        res.status(401).send('Error, authentication failed.');
        return;
      }

      repo.asyncUpdate(() => {
        res.json(repo.tree);
      });
      return;
    }
  }

  // HTTP status 404: NotFound
  res.status(404).send('Error, unknown root repository.');
});

//
// /files
//
// Authentication: By Token - Provide the repo token

const REGEX_FILE_GUID_REQUEST = /^\/files\/([A-Za-z0-9/-]*)/g;  // TODO foutre ça autre part avec toutes les regles UID & GUID ?
app.get('/files/*', function (req, res) {
  if(req.url.match(REGEX_FILE_GUID_REQUEST)){
    let fileGUID = RegExp.$1;
    let {rootRepo, filePath} = extractFileLocalPath(fileGUID);
    if(filePath !== undefined) {
      console.log("Requesting " + filePath);

      // Check authentication
      if(!rootRepo.authenticate(req.token)){
        res.status(401).send('Error, unauthorized file.');
        return;
      }

      res.sendFile(filePath);
      return;
    }
  }

  res.status(404).send('File not found.');
});


// -----------------------------------------------------------------------------
// -- Run
// --
https.createServer(httpsConfiguration, app).listen(PORT);
console.log('[Info]: Listening at https://localhost:' + PORT)
