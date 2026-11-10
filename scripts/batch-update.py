#!/usr/bin/env python3
"""
Batch update translations using JSON manipulation
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
        except Exception as e:
            print(f"  Error updating {key}: {e}")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"  Updated {updated}/{len(translations)} keys")
    return updated

# High-priority ZH UI translations
zh_ui = {
    "ui.requestingCameraPermission": "正在请求相机权限...",
    "ui.noAccessToCamera": "无法访问相机",
    "ui.grantPermission": "授予权限",
    "ui.documentsMobile": "文件（移动版）",
    "ui.scanCamera": "扫描（相机）",
    "ui.donTHaveAnAccount": "没有账户？",
    "ui.unitedStates": "美国",
    "ui.unitedKingdom": "英国",
    "ui.continueWithGoogle": "使用Google继续",
    "ui.continueWithApple": "使用Apple继续",
    "ui.goToSettings": "转到设置",
    "ui.accountDetails": "账户详情",
    "ui.themeSettings": "主题设置",
    "ui.languageSettings": "语言设置",
    "ui.signedInSuccessfully": "登录成功",
    "ui.areYouSureYouWantToSignOut": "您确定要退出登录吗？",
    "ui.invalidEmail": "电子邮件无效",
    "ui.passwordsDoNotMatch": "密码不匹配",
    "ui.confirmPassword": "确认密码",
}

# High-priority PT UI translations
pt_ui = {
    "ui.consentCanceled": "Consentimento cancelado",
    "ui.requestingCameraPermission": "Solicitando permissão da câmera...",
    "ui.noAccessToCamera": "Sem acesso à câmera",
    "ui.grantPermission": "Conceder permissão",
    "ui.documentsMobile": "Documentos (mobile)",
    "ui.scanCamera": "Digitalizar (câmera)",
    "ui.donTHaveAnAccount": "Não tem uma conta?",
    "ui.unitedStates": "Estados Unidos",
    "ui.unitedKingdom": "Reino Unido",
    "ui.continueWithGoogle": "Continuar com Google",
    "ui.continueWithApple": "Continuar com Apple",
    "ui.goToSettings": "Ir para configurações",
    "ui.accountDetails": "Detalhes da conta",
    "ui.themeSettings": "Configurações de tema",
    "ui.languageSettings": "Configurações de idioma",
    "ui.signedInSuccessfully": "Login bem-sucedido",
    "ui.areYouSureYouWantToSignOut": "Tem certeza de que deseja sair?",
    "ui.invalidEmail": "E-mail inválido",
    "ui.passwordsDoNotMatch": "As senhas não coincidem",
    "ui.confirmPassword": "Confirmar senha",
}

def main():
    repo_root = Path(__file__).parent.parent
    zh_file = repo_root / 'src/i18n/zh.json'
    pt_file = repo_root / 'src/i18n/pt.json'
    
    print("Applying batch updates...")
    print("=" * 60)
    
    zh_updated = apply_translations(zh_file, zh_ui, "ZH UI priority keys")
    pt_updated = apply_translations(pt_file, pt_ui, "PT UI priority keys")
    
    print("\\n" + "=" * 60)
    print(f"Total: ZH={zh_updated}, PT={pt_updated}")

if __name__ == '__main__':
    main()
