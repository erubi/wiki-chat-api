const fetch = require('fetch-cookie/node-fetch')(require('node-fetch'));
const qs = require('qs');
const _ = require('lodash');

const fetchStatusHandler = async (res) => {
  const contentType = res.headers.get('content-type');
  let data;
  if (contentType.includes('json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (res.status === 200) {
    return data;
  }

  return Promise.reject(_.get(data, 'err.message', `Server error ${res.status}`));
};

module.exports = {
  post(url, body) {
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Data-Type', 'json');

    return fetch(`${url}`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    })
    .then(fetchStatusHandler);
  },

  get(url, body = {}) {
    const query = qs.stringify(body);

    return fetch(`${url}?${query}`, {
      method: 'GET',
      credentials: 'include',
    })
    .then(fetchStatusHandler);
  },
};

