from pathlib import Path
import re,json

def edit(n,f):
 p=Path(n);s=p.read_text(encoding='utf-8');p.write_text(f(s),encoding='utf-8')
prompt="You are a general health-information assistant, not a doctor. Do not diagnose, name likely conditions, or tell users to start, stop or change medicines or doses. Encourage consulting a licensed professional. If emergency signs appear, tell the user to call 911. Answer in the user's language. Use only information actually provided in the conversation."
def server(s):
 s=re.sub(r"content: \[\s*'You are a \*\*personal health assistant\*\*\.'.*?\]\.join\(' '\)",lambda m:'content: '+json.dumps(prompt),s,flags=re.S)
 s=re.sub(r'// Deterministic pseudo-price generator.*?\n}\n','',s,flags=re.S)
 s=re.sub(r"if \(!apiKey\) \{\s*console.warn\('.*?returning mock data.*?\n  }", "if (!apiKey) { throw new Error('places_unavailable');\n  }",s,count=1,flags=re.S)
 s=s.replace("app.post('/api/stripe/create-checkout', async (req, res) => {", "app.post('/api/stripe/create-checkout', async (req, res) => {\n  // Native purchases require StoreKit/Play Billing; disabled until integration is ready.\n  if (req.body?.platform !== 'web') return res.status(409).json({ ok: false, error: 'store_billing_required' });\n  // TODO(OWNER-DECISION): Confirm Pro MXN 50 versus business-plan MXN 79; retain current prices.")
 s=s.replace('// Continue with database update even if Stripe fails',"return res.status(502).json({ ok: false, error: 'billing_provider_failed' });")
 # Coordinates must not become server cache keys or logged telemetry.
 s=s.replace('if (useCache)', 'if (false)')
 s='\n'.join(l for l in s.split('\n') if not (('console.' in l) and any(t in l for t in ['{ lat, lon','req.query','req.originalUrl','req.url'])))
 return s
edit('server/index.js',server)
edit('src/services/aiHealthService.ts',lambda s: re.sub(r"management: '[^']*'",'management: "Possible interaction. Don\'t change or stop any medicine without talking to your doctor or pharmacist. / Posible interacción. No cambies ni suspendas ningún medicamento sin hablar con tu médico o farmacéutico."',s))
# Show terms before any web purchase; do not launch a checkout automatically.
def checkout(s):
 s=s.replace("import AsyncStorage", "import { useTranslation } from 'react-i18next';\nimport AsyncStorage")
 s=s.replace('  const [loading,', "  const { i18n } = useTranslation();\n  const es = i18n.language.startsWith('es');\n  // TODO(OWNER-DECISION): Confirm MXN 50 vs 79. Native billing integration is pending.\n  const [loading,")
 s=s.replace('    try {\n      console.log', "    if (Platform.OS !== 'web') return;\n    try {\n      console.log",1)
 s=s.replace('JSON.stringify({ country })','JSON.stringify({ country, platform: Platform.OS })')
 s=re.sub(r'  useEffect\(\(\) => \{.*?\}, \[visible, openCheckoutInBrowser\]\);','',s,flags=re.S)
 s=s.replace('              Upgrade to Pro',"              {es ? 'Mejorar a Pro' : 'Upgrade to Pro'}")
 s=s.replace('          {/* Content */}', '''          <DynamicText type="primary" style={{ padding: 20 }}>
            {es ? 'Pro: MXN $50 al mes, IVA incluido. Se renueva automáticamente cada mes. Te avisaremos 5 días antes de cada cobro. Cancela cuando quieras en Ajustes.' : "Pro: MXN $50 per month, VAT included. Renews automatically each month. We'll remind you 5 days before each charge. Cancel anytime in Settings."}
          </DynamicText>
          {Platform.OS !== 'web' ? <DynamicText type="secondary" style={{ padding: 20 }}>{es ? 'Las compras móviles están temporalmente deshabilitadas mientras integramos la facturación de la tienda.' : 'Mobile purchases are temporarily unavailable while store billing is integrated.'}</DynamicText> : <TouchableOpacity onPress={openCheckoutInBrowser} disabled={loading}><DynamicText type="primary" style={{ padding: 20 }}>{es ? 'Continuar al pago' : 'Continue to checkout'}</DynamicText></TouchableOpacity>}
          {/* Content */}''')
 return s
edit('src/components/StripeCheckoutModal.js',checkout)
app=json.loads(Path('app.json').read_text());app['expo']['android']['blockedPermissions']=['android.permission.SYSTEM_ALERT_WINDOW','android.permission.DUMP','android.permission.READ_EXTERNAL_STORAGE','android.permission.WRITE_EXTERNAL_STORAGE'];Path('app.json').write_text(json.dumps(app,indent=2)+'\n')
eas=json.loads(Path('eas.json').read_text());eas['build']['production']['developmentClient']=False; eas['build']['production']['android']={'buildType':'app-bundle'};Path('eas.json').write_text(json.dumps(eas,indent=2)+'\n')
# Apply restrictions in committed native manifest too (EAS may not prebuild existing android).
p=Path('android/app/src/main/AndroidManifest.xml')
if p.exists():
 s=p.read_text();
 if 'xmlns:tools=' not in s:s=s.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ',1)
 for perm in app['expo']['android']['blockedPermissions']:
  s=re.sub(r'\s*<uses-permission\b[^>]*android:name="'+re.escape(perm)+r'"[^>]*/>', '',s)
  s=s.replace('<application',f'<uses-permission android:name="{perm}" tools:node="remove" />\n  <application',1)
 p.write_text(s)
