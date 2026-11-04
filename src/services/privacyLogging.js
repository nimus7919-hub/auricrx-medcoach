import { getRegion } from './region';
const methods = ['log', 'debug', 'info', 'warn', 'error'];
for (const method of methods) {
  const original = console[method].bind(console);
  console[method] = (...args) => { if (getRegion() !== 'US') original(...args); };
}
