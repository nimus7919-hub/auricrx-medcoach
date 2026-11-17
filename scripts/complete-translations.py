#!/usr/bin/env python3
"""
Complete all remaining identical-to-English translations
Reads from validation report and applies comprehensive translations
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

def translate_to_chinese(key, english_value):
    """Generate Chinese translation based on key and English value"""
    
    # Common translations for frequent patterns
    common_translations = {
        # UI actions
        "Choose": "选择",
        "Select": "选择",
        "Scan": "扫描",
        "Upload": "上传",
        "Export": "导出",
        "Import": "导入",
        "Share": "分享",
        "Delete": "删除",
        "Edit": "编辑",
        "Add": "添加",
        "Remove": "移除",
        "Cancel": "取消",
        "Save": "保存",
        "Continue": "继续",
        "Back": "返回",
        "Next": "下一步",
        "Done": "完成",
        "Close": "关闭",
        "Open": "打开",
        "View": "查看",
        "Search": "搜索",
        "Filter": "筛选",
        "Sort": "排序",
        
        # Status
        "Not authenticated": "未认证",
        "Not available": "不可用",
        "Required": "必需",
        "Optional": "可选",
        "Loading": "加载中",
        "Error": "错误",
        "Success": "成功",
        "Failed": "失败",
        "Complete": "完成",
        "Pending": "待处理",
        
        # Common phrases
        "Please": "请",
        "Thank you": "谢谢",
        "Welcome": "欢迎",
        "Settings": "设置",
        "Profile": "档案",
        "Account": "账户",
        "Password": "密码",
        "Email": "电子邮箱",
        "Phone": "电话",
        "Address": "地址",
        "Name": "姓名",
        "Date": "日期",
        "Time": "时间",
        "Location": "位置",
        "Description": "描述",
        "Details": "详情",
        "Information": "信息",
        "Help": "帮助",
        "Support": "支持",
        "Contact": "联系",
        "About": "关于",
        "Privacy": "隐私",
        "Terms": "条款",
        "Policy": "政策",
        
        # Medical/Health
        "Doctor": "医生",
        "Medical": "医疗",
        "Health": "健康",
        "Medication": "药物",
        "Prescription": "处方",
        "Symptom": "症状",
        "Treatment": "治疗",
        "Diagnosis": "诊断",
        "Appointment": "预约",
        "Document": "文件",
        "Report": "报告",
        "Analysis": "分析",
        "Record": "记录",
        "History": "历史",
    }
    
    # Key-specific translations (comprehensive mapping)
    key_translations = {
        # UI camera/document scanning
        "ui.chooseJpgPngOrAnExistingPdfForPhotosYouCanSelectMultiple": "选择JPG/PNG或现有PDF。对于照片，可以选择多张。",
        "ui.scanWithCameraPdf": "使用相机扫描→PDF",
        "ui.useYourDeviceCameraToCaptureOneOrMorePagesAndExportToASinglePdf": "使用设备相机拍摄一页或多页，并导出为单个PDF。",
        "ui.tipOnMobileSafariChromeTheUploadInputAlsoOffersCameraThisScannerAddsMultiPageEnhancementPd": "提示：在移动Safari/Chrome上，上传按钮也提供相机选项。此扫描器添加了多页+增强+PDF功能。",
        "ui.notAuthenticated": "未认证",
        
        # Herbal properties
        "ui.immuneSystemSupportAndColdPrevention": "免疫系统支持和预防感冒",
        "ui.digestiveAidAndNauseaRelief": "助消化和缓解恶心",
        "ui.antiInflammatoryAndAntioxidantProperties": "抗炎和抗氧化特性",
        "ui.calmingAndSleepSupport": "镇静和睡眠支持",
        "ui.immuneSupportAndFluPrevention": "免疫支持和预防流感",
        
        # Doctor/medical sharing
        "ui.doctorEmailNotAvailable": "医生电子邮件不可用",
        "ui.shareMedicalDocumentWithDrValue": "与{{value1}}医生分享医疗文件",
        "ui.doctorPhoneNumberNotAvailable": "医生电话号码不可用",
        "ui.shareMedicalDocumentWithDrValue_cd6195": "与{{value1}}医生分享医疗文件",
        "ui.whatsappIsNowOpenToYourDoctorSChatPleaseTapTheAttachmentButtonAndSelectDocumentToAttachThe": "WhatsApp已打开到您医生的聊天。请点击附件按钮（📎）并选择"文档"以附加PDF文件。",
        "ui.shareMedicalDocumentWithDrValueViaWhatsapp": "通过WhatsApp与{{value1}}医生分享医疗文件",
        
        # ML Kit / OCR
        "ui.mlKitNotProperlyImported": "ML Kit未正确导入",
        "ui.mlKitOcrNotAvailableOnThisDevice": "此设备不支持ML Kit OCR",
        "ui.noPagesOrTextProvidedForPdfGeneration": "未提供用于生成PDF的页面或文字",
        "ui.invalidUriForPageValueValue": "第{{value1}}页的URI无效：{{value2}}",
        "ui.noBase64DataReturnedForPageValue": "第{{value1}}页未返回Base64数据",
        "ui.noValidImagesOrTextCouldBeProcessedForPdfGeneration": "无法处理用于生成PDF的有效图片或文字",
        
        # PDF/Document operations
        "ui.sharePdfDocument": "分享PDF文档",
        "ui.whatsappIsNowOpenToDrValueSChatPleaseTapTheAttachmentButtonAndSelectDocumentToAttachThePdf": "WhatsApp已打开到{{value1}}医生的聊天。请点击附件按钮并选择"文档"以附加PDF。",
        "ui.gmailIsNowOpenToDrValueSEmailPleaseTapTheAttachmentButtonAndSelectThePdfFileToAttach": "Gmail已打开到{{value1}}医生的邮件。请点击附件按钮并选择PDF文件附加。",
        "ui.whatsappOpenedToDrValueSChatWithThePdfLinkTheDoctorCanClickTheLinkToViewYourDocument": "WhatsApp已打开到{{value1}}医生的聊天，附带PDF链接。医生可以点击链接查看您的文档。",
        "ui.cannotOpenWhatsapp": "无法打开WhatsApp",
        "ui.gmailOpenedToDrValueSEmailWithThePdfLinkTheDoctorCanClickTheLinkToViewYourDocument": "Gmail已打开到{{value1}}医生的邮件，附带PDF链接。医生可以点击链接查看您的文档。",
        "ui.cannotOpenGmail": "无法打开Gmail",
        "ui.loadingTranslations": "正在加载翻译...",
        
        # Authentication/session
        "ui.googleAuthenticationSessionIsUnavailablePleaseTryAgain": "Google认证会话不可用。请重试。",
        "ui.emailVerificationRequired": "需要邮箱验证",
        "ui.pleaseCheckYourEmailIncludingSpamFolderAndClickTheVerificationLinkThenReturnHereToSignIn": "请检查您的电子邮件（包括垃圾邮件文件夹）并点击验证链接，然后返回此处登录。",
        "ui.backToSignIn": "返回登录",
        "ui.serverReturnedAnInvalidResponsePleaseTryAgainLater": "服务器返回了无效响应。请稍后重试。",
        "ui.couldNotGetAnAnswerRightNow": "现在无法获得答案",
        "ui.apiReturnedValue": "API返回了：{{value1}}",
        "ui.couldNotOpenMaps": "无法打开地图",
        
        # Camera/permissions
        "ui.cameraNeeded": "需要相机",
        "ui.pleaseAllowCamera": "请允许相机访问",
        "ui.addAtLeastOnePrescriptionPhoto": "请至少添加一张处方照片",
        "ui.sharePrescriptionPdf": "分享处方PDF",
        "ui.recordingError": "录音错误",
        "ui.restoringYourSession": "正在恢复您的会话...",
        "ui.checkingIfYouReAlreadySignedIn": "检查您是否已登录...",
        
        # Server/API errors
        "ui.requestTimeoutAiServerMayNotBeRunning": "请求超时。AI服务器可能未运行。",
        "ui.serverRespondedWithValueValue": "服务器响应：{{value1}} {{value2}}",
        "ui.shareHealthReport": "分享健康报告",
        "ui.shareTimeout": "分享超时",
        "ui.shareSymptomReport": "分享症状报告",
        "ui.shareSymptomTrackerReport": "分享症状追踪报告",
    }
    
    # Return key-specific translation if available
    if key in key_translations:
        return key_translations[key]
    
    # Otherwise, try pattern-based translation for common phrases
    result = english_value
    for eng, chi in common_translations.items():
        if eng.lower() in result.lower():
            # Simple word replacement (not perfect but helps)
            result = result.replace(eng, chi)
    
    # If no translation found, return a placeholder that signals need for manual review
    if result == english_value:
        # For now, return the English with a note
        return f"[需翻译] {english_value}"
    
    return result

def translate_to_portuguese(key, english_value):
    """Generate Portuguese translation based on key and English value"""
    
    # Key-specific translations (comprehensive mapping)
    key_translations = {
        # UI camera/document scanning
        "ui.chooseJpgPngOrAnExistingPdfForPhotosYouCanSelectMultiple": "Escolha JPG/PNG ou um PDF existente. Para fotos, você pode selecionar várias.",
        "ui.scanWithCameraPdf": "Digitalizar com câmera → PDF",
        "ui.useYourDeviceCameraToCaptureOneOrMorePagesAndExportToASinglePdf": "Use a câmera do seu dispositivo para capturar uma ou mais páginas e exportar para um único PDF.",
        "ui.tipOnMobileSafariChromeTheUploadInputAlsoOffersCameraThisScannerAddsMultiPageEnhancementPd": "Dica: No Safari/Chrome mobile, o botão de upload também oferece câmera. Este scanner adiciona múltiplas páginas + aprimoramento + PDF.",
        "ui.notAuthenticated": "Não autenticado",
        
        # Herbal properties
        "ui.immuneSystemSupportAndColdPrevention": "Suporte ao sistema imunológico e prevenção de resfriados",
        "ui.digestiveAidAndNauseaRelief": "Auxílio digestivo e alívio de náuseas",
        "ui.antiInflammatoryAndAntioxidantProperties": "Propriedades anti-inflamatórias e antioxidantes",
        "ui.calmingAndSleepSupport": "Acalmante e suporte ao sono",
        "ui.immuneSupportAndFluPrevention": "Suporte imunológico e prevenção da gripe",
        
        # Doctor/medical sharing
        "ui.doctorEmailNotAvailable": "E-mail do médico não disponível",
        "ui.shareMedicalDocumentWithDrValue": "Compartilhar documento médico com Dr. {{value1}}",
        "ui.doctorPhoneNumberNotAvailable": "Número de telefone do médico não disponível",
        "ui.shareMedicalDocumentWithDrValue_cd6195": "Compartilhar documento médico com Dr. {{value1}}",
        "ui.whatsappIsNowOpenToYourDoctorSChatPleaseTapTheAttachmentButtonAndSelectDocumentToAttachThe": "O WhatsApp está agora aberto no chat do seu médico. Por favor, toque no botão de anexo (📎) e selecione \"Documento\" para anexar o arquivo PDF.",
        "ui.shareMedicalDocumentWithDrValueViaWhatsapp": "Compartilhar documento médico com Dr. {{value1}} via WhatsApp",
        
        # ML Kit / OCR
        "ui.mlKitNotProperlyImported": "ML Kit não importado corretamente",
        "ui.mlKitOcrNotAvailableOnThisDevice": "ML Kit OCR não disponível neste dispositivo",
        "ui.noPagesOrTextProvidedForPdfGeneration": "Nenhuma página ou texto fornecido para geração de PDF",
        "ui.invalidUriForPageValueValue": "URI inválido para a página {{value1}}: {{value2}}",
        "ui.noBase64DataReturnedForPageValue": "Nenhum dado Base64 retornado para a página {{value1}}",
        "ui.noValidImagesOrTextCouldBeProcessedForPdfGeneration": "Nenhuma imagem válida ou texto pôde ser processado para geração de PDF",
    }
    
    # Return key-specific translation if available
    if key in key_translations:
        return key_translations[key]
    
    # For keys without specific translations, return placeholder
    return f"[Precisa tradução] {english_value}"

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
    
    # Process ZH translations
    print("Translating ZH keys...")
    zh_identical = report.get('identicalToEnglish', {}).get('zh', [])
    zh_updated = 0
    
    for item in zh_identical[:50]:  # Process first 50 in this batch
        key = item['key']
        english_value = item['value']
        translation = translate_to_chinese(key, english_value)
        
        # Only apply if not a placeholder
        if not translation.startswith('[需翻译]'):
            set_nested_key(zh_data, key, translation)
            zh_updated += 1
            if zh_updated <= 10:
                print(f"  {key}: {translation[:50]}...")
    
    # Process PT translations
    print("\\nTranslating PT keys...")
    pt_identical = report.get('identicalToEnglish', {}).get('pt', [])
    pt_updated = 0
    
    for item in pt_identical[:50]:  # Process first 50 in this batch
        key = item['key']
        english_value = item['value']
        translation = translate_to_portuguese(key, english_value)
        
        # Only apply if not a placeholder
        if not translation.startswith('[Precisa tradução]'):
            set_nested_key(pt_data, key, translation)
            pt_updated += 1
            if pt_updated <= 10:
                print(f"  {key}: {translation[:50]}...")
    
    # Save files
    with open(zh_file, 'w', encoding='utf-8') as f:
        json.dump(zh_data, f, ensure_ascii=False, indent=2)
    
    with open(pt_file, 'w', encoding='utf-8') as f:
        json.dump(pt_data, f, ensure_ascii=False, indent=2)
    
    print(f"\\nBatch complete: ZH={zh_updated}, PT={pt_updated}")

if __name__ == '__main__':
    main()
