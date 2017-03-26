const toBase64 = str => new Buffer(str).toString('base64');
const fromBase64 = str => new Buffer(str, 'base64').toString('ascii');

module.exports = {
  toBase64,
  fromBase64,
};
