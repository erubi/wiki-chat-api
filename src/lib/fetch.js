const fetch = require('node-fetch');
const qs = require('qs');

const fetchStatusHandler = (response) => {
  if (response.status === 200) {
    return response;
  }

  throw new Error(response.statusText);
};

module.exports = {
  post(url, body) {
    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    .then(fetchStatusHandler)
    .then(res => res.json());
  },

  get(url, body = {}) {
    const query = qs.stringify(body);

    return fetch(`${url}?${query}`)
    .then(fetchStatusHandler)
    .then(res => res.json());
  },
};

