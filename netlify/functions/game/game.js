const { URLSearchParams } = require('url');
const fetch = require('node-fetch');
const queryString = require('querystring')
const encodedParams = new URLSearchParams();

// Docs on event and context https://www.netlify.com/docs/functions/#the-handler-method
const handler = async (event) => {
  // parse payload
  let data = event.queryStringParameters
  let eventName = data.event
  let session = data.sessionID
  delete data.event
  delete data.sessionID

  const payload = {
    "event": eventName,
    properties: {
      distinct_id: data.sessionID,
      token: process.env.MIXPANEL_TOKEN,
      ...data
    }
  }
  encodedParams.set('data', JSON.stringify(payload));

  const url = 'https://api.mixpanel.com/track';

  const options = {
    method: 'POST',
    headers: { Accept: 'text/plain', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: encodedParams
  };

  await fetch(url, options)
    .catch(err => console.error('error:' + err));

  return {
    statusCode: 200,
  }
}

module.exports = { handler }
