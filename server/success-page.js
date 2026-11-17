/**
 * Stripe /success page: localized (en | es) by the `lang` query parameter.
 * Default (no or unsupported `lang`) is English, which is what the page always showed before.
 * Plain-text error replies are localized too and never echo internal error messages.
 */

const SUCCESS_LANGUAGES = ['en', 'es'];
const SUCCESS_DEFAULT_LANGUAGE = 'en';

const TEXT = {
  en: {
    title: 'Payment Successful',
    heading: 'Payment Successful!',
    activated: 'Your subscription has been activated.',
    close: 'You can now close this window and return to the app.',
    missingSession: 'Missing session_id parameter',
    missingMetadata: 'Session missing required metadata',
    paymentPending: 'Your payment has not been completed yet.',
    genericError: 'Something went wrong. Please try again later.',
  },
  es: {
    title: 'Pago exitoso',
    heading: '¡Pago exitoso!',
    activated: 'Tu suscripción fue activada.',
    close: 'Ya puedes cerrar esta ventana y regresar a la app.',
    missingSession: 'Falta el parámetro session_id',
    missingMetadata: 'A la sesión le faltan datos requeridos',
    paymentPending: 'Tu pago aún no se ha completado.',
    genericError: 'Algo salió mal. Inténtalo de nuevo más tarde.',
  },
};

/** 'es', 'ES-mx' -> 'es'; 'en-US' -> 'en'; anything else -> 'en' (current behaviour). */
function resolveSuccessLanguage(query) {
  let raw = query && query.lang;
  if (Array.isArray(raw)) raw = raw[0];
  if (typeof raw !== 'string') return SUCCESS_DEFAULT_LANGUAGE;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return SUCCESS_LANGUAGES.includes(base) ? base : SUCCESS_DEFAULT_LANGUAGE;
}

function successText(lang, key) {
  return (TEXT[lang] || TEXT[SUCCESS_DEFAULT_LANGUAGE])[key];
}

function renderSuccessPage(lang) {
  const l = SUCCESS_LANGUAGES.includes(lang) ? lang : SUCCESS_DEFAULT_LANGUAGE;
  const t = TEXT[l];
  return `
          <!DOCTYPE html>
          <html lang="${l}">
            <head>
              <title>${t.title}</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-align: center;
                  padding: 20px;
                }
                .container {
                  background: rgba(255, 255, 255, 0.1);
                  backdrop-filter: blur(10px);
                  border-radius: 20px;
                  padding: 40px;
                  max-width: 500px;
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
                }
                h1 { margin: 0 0 20px 0; font-size: 2em; }
                p { margin: 10px 0; font-size: 1.1em; opacity: 0.9; }
                .success-icon {
                  font-size: 4em;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="success-icon">✅</div>
                <h1>${t.heading}</h1>
                <p>${t.activated}</p>
                <p>${t.close}</p>
              </div>
            </body>
          </html>
        `;
}

module.exports = { SUCCESS_LANGUAGES, SUCCESS_DEFAULT_LANGUAGE, resolveSuccessLanguage, successText, renderSuccessPage };
