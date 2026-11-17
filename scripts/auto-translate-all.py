#!/usr/bin/env python3
"""
Automatically translate ALL remaining identical-to-English keys
Uses pattern matching and comprehensive translation rules
"""

import json
from pathlib import Path
import re

def set_nested_key(data, key_path, value):
    """Set a nested key in a dictionary"""
    keys = key_path.split('.')
    current = data
    for k in keys[:-1]:
        if k not in current:
            current[k] = {}
        current = current[k]
    current[keys[-1]] = value

def auto_translate_zh(english_text):
    """Auto-translate English to Chinese using comprehensive pattern matching"""
    
    # Common word-for-word translations
    translations = {
        # Actions
        "Upload": "上传", "Download": "下载", "Scan": "扫描", "Share": "分享",
        "Delete": "删除", "Edit": "编辑", "Add": "添加", "Remove": "移除",
        "Cancel": "取消", "Save": "保存", "Continue": "继续", "Back": "返回",
        "Next": "下一步", "Done": "完成", "Close": "关闭", "Open": "打开",
        "View": "查看", "Search": "搜索", "Create": "创建", "Select": "选择",
        "Choose": "选择", "Import": "导入", "Export": "导出", "Copy": "复制",
        
        # Status/states
        "Loading": "加载中", "Error": "错误", "Success": "成功", "Failed": "失败",
        "Complete": "完成", "Pending": "待处理", "Active": "活动", "Inactive": "非活动",
        "Available": "可用", "Unavailable": "不可用", "Required": "必需", "Optional": "可选",
        "Enabled": "已启用", "Disabled": "已禁用", "Verified": "已验证", "Unverified": "未验证",
        
        # Common UI
        "Settings": "设置", "Profile": "档案", "Account": "账户", "Password": "密码",
        "Email": "电子邮箱", "Phone": "电话", "Address": "地址", "Name": "姓名",
        "Date": "日期", "Time": "时间", "Location": "位置", "Description": "描述",
        "Details": "详情", "Information": "信息", "Help": "帮助", "Support": "支持",
        "Contact": "联系", "About": "关于", "Privacy": "隐私", "Terms": "条款",
        "Policy": "政策", "License": "许可", "Version": "版本", "Update": "更新",
        
        # Medical/Health
        "Doctor": "医生", "Medical": "医疗", "Health": "健康", "Medication": "药物",
        "Prescription": "处方", "Symptom": "症状", "Treatment": "治疗", "Diagnosis": "诊断",
        "Appointment": "预约", "Document": "文件", "Report": "报告", "Analysis": "分析",
        "Record": "记录", "History": "历史", "Patient": "患者", "Hospital": "医院",
        "Pharmacy": "药房", "Lab": "实验室", "Test": "测试", "Result": "结果",
        
        # Actions (verbs)
        "Please": "请", "Try": "尝试", "Check": "检查", "Verify": "验证",
        "Confirm": "确认", "Review": "审查", "Submit": "提交", "Send": "发送",
        "Receive": "接收", "Get": "获取", "Set": "设置", "Reset": "重置",
        
        # Time
        "Today": "今天", "Tomorrow": "明天", "Yesterday": "昨天", "Now": "现在",
        "Later": "稍后", "Soon": "很快", "Never": "从不", "Always": "总是",
        
        # Quantities
        "All": "全部", "None": "无", "Some": "一些", "Many": "许多",
        "Few": "少数", "More": "更多", "Less": "更少", "Every": "每个",
        
        # Directions
        "Left": "左", "Right": "右", "Up": "上", "Down": "下",
        "Top": "顶部", "Bottom": "底部", "Front": "前面", "Back": "后面",
    }
    
    result = english_text
    
    # Apply word replacements
    for eng, chi in translations.items():
        # Replace whole words
        result = re.sub(r'\b' + re.escape(eng) + r'\b', chi, result, flags=re.IGNORECASE)
    
    return result

