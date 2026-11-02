from pathlib import Path
import json,re
es_ret='30 días después de que termine tu suscripción eliminamos tu cuenta y todos tus datos, salvo lo que la ley nos obligue a conservar (por ejemplo, facturas).'
en_ret='30 days after your subscription ends we delete your account and all your data, except what the law requires us to keep, such as invoices.'
for lang in ['es','en']:
 es=lang=='es'
 terms='''# AURICRX MEDCOACH — TÉRMINOS DE SERVICIO

Última actualización: 2 de noviembre de 2026

## Operador
[Auricrx LTD], [Mexico], [Auricrx.ltd@gmail.com].
TODO(OWNER-DECISION): Confirmar razón social, domicilio completo, teléfono y correo de privacidad reales. Se conservan los valores actuales hasta confirmación.

## Elegibilidad y cuenta
Debes tener 18 años o más para usar AuricRX MedCoach. Mantén seguras tus credenciales. Acepta estos términos expresamente al crear tu cuenta.

## Información de salud
AuricRX es una herramienta de recordatorios e información general con IA, no un médico ni un servicio de atención médica. No diagnostica ni indica iniciar, cambiar o suspender medicamentos o dosis. Consulta a un médico o farmacéutico. Si es una emergencia llama al 911 ahora. La información de IA puede ser incorrecta.

## Contenido y privacidad
Conservas la propiedad de tu contenido. Solo lo procesamos para prestar y proteger los servicios solicitados. No vendemos ni compartimos tus datos de salud con fines de publicidad o comercialización. Esta prohibición incluye datos agregados o desidentificados y aplica en todos los mercados.
Tus medicamentos y tu perfil de salud se guardan en nuestros servidores (Neon, EE.UU.) para que funcione la app. Los documentos que importas permanecen en tu dispositivo. Los modos de escaneo de identificaciones y tarjetas de seguro están deshabilitados.

## Suscripciones y cancelación
La prueba de 14 días está disponible una vez por persona. El precio actual de Pro en México es MXN $79 al mes o MXN $699 al año, IVA incluido. Se renueva automáticamente por el período elegido. Te avisaremos 5 días antes de cada cobro. Cancela cuando quieras en Ajustes. Conservarás Pro hasta el fin del período pagado; no se harán más cargos. Puedes volver a suscribirte cuando quieras.
Precio Pro aprobado: MXN 79 al mes o MXN 699 al año. Las compras móviles están deshabilitadas hasta integrar StoreKit/Google Play Billing y avisos de renovación. Stripe solo se utiliza para compras web.
Puedes cancelar en cualquier momento. Las compras hechas en App Store o Google Play se reembolsan según sus políticas. Atenderemos cualquier reclamación conforme a la Ley Federal de Protección al Consumidor.

## Retención
'''+es_ret+'''

## Privacidad y derechos
Consulta el Aviso de Privacidad y la Consumer Health Data Privacy Policy disponibles en Inicio y Ajustes > Privacidad. La lectura del aviso no sustituye el consentimiento expreso para datos sensibles. Puedes retirar el consentimiento y solicitar eliminar tu cuenta en Ajustes > Privacidad.

---

# AURICRX MEDCOACH — PRIVACY POLICY

# Aviso de Privacidad Integral y Política de Datos de Salud del Consumidor

Versión: 2026-11-02

**Responsable:** [Auricrx LTD], [Mexico], [Auricrx.ltd@gmail.com].
TODO(OWNER-DECISION): Razón social, domicilio completo, teléfono y correo de privacidad reales pendientes. Estos datos deben confirmarse antes de publicar.

**Datos:** nombre, correo, teléfono, país, idioma, identificador Firebase, estado de suscripción e identificadores de elegibilidad de prueba. Datos sensibles: medicamentos, padecimientos, síntomas, perfil de ayuno, métricas de salud, adherencia y conversaciones con IA. También registros técnicos y reportes de fallos. No recibimos números completos de tarjeta.

**Finalidades necesarias:** autenticación, recordatorios, almacenamiento del perfil, información general de salud solicitada, facturación, seguridad, soporte y cumplimiento legal. El tratamiento de salud requiere consentimiento expreso separado. No usamos datos de salud para publicidad, comercialización, venta ni entrenamiento de modelos con fines ajenos al servicio. No hay finalidades publicitarias secundarias.

**Ubicación:** solo al solicitar una búsqueda de farmacias o laboratorios, en primer plano. Se transmite al proveedor de búsqueda para responder, no se almacena en la app ni se utiliza para seguimiento o avisos por proximidad. Las notificaciones de medicamentos se basan en horarios elegidos por ti.

**Almacenamiento:** Tus medicamentos y tu perfil de salud se guardan en nuestros servidores (Neon, EE.UU.) para que funcione la app. Los documentos importados permanecen en el dispositivo; no se deben importar identificaciones ni tarjetas de seguro.

**Encargados y transferencias:** OpenAI (EE.UU., respuestas de IA); Google/Firebase (EE.UU., autenticación y búsqueda Places); Neon (EE.UU., base de datos); Render (EE.UU., alojamiento); Stripe (EE.UU., pagos web); Expo (EE.UU., entrega de notificaciones). TODO(OWNER-DECISION): Verificar regiones contratadas de Render, Google/Firebase, Stripe y Expo antes de publicar. Las transferencias se realizan conforme al artículo 36 de la LFPDPPP y los acuerdos aplicables con los encargados, solo para operar el servicio. No vendemos ni compartimos tus datos de salud con fines de publicidad o comercialización, incluidos conjuntos agregados o desidentificados.

**Opciones, revocación y ARCO:** limita el uso retirando el consentimiento en Ajustes > Privacidad o desactivando permisos de ubicación/notificaciones. Puedes solicitar acceso, rectificación, cancelación u oposición en [Auricrx.ltd@gmail.com] (TODO(OWNER-DECISION): confirmar correo de privacidad). Indica el derecho que deseas ejercer, los datos involucrados y un medio de respuesta. Verificaremos tu identidad por la cuenta autenticada; no envíes copias completas de identificaciones por correo. Responderemos conforme a los plazos legales aplicables. Retirar el consentimiento bloquea las funciones de salud; puedes eliminar cuenta y datos en Ajustes > Privacidad o mediante la página pública /account-deletion.

**Retención:** '''+es_ret+'''

**Seguridad:** controles de acceso y cifrado en tránsito; ningún sistema es infalible. Protege tu dispositivo y credenciales.

**Personas menores:** Debes tener 18 años o más para usar AuricRX MedCoach.

**Cambios:** publicamos la nueva versión en esta página y notificamos cambios relevantes en la app. Solicitamos nuevo consentimiento antes de ampliar finalidades de datos sensibles; continuar usando la app no constituye ese consentimiento.
''' if es else '''# AURICRX MEDCOACH — TERMS OF SERVICE

Last updated: November 2, 2026

## Operator
[AuricRx LTD], [Queretaro, Mexico], [Auricrx.ltd@gmail.com].
TODO(OWNER-DECISION): Confirm the real legal entity, full address, phone and privacy email. Current values are retained pending confirmation.

## Eligibility and account
You must be 18 or older to use AuricRX MedCoach. Protect your credentials. Accept these terms expressly when creating an account.

## Health information
AuricRX provides reminders and general AI health information. It is not a doctor or medical care service. It does not diagnose or instruct you to start, stop or change medicines or doses. Consult a doctor or pharmacist. In an emergency call 911 now. AI information may be inaccurate.

## Content and privacy
You retain ownership of your content. We process it only to provide and protect requested services. We don't sell or share your health data for advertising or marketing. This includes aggregated and de-identified datasets in every market.
Your medications and health profile are stored on our servers (Neon, USA) so the app works. Imported documents stay on your device. ID and insurance-card scanning modes are disabled.

## Subscriptions and cancellation
One 14-day trial per person. The current Mexico Pro price is MXN $79 per month or MXN $699 per year, VAT included. Renews automatically for the selected period. We'll remind you 5 days before each charge. Cancel anytime in Settings. You keep Pro until the end of the paid period. No more charges. You can resubscribe anytime.
Approved Pro pricing: MXN 79/month or MXN 699/year. Mobile purchases are disabled until StoreKit/Google Play Billing and renewal notices are integrated. Stripe is for web purchases only.
You can cancel anytime. App Store or Google Play purchases are refunded under their policies. We'll handle any complaint under the Federal Consumer Protection Law.

## Retention
'''+en_ret+'''

## Privacy and rights
Read the Privacy Notice and Consumer Health Data Privacy Policy from Home or Settings > Privacy. Reading a notice does not substitute for express health-data consent. Withdraw consent or delete your account in Settings > Privacy.

---

# AURICRX MEDCOACH — PRIVACY POLICY

# Full Privacy Notice and Consumer Health Data Privacy Policy

Version: 2026-11-02

**Controller:** [AuricRx LTD], [Queretaro, Mexico], [Auricrx.ltd@gmail.com].
TODO(OWNER-DECISION): Confirm real legal entity, full address, phone and privacy email before publication.

**Data:** name, email, phone, country, language, Firebase identifier, subscription status and trial-eligibility identifiers. Sensitive health data includes medications, conditions, symptoms, fasting profile, health metrics, adherence and AI conversations. We also process technical logs and crash reports. We do not receive full payment card numbers.

**Required purposes:** authentication, reminders, profile storage, requested general health information, billing, security, support and legal obligations. Health processing requires separate express consent. We do not use health data for advertising, marketing, sale or model training unrelated to providing the service. There are no secondary advertising purposes.

**Location:** only when you request a foreground pharmacy or laboratory search. Coordinates are sent to the search provider to answer your request; they are not stored in the app or used for tracking or proximity alerts. Medication notifications use schedules you choose.

**Storage:** Your medications and health profile are stored on our servers (Neon, USA) so the app works. Imported documents remain on your device; do not import IDs or insurance cards.

**Service providers and transfers:** OpenAI (USA, AI responses); Google/Firebase (USA, authentication and Places search); Neon (USA, database); Render (USA, backend hosting); Stripe (USA, web payments); Expo (USA, notification delivery). TODO(OWNER-DECISION): Verify contracted processing regions for Render, Google/Firebase, Stripe and Expo before publication. Transfers follow LFPDPPP article 36 and applicable processor agreements and are only for operating the app. We don't sell or share your health data for advertising or marketing, including aggregated or de-identified datasets.

**Choices, withdrawal and rights:** limit use by withdrawing health consent in Settings > Privacy or disabling location/notification permissions. Request access, correction, deletion or opposition at [Auricrx.ltd@gmail.com] (TODO(OWNER-DECISION): confirm privacy email). Describe the right, affected data and reply contact. We verify identity through your authenticated account; do not email full copies of IDs. We respond within applicable statutory deadlines. Withdrawal blocks health features. Delete your account and data in Settings > Privacy or through the public /account-deletion page. These choices also apply to US consumers.

**Retention:** '''+en_ret+'''

**Security:** access controls and encryption in transit; no system is infallible. Protect your device and credentials.

**Age:** You must be 18 or older to use AuricRX MedCoach.

**Changes:** we publish revised versions here and announce material changes in the app. Expanded sensitive-data purposes require renewed consent; continued use is not consent.
'''
 Path('src/legal/TermsOfService-'+lang+'.md').write_text(terms,encoding='utf-8')
 Path('docs/privacy-notice-'+lang+'.md').write_text(terms.split('# AURICRX MEDCOACH — PRIVACY POLICY')[1],encoding='utf-8')
 # Same exact retention promise in expiry modal.
 p=Path('src/components/SubscriptionExpiredModal.tsx');s=p.read_text(encoding='utf-8');pat=r"("+lang+r": \{\s*title: '[^']*',\s*message: )'[^']*'";s=re.sub(pat,lambda m:m[1]+json.dumps(es_ret if es else en_ret,ensure_ascii=False),s);p.write_text(s,encoding='utf-8')
