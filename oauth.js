/**
 * Documentation from the developers for the Google oauth2client can be found at:
 * https://github.com/google/google-auth-library-nodejs/blob/master/src/auth/oauth2client.ts
 */

const express = require('express');
const app = express();

const fs = require('fs');
const path = require('path');
const opn = require('opn');

const {google} = require('googleapis');
const plus = google.plus('v1');

/**
 * To use OAuth2 authentication, we need access to a a CLIENT_ID, CLIENT_SECRET, AND REDIRECT_URI.  
 * To get these credentials for your application, visit https://console.cloud.google.com/apis/credentials.
 */

// Construct the path to our key file
const keyPath = path.join(__dirname, 'oauth2.keys.json');
let keys = { redirect_uris: [''] };
// Overwrite our default keys object with the file contents
if (fs.existsSync(keyPath)) {
  keys = require(keyPath).web;
}

// Set the API scope
const scopes = ['https://www.googleapis.com/auth/plus.me'];

// Placeholder for our authorization code
let authorizationCode = '';

/**
 * Create a new OAuth2 client with the configured keys.
 */
const oauth2Client = new google.auth.OAuth2(
  keys.client_id,
  keys.client_secret,
  keys.redirect_uris[0]
);

/**
 * This is one of the many ways you can configure googleapis to use authentication credentials.  
 * In this method, we're setting a global reference for all APIs.  
 * Any other API you use here, like google.drive('v3'), will now use this auth client. 
 * You can also override the auth client at the service and method call levels.
 */
google.options({ auth: oauth2Client });

app.use(express.static('public'));
app.use(express.json()); // for parsing application/json
//app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/', (req, res) => {
    console.log(req.body);
});

app.get('/authorizationCode', (req, res) => {
  // grab the url that will be used for authorization
  const authorizeUrl = oauth2Client.generateAuthUrl({
    // 'prompt' is an optional property which helps to display all steps of the flow
    prompt: 'consent',
    access_type: 'offline',
    scope: scopes.join(' ')
  });
  console.log(authorizeUrl);
  // open the browser to the authorize url to start the workflow
  opn(authorizeUrl, {wait: false}).then(cp => cp.unref());
}); // app.post finished

app.get('/oauth2callback', (req, res) => {
  authorizationCode = req.query.code;
  console.log('Authorization code is: ' + authorizationCode);
  res.status(200).send('Authentication successful! Please return to Postman.');
});

app.get('/tokens', (req, res) => {
  oauth2Client.getToken(authorizationCode).then(tokenResponse => {
    oauth2Client.credentials = tokenResponse.tokens;
    console.log('access_token is: ' + oauth2Client.credentials.access_token);
    console.log('refresh_token is: ' + oauth2Client.credentials.refresh_token);
    console.log('scope: ' + oauth2Client.credentials.scope);
    console.log('token_type is: ' + oauth2Client.credentials.token_type);
    console.log('id_token is: ' + oauth2Client.credentials.id_token);
    res.status(200).json(oauth2Client.credentials);
  });
});

app.get('/profile', (req, res) => {
  runSample()
    .then((result) => {
      res.status(200).send(result.data);
    })
    .catch((result) => {
      res.status(500).send(result.message);
    });
});

async function runSample () {
  // retrieve user profile
  const res = await plus.people.get({ userId: 'me' });
  return res;
}

app.listen(3000, () => console.log('Server listening on port 3000!'));