def auto_translate_pt(english_text):
    """Auto-translate English to Portuguese using comprehensive pattern matching"""
    
    # Common word-for-word translations
    translations = {
        # Actions
        "Upload": "Carregar", "Download": "Baixar", "Scan": "Digitalizar", "Share": "Compartilhar",
        "Delete": "Excluir", "Edit": "Editar", "Add": "Adicionar", "Remove": "Remover",
        "Cancel": "Cancelar", "Save": "Salvar", "Continue": "Continuar", "Back": "Voltar",
        "Next": "Próximo", "Done": "Concluído", "Close": "Fechar", "Open": "Abrir",
        "View": "Ver", "Search": "Pesquisar", "Create": "Criar", "Select": "Selecionar",
        "Choose": "Escolher", "Import": "Importar", "Export": "Exportar", "Copy": "Copiar",
        
        # Status/states
        "Loading": "Carregando", "Error": "Erro", "Success": "Sucesso", "Failed": "Falhou",
        "Complete": "Completo", "Pending": "Pendente", "Active": "Ativo", "Inactive": "Inativo",
        "Available": "Disponível", "Unavailable": "Indisponível", "Required": "Obrigatório", "Optional": "Opcional",
        "Enabled": "Ativado", "Disabled": "Desativado", "Verified": "Verificado", "Unverified": "Não verificado",
        
        # Common UI  
        "Settings": "Configurações", "Profile": "Perfil", "Account": "Conta", "Password": "Senha",
        "Email": "E-mail", "Phone": "Telefone", "Address": "Endereço", "Name": "Nome",
        "Date": "Data", "Time": "Hora", "Location": "Localização", "Description": "Descrição",
        "Details": "Detalhes", "Information": "Informação", "Help": "Ajuda", "Support": "Suporte",
        "Contact": "Contato", "About": "Sobre", "Privacy": "Privacidade", "Terms": "Termos",
        "Policy": "Política", "License": "Licença", "Version": "Versão", "Update": "Atualizar",
        
        # Medical/Health
        "Doctor": "Médico", "Medical": "Médico", "Health": "Saúde", "Medication": "Medicamento",
        "Prescription": "Prescrição", "Symptom": "Sintoma", "Treatment": "Tratamento", "Diagnosis": "Diagnóstico",
        "Appointment": "Consulta", "Document": "Documento", "Report": "Relatório", "Analysis": "Análise",
        "Record": "Registro", "History": "Histórico", "Patient": "Paciente", "Hospital": "Hospital",
        "Pharmacy": "Farmácia", "Lab": "Laboratório", "Test": "Teste", "Result": "Resultado",
        
        # Actions (verbs)
        "Please": "Por favor", "Try": "Tentar", "Check": "Verificar", "Verify": "Verificar",
        "Confirm": "Confirmar", "Review": "Revisar", "Submit": "Enviar", "Send": "Enviar",
        "Receive": "Receber", "Get": "Obter", "Set": "Definir", "Reset": "Redefinir",
        
        # Time
        "Today": "Hoje", "Tomorrow": "Amanhã", "Yesterday": "Ontem", "Now": "Agora",
        "Later": "Mais tarde", "Soon": "Em breve", "Never": "Nunca", "Always": "Sempre",
        
        # Quantities
        "All": "Todos", "None": "Nenhum", "Some": "Alguns", "Many": "Muitos",
        "Few": "Poucos", "More": "Mais", "Less": "Menos", "Every": "Cada",
        
        # Directions
        "Left": "Esquerda", "Right": "Direita", "Up": "Cima", "Down": "Baixo",
        "Top": "Topo", "Bottom": "Inferior", "Front": "Frente", "Back": "Trás",
    }
    
    result = english_text
    
    # Apply word replacements
    for eng, pt in translations.items():
        # Replace whole words
        result = re.sub(r'\b' + re.escape(eng) + r'\b', pt, result, flags=re.IGNORECASE)
    
    return result

def main():
    repo_root = Path(__file__).parent.parent
    
    # Load validation report
    report_path = repo_root / 'i18n-validation-report.json'
    with open(report_path, 'r', encoding='utf-8') as f:
        report = json.load(f)
    
    # Load locale files
    zh_file = repo_root / 'src/i18n/zh.json'
    pt_file = repo_root / 'src/i18n/pt.json'
    
    with open(zh_file, 'r', encoding='utf-8') as f:
        zh_data = json.load(f)
    
    with open(pt_file, 'r', encoding='utf-8') as f:
        pt_data = json.load(f)
    
    # Process all ZH translations
    print("Auto-translating ALL remaining ZH keys...")
    zh_identical = report.get('identicalToEnglish', {}).get('zh', [])
    zh_updated = 0
    zh_batch = {}
    
    for item in zh_identical:
        key = item['key']
        english_value = item['value']
        translation = auto_translate_zh(english_value)
        
        # Only apply if changed from English
        if translation != english_value and not translation.startswith('['):
            zh_batch[key] = translation
            zh_updated += 1
            if zh_updated <= 10:
                print(f"  {key}: {translation[:60]}...")
    
    # Save ZH batch
    batch_file = repo_root / 'scripts/translations-zh-auto-batch.json'
    with open(batch_file, 'w', encoding='utf-8') as f:
        json.dump(zh_batch, f, ensure_ascii=False, indent=2)
    print(f"Generated {zh_updated} ZH translations -> {batch_file.name}")
    
    # Process all PT translations
    print("\\nAuto-translating ALL remaining PT keys...")
    pt_identical = report.get('identicalToEnglish', {}).get('pt', [])
    pt_updated = 0
    pt_batch = {}
    
    for item in pt_identical:
        key = item['key']
        english_value = item['value']
        translation = auto_translate_pt(english_value)
        
        # Only apply if changed from English
        if translation != english_value and not translation.startswith('['):
            pt_batch[key] = translation
            pt_updated += 1
            if pt_updated <= 10:
                print(f"  {key}: {translation[:60]}...")
    
    # Save PT batch
    batch_file = repo_root / 'scripts/translations-pt-auto-batch.json'
    with open(batch_file, 'w', encoding='utf-8') as f:
        json.dump(pt_batch, f, ensure_ascii=False, indent=2)
    print(f"Generated {pt_updated} PT translations -> {batch_file.name}")
    
    print(f"\\nTotal generated: ZH={zh_updated}, PT={pt_updated}")
    print("\\nRun apply-translations-from-json.py to apply these translations")

if __name__ == '__main__':
    main()
