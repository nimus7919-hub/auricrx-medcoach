import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
changed = []

def save(path, text):
    old = path.read_text(encoding='utf-8')
    if text != old:
        path.write_text(text, encoding='utf-8', newline='')
        changed.append(str(path.relative_to(ROOT)))

plans = {
    'en': ('MXN $79 per month', 'MXN $699 per year', 'VAT included. Renews automatically for the selected period. We’ll remind you 5 days before each charge. Cancel anytime in Settings.'),
    'es': ('MXN $79 al mes', 'MXN $699 al año', 'IVA incluido. Se renueva automáticamente por el período elegido. Te avisaremos 5 días antes de cada cobro. Cancela cuando quieras en Ajustes.'),
    'de': ('MXN $79 pro Monat', 'MXN $699 pro Jahr', 'Inklusive Mehrwertsteuer. Automatische Verlängerung für den gewählten Zeitraum. Erinnerung 5 Tage vor jeder Abbuchung. Jederzeit in den Einstellungen kündbar.'),
    'fr': ('MXN $79 par mois', 'MXN $699 par an', 'TVA incluse. Renouvellement automatique pour la période choisie. Rappel 5 jours avant chaque paiement. Annulation à tout moment dans les paramètres.'),
    'pt': ('MXN $79 por mês', 'MXN $699 por ano', 'IVA incluído. Renovação automática pelo período escolhido. Aviso 5 dias antes de cada cobrança. Cancele a qualquer momento em Configurações.'),
    'zh': ('每月 MXN $79', '每年 MXN $699', '含增值税。按所选周期自动续订。每次扣款前5天提醒。可随时在设置中取消。'),
}
intros = {
    'de': 'Ich bin Pawlmer, ein KI-Katzenassistent. Ich mache Gesundheitsinformationen verständlicher, bin aber kein Arzt.',
    'fr': 'Je suis Pawlmer, un chat assistant IA. Je rends les informations de santé plus accessibles, mais je ne suis pas médecin.',
    'pt': 'Sou Pawlmer, um gato assistente de IA. Torno as informações de saúde mais acessíveis, mas não sou médico.',
    'zh': '我是 Pawlmer，一个 AI 猫咪助手。我让健康信息更易懂，但我不是医生。',
}

# Rename identifiers and display names together, including source backups.
files = []
for directory, dirs, names in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in ('node_modules', '.git', '.expo', 'dist', 'build')]
    files.extend(Path(directory) / name for name in names)
for path in files:
    if path == Path(__file__).resolve():
        continue
    if '.env' in path.name or path.suffix not in ('.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.html', '.txt', '.backup', '.py', '.cjs'):
        continue
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeError:
        continue
    text = text.replace('drPawlmer', 'pawlmer').replace('Dr. Pawlmer', 'Pawlmer').replace('Dr Pawlmer', 'Pawlmer')
    text = re.sub(r'Pawlmer\s*医生', 'Pawlmer', text)
    text = text.replace('doctor felino', 'gato asistente').replace('feline doctor', 'AI cat assistant')
    # Keep existing asset paths valid: add the renamed asset without deleting originals.
    if 'Pawlmer AI Widget.png' in text:
        for asset in (p for p in files if p.name == 'Dr. Pawlmer AI Widget.png'):
            target = asset.with_name('Pawlmer AI Widget.png')
            if not target.exists():
                target.write_bytes(asset.read_bytes())
    text = text.replace('MXN $50 per month, VAT included. Renews automatically each month.', 'MXN $79 per month or MXN $699 per year, VAT included. Renews automatically for the selected period.')
    text = text.replace('MXN $50 al mes, IVA incluido. Se renueva automáticamente cada mes.', 'MXN $79 al mes o MXN $699 al año, IVA incluido. Se renueva automáticamente por el período elegido.')
    text = re.sub(r'TODO\(OWNER-DECISION\): Confirm Pro MXN 50 versus business-plan MXN 79\.', 'Approved Pro pricing: MXN 79/month or MXN 699/year.', text)
    text = text.replace('TODO(OWNER-DECISION): Confirmar precio Pro MXN 50 frente a MXN 79 del plan.', 'Precio Pro aprobado: MXN 79 al mes o MXN 699 al año.')
    text = text.replace('TODO(OWNER-DECISION): Confirm MXN 50 vs 79.', 'Approved Pro: MXN 79/month or MXN 699/year.')
    text = text.replace('unitAmount = 5000; // 50.00 MXN for Mexico', 'unitAmount = 7900; // 79.00 MXN monthly for Mexico')
    save(path, text)

for lang, (month, year, disclosure) in plans.items():
    path = ROOT / f'src/i18n/{lang}.json'
    text = path.read_text(encoding='utf-8')
    data = json.loads(text)
    data['subscriptionPlans'] = {'month': month, 'year': year, 'disclosure': disclosure}
    if lang in intros:
        data['ai']['pawlmerIntro'] = intros[lang]
    save(path, json.dumps(data, ensure_ascii=False, indent=2) + '\n')

# Resolve only price decisions; retain unrelated owner decisions.
replacements = {
    '- [ ] TODO(OWNER-DECISION): Confirm Pro MXN 50 (current code) versus MXN 79 (business plan). Existing prices were retained.': '- [x] Owner approved Pro: MXN 79/month or MXN 699/year, VAT included.',
    'current MXN 50, VAT': 'MXN 79/month and MXN 699/year, VAT',
    'TODO(OWNER-DECISION): Confirm final Pro price before publishing. ': 'Approved Pro pricing: MXN 79/month or MXN 699/year. ',
    'Owner decisions: keep existing Pro price (MXN 50 versus plan MXN 79), production countries, and operator/contact values until confirmed.': 'Pro pricing approved: MXN 79/month or MXN 699/year. Production countries and operator/contact values remain pending confirmation.',
    'TODO(OWNER-DECISION): Pro price remains the existing code value (MXN 50); business plan says MXN 79. Item 13 is outside this run.': 'Owner approved Pro pricing: MXN 79/month or MXN 699/year, VAT included. Configure both store products before enabling mobile purchases.',
}
for path in (ROOT / 'docs').glob('*.md'):
    text = path.read_text(encoding='utf-8')
    for old, new in replacements.items():
        text = text.replace(old, new)
    save(path, text)

for lang in ('de', 'fr', 'pt', 'zh'):
    path = ROOT / f'src/legal/TermsOfService-{lang}.md'
    month, year, disclosure = plans[lang]
    text = path.read_text(encoding='utf-8')
    # Put approved pricing beside the subscription section.
    if f'Pro: {month}; {year}.' not in text:
        text = re.sub(r'(## 7[^\n]*\n)', lambda m: m[0] + f'\nPro: {month}; {year}. {disclosure}\n', text, count=1)
    save(path, text)

# Regenerate embedded terms from their source documents.
path = ROOT / 'src/legal/legalTexts.ts'
text = path.read_text(encoding='utf-8')
for lang in plans:
    source = ROOT / f'src/legal/TermsOfService-{lang}.md'
    pattern = r'export const terms' + lang.upper() + r' = "(?:\\.|[^"\\])*";'
    text = re.sub(pattern, lambda m: f'export const terms{lang.upper()} = {json.dumps(source.read_text(encoding="utf-8"), ensure_ascii=False)};', text)
save(path, text)
print('\n'.join(changed))