# Disable all proximity reminders and passive location collection.
def smart(s):
 s=re.sub(r'      // Start location tracking.*?      // Start weather monitoring', '      // Proximity tracking disabled; location is only requested for foreground search.\n      // Start weather monitoring',s,flags=re.S)
 s=re.sub(r'      // Request location permissions.*?      // Request notification permissions','      // Request notification permissions',s,flags=re.S)
 s=re.sub(r'  private async startLocationTracking\(\) \{.*?\n  private async watchLocation\(\) \{.*?\n  private async checkLocationReminders\(\) \{.*?(?=\n  private )','  private async startLocationTracking() {}\n  private async watchLocation() {}\n  private async checkLocationReminders() {}\n',s,flags=re.S)
 s=re.sub(r"  async addLocationReminder\(reminder: Omit<LocationReminder, 'id'>\) \{.*?\n  }", "  async addLocationReminder(reminder: Omit<LocationReminder, 'id'>): Promise<LocationReminder> {\n    throw new Error('Proximity reminders are unavailable. / Los recordatorios por proximidad no están disponibles.');\n  }",s,flags=re.S)
 return s
edit('src/services/smartNotifications.ts',smart)
# Disable sensitive document categories without deleting existing user documents.
edit('src/screens/MedicalDocumentsScreen.tsx',lambda s:s.replace('Object.keys(DOCUMENT_CATEGORIES).map(category =>',"Object.keys(DOCUMENT_CATEGORIES).filter(category => !['photo_id', 'birth_certificate', 'insurance'].includes(category)).map(category =>"))
edit('src/components/DocumentsCard.tsx',lambda s:re.sub(r'\s*<TabsTrigger value="(?:official_id|insurance_id)".*?</TabsTrigger>','',re.sub(r'\s*<TabsContent value="(?:official_id|insurance_id)".*?</TabsContent>','',s)))
edit('src/lib/api.ts',lambda s:s.replace('  const url = new URL("/api/sanpablo/search", API);', '''  // Paused until written permission or an official feed is available.
  return { query: q, page, pageSize, totalResults: 0, items: [] };
  const url = new URL("/api/sanpablo/search", API);'''))
# Neutral fasting examples; no schedule for sensitive profiles.
edit('src/screens/AIHealthScreen.tsx',lambda s:s.replace('    // Generate personalized message', '''    const restricted = !!(profile?.diabetes || profile?.pregnancy || profile?.breastfeeding || profile?.eatingDisorders || profile?.eating_disorders);
    if (restricted) return { compatible: false, warnings: [], suggestedHours: 0, riskLevel: 'critical', message: t('fastingProfileRestricted') };
    // Generate personalized message''').replace('      message\n    };',"      message: t('fastingAppearsCompatible')\n    };").replace('<View style={dynamicStyles.fastingTimeRecommendation}>','{fastingAnalysis.suggestedHours > 0 && <View style={dynamicStyles.fastingTimeRecommendation}>').replace('                </View>\n\n                <DynamicText type="card" style={dynamicStyles.fastingMessage}>','                </View>}\n\n                <DynamicText type="card" style={dynamicStyles.fastingMessage}>').replace('${fastingAnalysis.suggestedHours}:${24-fastingAnalysis.suggestedHours}',"${fastingAnalysis.suggestedHours > 0 ? fastingAnalysis.suggestedHours + ':' + (24-fastingAnalysis.suggestedHours) : fastingAnalysis.message}"))
for lang in ['es','en']:
 p=Path('src/i18n/'+lang+'.json');d=json.loads(p.read_text(encoding='utf-8'));es=lang=='es'
 def walk(obj):
  for k,v in obj.items():
   if isinstance(v,dict):walk(v)
   elif k in ['recommendedFastingWindow','fastingAppearsCompatible']:obj[k]='Ventana de ayuno de ejemplo. Consulta a tu médico antes de ayunar.' if es else 'Example fasting window. Check with your doctor before fasting.'
   elif k=='cancelMembershipConfirm':obj[k]='Cancelar membresía. Conservarás Pro hasta el {{date}}. No se harán más cargos. Puedes volver a suscribirte cuando quieras.' if es else 'Cancel membership. You keep Pro until {{date}}. No more charges. You can resubscribe anytime.'
   elif k=='sanpabloSection':obj[k]='San Pablo (consulta de precios pausada)' if es else 'San Pablo (price lookup paused)'
 walk(d);d['ai']['fastingProfileRestricted']='Por tu perfil, habla con tu médico antes de cualquier ayuno.' if es else 'Because of your profile, talk to your doctor before any fasting.'
 d['ai']['referencePriceNotice']='Precio de referencia consultado el {{date}}. Puede variar en tienda.' if es else 'Reference price checked on {{date}}. May vary in store.'
 p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
edit('App.js',lambda s:s.replace("t('settings.cancelMembershipConfirm')", "t('settings.cancelMembershipConfirm', { date: subscriptionStatus?.currentPeriodEnd ? new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString() : (lang === 'es' ? 'fin del período pagado' : 'end of the paid period') })").replace('Are you sure you want to cancel your membership? This action cannot be undone.','Cancel membership. You keep Pro until the end of the paid period. No more charges. You can resubscribe anytime.'))
