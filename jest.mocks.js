module.exports = {
  language: 'es',
  t: (key, params) => `${key}(${JSON.stringify(params || {})})`,
};
