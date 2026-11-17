#!/usr/bin/env python3
"""
Batch 3: Massive translation update for remaining keys
"""

import json
from pathlib import Path

def set_nested_key(data, key_path, value):
    """Set a nested key in a dictionary"""
    keys = key_path.split('.')
    current = data
    for k in keys[:-1]:
        if k not in current:
            current[k] = {}
        current = current[k]
    current[keys[-1]] = value

def apply_translations(file_path, translations, desc):
    """Apply translations to a JSON file"""
    print(f"\\nUpdating {file_path.name} - {desc}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updated = 0
    for key, value in translations.items():
        try:
            set_nested_key(data, key, value)
            updated += 1
            if updated <= 10:
                print(f"  {key}: {value[:40]}...")
        except Exception as e:
            print(f"  Error updating {key}: {e}")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  Updated {updated}/{len(translations)} keys")
    return updated

# Country labels for ZH
zh_country_labels = {
    "countryLabels.MR": "🇲🇷 毛里塔尼亚",
    "countryLabels.CI": "🇨🇮 科特迪瓦",
    "countryLabels.BF": "🇧🇫 布基纳法索",
    "countryLabels.SL": "🇸🇱 塞拉利昂",
    "countryLabels.CF": "🇨🇫 中非共和国",
    "countryLabels.CV": "🇨🇻 佛得角",
    "countryLabels.ST": "🇸🇹 圣多美和普林西比",
    "countryLabels.GQ": "🇬🇶 赤道几内亚",
    "countryLabels.CG": "🇨🇬 刚果（布）",
    "countryLabels.CD": "🇨🇩 刚果（金）",
    "countryLabels.GW": "🇬🇼 几内亚比绍",
    "countryLabels.IO": "🇮🇴 英属印度洋领地",
    "countryLabels.SC": "🇸🇨 塞舌尔",
    "countryLabels.MZ": "🇲🇿 莫桑比克",
    "countryLabels.MG": "🇲🇬 马达加斯加",
    "countryLabels.SH": "🇸🇭 圣赫勒拿",
    "countryLabels.FO": "🇫🇴 法罗群岛",
    "countryLabels.LU": "🇱🇺 卢森堡",
    "countryLabels.SM": "🇸🇲 圣马力诺",
    "countryLabels.ME": "🇲🇪 黑山",
    "countryLabels.BA": "🇧🇦 波斯尼亚和黑塞哥维那",
    "countryLabels.MK": "🇲🇰 北马其顿",
    "countryLabels.LI": "🇱🇮 列支敦士登",
    "countryLabels.FK": "🇫🇰 福克兰群岛",
    "countryLabels.SV": "🇸🇻 萨尔瓦多",
    "countryLabels.CR": "🇨🇷 哥斯达黎加",
    "countryLabels.PM": "🇵🇲 圣皮埃尔和密克隆",
    "countryLabels.GP": "🇬🇵 瓜德罗普",
    "countryLabels.GF": "🇬🇫 法属圭亚那",
    "countryLabels.MQ": "🇲🇶 马提尼克",
    "countryLabels.TL": "🇹🇱 东帝汶",
    "countryLabels.AQ": "🇦🇶 南极洲",
    "countryLabels.PG": "🇵🇬 巴布亚新几内亚",
    "countryLabels.SB": "🇸🇧 所罗门群岛",
    "countryLabels.WF": "🇼🇫 瓦利斯和富图纳",
    "countryLabels.CK": "🇨🇰 库克群岛",
    "countryLabels.AS": "🇦🇸 美属萨摩亚",
    "countryLabels.NC": "🇳🇨 新喀里多尼亚",
    "countryLabels.PF": "🇵🇫 法属波利尼西亚",
    "countryLabels.FM": "🇫🇲 密克罗尼西亚联邦",
    "countryLabels.MH": "🇲🇭 马绍尔群岛",
    "countryLabels.KP": "🇰🇵 朝鲜",
    "countryLabels.BD": "🇧🇩 孟加拉国",
    "countryLabels.TJ": "🇹🇯 塔吉克斯坦",
    "countryLabels.TM": "🇹🇲 土库曼斯坦",
    "countryLabels.AZ": "🇦🇿 阿塞拜疆",
    "countryLabels.KG": "🇰🇬 吉尔吉斯斯坦",
    "countryLabels.UZ": "🇺🇿 乌兹别克斯坦",
}

# Country labels for PT
pt_country_labels = {
    "countryLabels.MR": "🇲🇷 Mauritânia",
    "countryLabels.CI": "🇨🇮 Costa do Marfim",
    "countryLabels.BF": "🇧🇫 Burkina Faso",
    "countryLabels.SL": "🇸🇱 Serra Leoa",
    "countryLabels.CF": "🇨🇫 República Centro-Africana",
    "countryLabels.CV": "🇨🇻 Cabo Verde",
    "countryLabels.ST": "🇸🇹 São Tomé e Príncipe",
    "countryLabels.GQ": "🇬🇶 Guiné Equatorial",
    "countryLabels.CG": "🇨🇬 Congo (Brazzaville)",
    "countryLabels.CD": "🇨🇩 Congo (Kinshasa)",
    "countryLabels.GW": "🇬🇼 Guiné-Bissau",
    "countryLabels.IO": "🇮🇴 Território Britânico do Oceano Índico",
    "countryLabels.SC": "🇸🇨 Seychelles",
    "countryLabels.MZ": "🇲🇿 Moçambique",
    "countryLabels.MG": "🇲🇬 Madagascar",
    "countryLabels.SH": "🇸🇭 Santa Helena",
    "countryLabels.FO": "🇫🇴 Ilhas Faroe",
    "countryLabels.LU": "🇱🇺 Luxemburgo",
    "countryLabels.SM": "🇸🇲 San Marino",
    "countryLabels.ME": "🇲🇪 Montenegro",
    "countryLabels.BA": "🇧🇦 Bósnia e Herzegovina",
    "countryLabels.MK": "🇲🇰 Macedônia do Norte",
    "countryLabels.LI": "🇱🇮 Liechtenstein",
    "countryLabels.FK": "🇫🇰 Ilhas Malvinas",
    "countryLabels.SV": "🇸🇻 El Salvador",
    "countryLabels.CR": "🇨🇷 Costa Rica",
    "countryLabels.PM": "🇵🇲 São Pedro e Miquelon",
    "countryLabels.GP": "🇬🇵 Guadalupe",
    "countryLabels.GF": "🇬🇫 Guiana Francesa",
    "countryLabels.MQ": "🇲🇶 Martinica",
    "countryLabels.TL": "🇹🇱 Timor-Leste",
    "countryLabels.AQ": "🇦🇶 Antártida",
    "countryLabels.PG": "🇵🇬 Papua-Nova Guiné",
    "countryLabels.SB": "🇸🇧 Ilhas Salomão",
    "countryLabels.WF": "🇼🇫 Wallis e Futuna",
    "countryLabels.CK": "🇨🇰 Ilhas Cook",
    "countryLabels.AS": "🇦🇸 Samoa Americana",
    "countryLabels.NC": "🇳🇨 Nova Caledônia",
    "countryLabels.PF": "🇵🇫 Polinésia Francesa",
    "countryLabels.FM": "🇫🇲 Micronésia",
    "countryLabels.MH": "🇲🇭 Ilhas Marshall",
    "countryLabels.KP": "🇰🇵 Coreia do Norte",
    "countryLabels.BD": "🇧🇩 Bangladesh",
    "countryLabels.TJ": "🇹🇯 Tajiquistão",
    "countryLabels.TM": "🇹🇲 Turcomenistão",
    "countryLabels.AZ": "🇦🇿 Azerbaijão",
    "countryLabels.KG": "🇰🇬 Quirguistão",
    "countryLabels.UZ": "🇺🇿 Uzbequistão",
}

# Family documents for ZH
zh_family_docs = {
    "familyDocuments.title": "家庭文件",
    "familyDocuments.description": "管理家庭成员的医疗文件",
    "familyDocuments.familyMembers": "家庭成员",
    "familyDocuments.noMembers": "未添加家庭成员",
    "familyDocuments.memberFolderDescription": "为此家庭成员管理文件",
    "familyDocuments.noDocuments": "未添加文件",
    "familyDocuments.nameRequired": "姓名为必填项",
    "familyDocuments.photoPermissionRequired": "需要照片权限",
    "familyDocuments.documentAdded": "文件已添加",
    "familyDocuments.deleteDocument": "删除文件",
    "familyDocuments.deleteConfirm": "您确定要删除此文件吗？",
    "familyDocuments.exportSuccess": "导出成功",
    "familyDocuments.exportDetails": "文件已导出",
    "familyDocuments.premiumRequired": "需要高级版",
    "familyDocuments.addRequiresPremium": "添加需要高级版订阅",
    "familyDocuments.readOnlyAccess": "只读访问",
}

# Family documents for PT
pt_family_docs = {
    "familyDocuments.title": "Documentos da Família",
    "familyDocuments.description": "Gerenciar documentos médicos dos membros da família",
    "familyDocuments.familyMembers": "Membros da Família",
    "familyDocuments.noMembers": "Nenhum membro da família adicionado",
    "familyDocuments.memberFolderDescription": "Gerenciar documentos para este membro da família",
    "familyDocuments.noDocuments": "Nenhum documento adicionado",
    "familyDocuments.nameRequired": "Nome é obrigatório",
    "familyDocuments.photoPermissionRequired": "Permissão de foto necessária",
    "familyDocuments.documentAdded": "Documento adicionado",
    "familyDocuments.deleteDocument": "Excluir documento",
    "familyDocuments.deleteConfirm": "Tem certeza de que deseja excluir este documento?",
    "familyDocuments.exportSuccess": "Exportação bem-sucedida",
    "familyDocuments.exportDetails": "Documento exportado",
    "familyDocuments.premiumRequired": "Premium necessário",
    "familyDocuments.addRequiresPremium": "Adicionar requer assinatura premium",
    "familyDocuments.readOnlyAccess": "Acesso somente leitura",
}

# Document PDF for both
zh_doc_pdf = {
    "documentPdf.brand": "AuricRX",  # Keep as-is (brand name)
}

pt_doc_pdf = {
    "documentPdf.brand": "AuricRX",  # Keep as-is (brand name)
}

def main():
    repo_root = Path(__file__).parent.parent
    zh_file = repo_root / 'src/i18n/zh.json'
    pt_file = repo_root / 'src/i18n/pt.json'
    
    print("Applying batch 3 - massive update...")
    print("=" * 60)
    
    # Combine all ZH translations
    zh_all = {}
    zh_all.update(zh_country_labels)
    zh_all.update(zh_family_docs)
    zh_all.update(zh_doc_pdf)
    
    # Combine all PT translations
    pt_all = {}
    pt_all.update(pt_country_labels)
    pt_all.update(pt_family_docs)
    pt_all.update(pt_doc_pdf)
    
    zh_updated = apply_translations(zh_file, zh_all, "ZH countries + family docs")
    pt_updated = apply_translations(pt_file, pt_all, "PT countries + family docs")
    
    print("\\n" + "=" * 60)
    print(f"Total: ZH={zh_updated}, PT={pt_updated}")

if __name__ == '__main__':
    main()
