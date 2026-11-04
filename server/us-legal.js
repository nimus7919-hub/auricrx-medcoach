const policies = require('../src/legal/usPolicies.json');
module.exports = function registerUSLegal(app) {
  const routes = { '/us/terms': 'Terms', '/us/privacy-policy': 'Privacy Policy', '/us/consumer-health-data-privacy-policy': 'Consumer Health Data Privacy Policy' };
  for (const [path, key] of Object.entries(routes)) {
    app.get(path, (_req, res) => res.type('text/plain').send(policies[key]));
  }
  app.get('/us', (_req, res) => res.type('html').send('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AuricRX MedCoach US private beta</title><main><h1>AuricRX MedCoach US private beta</h1><p>General information and reminders for invited adult testers. No public US release.</p><ul><li><a href="/us/terms">Terms</a></li><li><a href="/us/privacy-policy">Privacy Policy</a></li><li><a href="/us/consumer-health-data-privacy-policy">Consumer Health Data Privacy Policy</a></li><li><a href="/account-deletion">Account deletion</a></li></ul></main></html>'));
};
