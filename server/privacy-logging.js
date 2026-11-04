// Suppress legacy free-form logs, which can contain health payloads or credentials.
// Operational monitoring should use fixed codes and counts only.
for (const method of ['log', 'info', 'debug', 'warn', 'error']) console[method] = () => {};
