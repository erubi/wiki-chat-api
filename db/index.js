const pg = require('pg');
const types = require('pg').types;
// const moment = require('moment');
const TIMESTAMPTZ_OID = 1184;
const parseFn = (val) => {
  // return val === null ? null : moment(val)
  // console.log('timstamptz db parsfn val: ', val);
  return val === null ? null : val;
};
types.setTypeParser(TIMESTAMPTZ_OID, parseFn);


const config = {
  user: process.env.PG_USER, // env var: PGUSER
  database: process.env.PG_DB, // env var: PGDATABASE
  host: process.env.PG_HOST, // Server hosting the postgres database
  max: 10, // max number of clients in the pool
  idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

// this initializes a connection pool
// it will keep idle connections open for a 30 seconds
// and set a limit of maximum 10 idle clients
const pool = new pg.Pool(config);

pool.on('error', (err) => {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
});

module.exports.query = (text, values) => {
  console.log('query:', text, values)
  return pool.query(text, values)
};