# Until reviewed translations exist, other languages use the revised English legal document.
p=Path('src/services/legalService.ts');s=p.read_text();s=re.sub(r'(pt|fr|de|zh): legalTexts\.terms[A-Z]+',r'\1: legalTexts.termsEN',s);p.write_text(s)
p=Path('src/legal/consentCheckboxText.json');d=json.loads(p.read_text(encoding='utf-8'));d['en']['health']='I consent to AuricRX collecting my health data (medications, conditions, symptoms, fasting profile) to provide reminders and general information. We share it only with service providers that run the app (OpenAI, Google/Firebase, Neon, Render, Stripe). We never sell it. You can withdraw consent and delete your data in Settings.';p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
# Explicit policy entry inside the existing privacy screen, already reachable from home/settings/signup.
p=Path('src/components/ConsentHost.tsx');s=p.read_text(encoding='utf-8').replace('        <ConsentChoices','        <Button title={es ? "Aviso de Privacidad / Política de Datos de Salud" : "Privacy Notice / Consumer Health Data Privacy Policy"} onPress={async () => setDocument(await loadPrivacyText(language))} />\n        <ConsentChoices');p.write_text(s,encoding='utf-8')
p=Path('App.js');s=p.read_text(encoding='utf-8').replace("{lang === 'es' ? 'Privacidad' : 'Privacy'}</Text></TouchableOpacity>","{lang === 'es' ? 'Aviso de Privacidad / Datos de Salud' : 'Privacy Notice / Consumer Health Data Privacy Policy'}</Text></TouchableOpacity>");p.write_text(s,encoding='utf-8')
# Public documents served without auth; deployment/publication still requires owner details.
p=Path('server/index.js');s=p.read_text(encoding='utf-8');anchor="app.get('/health',"
pos=s.index(anchor);s=s[:pos]+'''app.get('/privacy-notice/:language', (req, res) => {
  const language = req.params.language === 'es' ? 'es' : 'en';
  res.type('text/plain; charset=utf-8').sendFile(require('path').join(__dirname, '../docs/privacy-notice-' + language + '.md'));
});

'''+s[pos:];p.write_text(s,encoding='utf-8')
# Pause proxy itself, not just one client.
p=Path('sanpablo-proxy/server.js');s=p.read_text(encoding='utf-8');s=s.replace("app.get('/api/mx/sanpablo/search', async (req, res) => {", "app.get('/api/mx/sanpablo/search', async (req, res) => {\n  // Resume only after written permission or an official feed.\n  return res.status(503).json({ error: 'price_lookup_paused', items: [] });");p.write_text(s,encoding='utf-8')
