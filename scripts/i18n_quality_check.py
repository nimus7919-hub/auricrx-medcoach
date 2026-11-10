#!/usr/bin/env python3
"""Strict i18n quality check: python3 i18n_quality_check.py src/i18n  -> exits 1 on failure.
Flags per locale: missing keys, extra-missing placeholders, mojibake, values identical to English,
values containing English stopwords/phrases (half-translated strings), and for zh any run of 2+ Latin words."""
import json,re,sys,os
D=sys.argv[1] if len(sys.argv)>1 else 'src/i18n'
STOP=set("the to your you and of for in is are this that with please not be can on from has have will was an or by at it as if we our may need needs before after into than then failed unable could should would must make sure grant allow".split())
ALLOW=re.compile(r'(AuricRX|WhatsApp|Google|Gmail|Play|Health Connect|Apple|iCloud|NCCIH|MedlinePlus|DailyMed|COFEPRIS|FDA|PROFECO|SAT|RFC|CURP|IVA|https?://\S+|\S+@\S+|\{\{[^}]+\}\}|\[[^\]]+\]|%\w)')
def flat(d,p=''):
    o={}
    if isinstance(d,dict):
        for k,v in d.items(): o.update(flat(v,p+k+'.'))
    else: o[p[:-1]]=d
    return o
en=flat(json.load(open(os.path.join(D,'en.json'))))
fail=False
for l in ['es','fr','de','pt','zh']:
    f=os.path.join(D,l+'.json')
    if not os.path.exists(f): continue
    t=flat(json.load(open(f)))
    miss=[k for k in en if k not in t]
    same=[];eng=[];moj=[];ph=[]
    for k,ev in en.items():
        tv=t.get(k)
        if not isinstance(ev,str) or not isinstance(tv,str): continue
        if '\ufffd' in tv or re.search('Ã.|Â.|â€',tv): moj.append(k)
        if set(re.findall(r'\{\{[^}]+\}\}',ev))!=set(re.findall(r'\{\{[^}]+\}\}',tv)): ph.append(k)
        clean=ALLOW.sub(' ',tv)
        words=re.findall(r"[A-Za-z']+",clean)
        if tv==ev and len(words)>=2: same.append(k); continue
        if l=='zh':
            if re.search(r"[A-Za-z]{2,}[\s,.]+[A-Za-z]{2,}",clean): eng.append(k)
        else:
            sw=[w for w in words if w.lower() in STOP]
            if len(sw)>=2: eng.append(k)
    bad=len(miss)+len(same)+len(eng)+len(moj)+len(ph)
    fail|=bad>0
    print(f"{l}: missing={len(miss)} identical={len(same)} half_english={len(eng)} mojibake={len(moj)} placeholder={len(ph)}")
    for name,lst in [('missing',miss),('identical',same),('half_english',eng),('mojibake',moj),('placeholder',ph)]:
        if lst: print(f"   {name} e.g.: {lst[:5]}")
    json.dump({'missing':miss,'identical':same,'half_english':eng,'mojibake':moj,'placeholder':ph},open(f'i18n-issues-{l}.json','w'),indent=1,ensure_ascii=False)
sys.exit(1 if fail else 0)
