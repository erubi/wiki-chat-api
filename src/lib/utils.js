// const toBase64 = str => new Buffer(str).toString('base64');
// const fromBase64 = str => new Buffer(str, 'base64').toString('ascii');
const toBase64 = (obj) => {
  if (typeof obj === 'object') return new Buffer(JSON.stringify(obj)).toString('base64');
  return new Buffer(obj).toString('base64');
};

const fromBase64 = (obj) => {
  const res = new Buffer(obj, 'base64').toString('ascii');
  try {
    return JSON.parse(res);
  } catch (e) {
    return res;
  }
};

module.exports = {
  toBase64,
  fromBase64,
};

