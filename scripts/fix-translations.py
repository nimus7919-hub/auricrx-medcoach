#!/usr/bin/env python3
"""
Fix untranslated English copies in zh.json and pt.json
"""

import json
import re
from pathlib import Path

# Translation mappings for Chinese (Simplified)
zh_translations = {
    # Dashboard
    "dashboard.appointmentSubtitle": "管理您的预约和医疗访问",
    
    # AI section - Core functionality
    "ai.aiThinking": "AI思考中...",
    "ai.errorPreparingData": "准备数据时出错",
    "ai.networkError": "网络错误",
    "ai.helpUsGetPrice": "帮助我们获取价格",
    "ai.contributionDescription": "分享您找到的药品价格以帮助他人",
    "ai.contributionError": "贡献错误",
    "ai.contributionErrorText": "提交价格信息时出错",
    "ai.contributionSuccessText": "感谢您的贡献！",
    "ai.supplementName": "补充剂名称",
    "ai.supplementNamePlaceholder": "例如：维生素D3",
    "ai.brandPlaceholder": "品牌（可选）",
    "ai.pricePlaceholder": "价格",
    "ai.quantityPlaceholder": "数量",
    "ai.storeNamePlaceholder": "店铺名称",
    "ai.storeAddressPlaceholder": "店铺地址",
    
    # Health insights
    "ai.healthInsights": "健康洞察",
    "ai.fastingCompatibilityDescription": "根据您的健康状况分析禁食兼容性",
    "ai.consultHealthcareProviderDisclaimer": "此分析不能替代专业医疗建议。请咨询您的医疗保健提供者。",
    "ai.generateHealthReportDescription": "基于您的健康数据生成综合报告",
    
    # Fasting analysis
    "ai.fastingNotRecommended": "不建议禁食",
    "ai.fastingRequiresSupervision": "禁食需要医疗监督",
    "ai.fastingMayBeSuitableWithCaution": "禁食可能适合，但需谨慎",
    "ai.considerShorterFastingPeriod": "考虑缩短禁食时间",
    "ai.hourFastingWindowAppropriate": "小时禁食窗口适宜",
    "ai.hourFastingWindowSuitable": "小时禁食窗口合适",
    "ai.pleaseConsultHealthcareProvider": "请咨询医疗保健提供者",
    "ai.noMedicationsRecorded": "未记录药物",
    
    # Health conditions
    "ai.healthConditions": "健康状况",
    "ai.heartConditions": "心脏疾病",
    "ai.kidneyDisease": "肾脏疾病",
    "ai.liverDisease": "肝脏疾病",
    "ai.eatingDisorders": "饮食失调",
    "ai.breastfeeding": "哺乳期",
    "ai.gastrointestinalIssues": "胃肠道问题",
    "ai.noneReported": "无报告",
    
    # Body metrics
    "ai.bodyFatLevel": "体脂水平",
    "ai.micronutrientLevels": "微量营养素水平",
    "ai.hydrationLevel": "水合水平",
    "ai.highStressEnvironment": "高压力环境",
    "ai.intensiveMentalTasks": "高强度脑力工作",
    "ai.activityLevel": "活动水平",
    "ai.physicalLaborJob": "体力劳动工作",
    "ai.longWorkShifts": "长时间工作轮班",
    "ai.sleepQuality": "睡眠质量",
    
    # Fasting preferences
    "ai.preferredFastingType": "首选禁食类型",
    "ai.maximumFastingHours": "最长禁食小时数",
    "ai.fastingFrequency": "禁食频率",
    "ai.medicalSupervision": "医疗监督",
    "ai.selfMonitoring": "自我监测",
    "ai.wearableDevices": "可穿戴设备",
    "ai.noFastingProfileCompleted": "未完成禁食档案",
    "ai.healthProfile": "健康档案",
    "ai.currentMedications": "当前药物",
    
    # Export and reports
    "ai.exportHealthReport": "导出健康报告",
    "ai.failedToAnalyzeSymptoms": "症状分析失败",
    "ai.failedToCheckDrugInteractions": "药物相互作用检查失败",
    "ai.failedToAnalyzeFastingCompatibility": "禁食兼容性分析失败",
    "ai.lowBMIRisk": "低BMI风险",
    "ai.higherBMIRisk": "较高BMI风险",
    "ai.healthReport": "健康报告",
    "ai.auricrxHealthReport": "AuricRX健康报告",
    "ai.thisReportWasGenerated": "本报告生成于",
    "ai.consultHealthcareProvider": "咨询医疗保健提供者",
    
    # Fasting analysis details
    "ai.fastingAnalysis": "禁食分析",
    "ai.fastingDisclaimer": "禁食免责声明：本分析仅供参考，不能替代专业医疗建议",
    "ai.pleaseEnterSymptoms": "请输入症状",
    "ai.pleaseEnterMedications": "请输入药物",
    "ai.symptomAnalysisComplete": "症状分析完成",
    "ai.noInteractionsFound": "未发现相互作用",
    "ai.noKnownInteractions": "无已知相互作用",
    "ai.foundInteractions": "发现相互作用",
    
    # Symptoms
    "ai.generalSymptoms": "一般症状",
    "ai.multipleSymptomsDescription": "多种症状说明",
    "ai.monitorSymptomsClosely": "密切监测症状",
    "ai.considerConsultingProvider": "考虑咨询提供者",
    "ai.maintainHydrationRest": "保持水分和休息",
    "ai.getAdequateRest": "充分休息",
    "ai.stayHydrated": "保持水分",
    "ai.monitorSymptoms": "监测症状",
    "ai.scheduleAppointmentIfPersist": "如症状持续请预约就诊",
    "ai.keepSymptomDiary": "记录症状日记",
    
    # Interactions
    "ai.potentialMildInteraction": "可能的轻度相互作用",
    "ai.mildSideEffectsPossible": "可能出现轻度副作用",
    "ai.monitorUnusualSymptoms": "监测异常症状",
    "ai.drugInteractionDatabase": "药物相互作用数据库",
    "ai.recommendations": "建议",
    "ai.fastingCompatible": "禁食兼容",
    "ai.fastingWarning": "禁食警告",
    
    # Specific fasting warnings
    "ai.diabetesRequiresSupervision": "糖尿病需要监督",
    "ai.pregnancyRequiresSupervision": "孕期需要监督",
    "ai.eatingDisordersRequireSupervision": "饮食失调需要监督",
    "ai.heartKidneyLiverRequireSupervision": "心脏/肾脏/肝脏疾病需要监督",
    "ai.gastrointestinalIssuesWorsened": "胃肠道问题可能恶化",
    "ai.lowBodyFatRisky": "低体脂有风险",
    "ai.poorHydrationIncreasesRisks": "水分不足增加风险",
    "ai.anxietyDepressionAffected": "焦虑/抑郁可能受影响",
    "ai.highActivityRequiresNutrition": "高活动量需要营养",
    "ai.poorSleepAffected": "睡眠不足受影响",
    "ai.notSpecified": "未指定",
    
    # Profile sections
    "ai.basicInformation": "基本信息",
    "ai.nutritionalStatusBodyComposition": "营养状况和身体成分",
    "ai.mentalHealthCognitiveDemands": "心理健康和认知需求",
    "ai.lifestyleActivityLevel": "生活方式和活动水平",
    "ai.fastingProtocolPreferences": "禁食方案偏好",
    "ai.medicalSupervisionMonitoring": "医疗监督和监测",
    
    # Export status
    "ai.exportSuccessful": "导出成功",
    "ai.healthReportGenerated": "健康报告已生成",
    "ai.setupRequired": "需要设置",
    "ai.pleaseGoToSettings": "请转到设置",
    "ai.shouldBeTakenWithFood": "应与食物一起服用",
    "ai.followUpActions": "后续行动",
    
    # Common symptoms/conditions
    "ai.viralInfection": "病毒感染",
    "ai.gastroenteritis": "胃肠炎",
    "ai.foodIntolerance": "食物不耐受",
    "ai.tensionHeadache": "紧张性头痛",
    "ai.tensionHeadacheWithDizziness": "伴有头晕的紧张性头痛",
    "ai.sinusCongestion": "鼻窦充血",
    "ai.allergies": "过敏",
    "ai.cough": "咳嗽",
    "ai.backStrain": "背部拉伤",
    "ai.arthritis": "关节炎",
    "ai.menstrualCramps": "痛经",
    "ai.reflux": "反流",
    "ai.sprainBruise": "扭伤/瘀伤",
    "ai.skinIrritation": "皮肤刺激",
    "ai.viralSyndrome": "病毒综合征",
    "ai.stomachUpset": "胃部不适",
    "ai.contactDoctorImmediately": "立即联系医生",
    
    # Symptom tracker
    "ai.exportSymptomReport": "导出症状报告",
    "ai.importantNotice": "重要通知",
    "ai.viewAllSymptoms": "查看所有症状",
    "ai.symptomHistory": "症状历史",
    "ai.totalSymptoms": "总症状数",
    "ai.emptyAllSymptoms": "清空所有症状",
    "ai.confirmEmptySymptoms": "确认清空症状",
    "ai.confirmEmptySymptomsMessage": "您确定要清空所有症状吗？此操作无法撤消。",
    "ai.symptomTrackerReport": "症状追踪报告",
    "ai.symptomReportGenerated": "症状报告已生成",
    "ai.symptomReportFailed": "症状报告生成失败",
    "ai.exportFailed": "导出失败",
    "ai.symptomTrackerDisclaimer": "症状追踪器免责声明",
    "ai.auricrxMedCoach": "AuricRX MedCoach",
    "ai.symptomSaved": "症状已保存",
    "ai.exportActiveSymptoms": "导出活动症状",
    "ai.activeSymptomReport": "活动症状报告",
    "ai.activeSymptoms": "活动症状",
    "ai.activeSymptomsList": "活动症状列表",
    "ai.noActiveSymptoms": "无活动症状",
    "ai.noActiveSymptomsMessage": "您当前没有活动症状",
    "ai.noSymptomsToExport": "无症状可导出",
    "ai.noSymptomsMessage": "未记录症状",
    "ai.storedSymptoms": "已存储症状",
    "ai.completeSymptomHistory": "完整症状历史",
    "ai.medicalDisclaimer": "医疗免责声明",
    "ai.interactionDisclaimerText": "相互作用免责声明文本",
    
    # Medications list
    "ai.yourMedications": "您的药物",
    "ai.yourSupplements": "您的补充剂",
    "ai.noMedicationsToCheck": "无药物可检查",
    "ai.needTwoItems": "需要至少两个项目",
    "ai.checkingInteractions": "检查相互作用中...",
    "ai.interactionResults": "相互作用结果",
    "ai.generalSummary": "总体摘要",
    "ai.failedToCheckInteractions": "相互作用检查失败",
    "ai.noInteractionsMessage": "未发现相互作用",
    "ai.clinicalEffects": "临床效应",
    
    # Health profile
    "healthProfile.title": "健康档案",
    "healthProfile.settings": "设置",
    "healthProfile.description": "管理您的健康信息",
    "healthProfile.basicInfo": "基本信息",
    "healthProfile.kg": "公斤",
    "healthProfile.cm": "厘米",
    "healthProfile.ft": "英尺",
    "healthProfile.healthConditions": "健康状况",
    "healthProfile.otherHealthConditions": "其他健康状况",
    "healthProfile.addHealthCondition": "添加健康状况",
    "healthProfile.enterHealthCondition": "输入健康状况",
    "healthProfile.nutritionalStatus": "营养状况",
    "healthProfile.mentalHealth": "心理健康",
    "healthProfile.lifestyleActivity": "生活方式和活动",
    "healthProfile.fastingPreferences": "禁食偏好",
    "healthProfile.healthMonitoring": "健康监测",
    "healthProfile.medicalSupervision": "医疗监督",
    "healthProfile.heartConditions": "心脏疾病",
    "healthProfile.kidneyDisease": "肾脏疾病",
    "healthProfile.liverDisease": "肝脏疾病",
    "healthProfile.eatingDisorders": "饮食失调",
    "healthProfile.breastfeeding": "哺乳期",
    "healthProfile.gastrointestinalIssues": "胃肠道问题",
    "healthProfile.bodyFatLevel": "体脂水平",
    "healthProfile.micronutrientLevels": "微量营养素水平",
    "healthProfile.hydrationLevel": "水合水平",
    "healthProfile.highStressEnvironment": "高压力环境",
    "healthProfile.intensiveMentalTasks": "高强度脑力工作",
    "healthProfile.activityLevel": "活动水平",
    "healthProfile.physicalLabor": "体力劳动",
    "healthProfile.longShifts": "长时间轮班",
    "healthProfile.sleepQuality": "睡眠质量",
    "healthProfile.preferredFastingType": "首选禁食类型",
    "healthProfile.maxFastingHours": "最长禁食小时数",
    "healthProfile.fastingFrequency": "禁食频率",
    "healthProfile.weightLossGoal": "减重目标",
    "healthProfile.metabolicHealthGoal": "代谢健康目标",
    "healthProfile.selfMonitoring": "自我监测",
    "healthProfile.wearableDevices": "可穿戴设备",
    "healthProfile.timeRestricted": "限时",
    "healthProfile.alternateDay": "隔日",
    "healthProfile.extended": "延长",
    "healthProfile.metabolicHealth": "代谢健康",
    "healthProfile.generalHealth": "一般健康",
    "healthProfile.spiritual": "精神",
    "healthProfile.profileSaved": "档案已保存",
    "healthProfile.healthProfileSavedMessage": "您的健康档案已成功保存",
    
    # Health analytics
    "healthAnalytics.healthAnalytics": "健康分析",
    
    # Medications
    "medications.searchingPharmacies": "搜索药房中...",
    "medications.singleComponent": "单一成分",
    
    # Supplements
    "supplements.distanceUnknown": "距离未知",
    "supplements.pickupAvailable": "可取货",
    "supplements.deliveryAvailable": "可配送",
    "supplements.foundStores": "找到店铺",
    "supplements.updateStatus": "更新状态",
    "supplements.searchSupplements": "搜索补充剂",
    "supplements.priceNotAvailable": "价格未提供",
    
    # Reminders
    "reminders.componentType": "组件类型",
    
    # Settings
    "settings.emailAddress": "电子邮箱",
    
    # Common
    "common.appDescription": "您的个人健康教练",
}

# Translation mappings for Portuguese (Brazilian)
pt_translations = {
    # Dashboard
    "dashboard.appointmentSubtitle": "Gerenciar suas consultas e visitas médicas",
    
    # AI section - Core functionality
    "ai.aiThinking": "IA pensando...",
    "ai.errorPreparingData": "Erro ao preparar dados",
    "ai.networkError": "Erro de rede",
    "ai.helpUsGetPrice": "Ajude-nos a obter o preço",
    "ai.contributionDescription": "Compartilhe os preços de medicamentos que você encontrou para ajudar os outros",
    "ai.contributionError": "Erro de contribuição",
    "ai.contributionErrorText": "Erro ao enviar informações de preço",
    "ai.contributionSuccessText": "Obrigado pela sua contribuição!",
    "ai.supplementName": "Nome do suplemento",
    "ai.supplementNamePlaceholder": "Ex.: Vitamina D3",
    "ai.brandPlaceholder": "Marca (opcional)",
    "ai.pricePlaceholder": "Preço",
    "ai.quantityPlaceholder": "Quantidade",
    "ai.storeNamePlaceholder": "Nome da loja",
    "ai.storeAddressPlaceholder": "Endereço da loja",
    
    # Health insights
    "ai.healthInsights": "Insights de saúde",
    "ai.fastingCompatibilityDescription": "Analise a compatibilidade do jejum com base na sua saúde",
    "ai.consultHealthcareProviderDisclaimer": "Esta análise não substitui aconselhamento médico profissional. Consulte seu provedor de saúde.",
    "ai.generateHealthReportDescription": "Gere um relatório abrangente baseado nos seus dados de saúde",
    
    # Fasting analysis
    "ai.fastingNotRecommended": "Jejum não recomendado",
    "ai.fastingRequiresSupervision": "Jejum requer supervisão médica",
    "ai.fastingMayBeSuitableWithCaution": "Jejum pode ser adequado, mas com cautela",
    "ai.considerShorterFastingPeriod": "Considere um período de jejum mais curto",
    "ai.hourFastingWindowAppropriate": "janela de jejum de horas apropriada",
    "ai.hourFastingWindowSuitable": "janela de jejum de horas adequada",
    "ai.pleaseConsultHealthcareProvider": "Consulte um provedor de saúde",
    "ai.noMedicationsRecorded": "Nenhum medicamento registrado",
    
    # Health conditions
    "ai.healthConditions": "Condições de saúde",
    "ai.heartConditions": "Condições cardíacas",
    "ai.kidneyDisease": "Doença renal",
    "ai.liverDisease": "Doença hepática",
    "ai.eatingDisorders": "Transtornos alimentares",
    "ai.breastfeeding": "Amamentação",
    "ai.gastrointestinalIssues": "Problemas gastrointestinais",
    "ai.noneReported": "Nenhum relatado",
    
    # Body metrics
    "ai.bodyFatLevel": "Nível de gordura corporal",
    "ai.micronutrientLevels": "Níveis de micronutrientes",
    "ai.hydrationLevel": "Nível de hidratação",
    "ai.highStressEnvironment": "Ambiente de alto estresse",
    "ai.intensiveMentalTasks": "Tarefas mentais intensivas",
    "ai.activityLevel": "Nível de atividade",
    "ai.physicalLaborJob": "Trabalho físico",
    "ai.longWorkShifts": "Turnos de trabalho longos",
    "ai.sleepQuality": "Qualidade do sono",
    
    # Fasting preferences
    "ai.preferredFastingType": "Tipo de jejum preferido",
    "ai.maximumFastingHours": "Horas máximas de jejum",
    "ai.fastingFrequency": "Frequência de jejum",
    "ai.medicalSupervision": "Supervisão médica",
    "ai.selfMonitoring": "Automonitoramento",
    "ai.wearableDevices": "Dispositivos vestíveis",
    "ai.noFastingProfileCompleted": "Nenhum perfil de jejum concluído",
    "ai.healthProfile": "Perfil de saúde",
    "ai.currentMedications": "Medicamentos atuais",
    
    # Export and reports
    "ai.exportHealthReport": "Exportar relatório de saúde",
    "ai.failedToAnalyzeSymptoms": "Falha ao analisar sintomas",
    "ai.failedToCheckDrugInteractions": "Falha ao verificar interações medicamentosas",
    "ai.failedToAnalyzeFastingCompatibility": "Falha ao analisar compatibilidade de jejum",
    "ai.lowBMIRisk": "Risco de IMC baixo",
    "ai.higherBMIRisk": "Risco de IMC mais alto",
    "ai.healthReport": "Relatório de saúde",
    "ai.auricrxHealthReport": "Relatório de Saúde AuricRX",
    "ai.thisReportWasGenerated": "Este relatório foi gerado em",
    "ai.consultHealthcareProvider": "Consulte um provedor de saúde",
    
    # Fasting analysis details
    "ai.fastingAnalysis": "Análise de jejum",
    "ai.fastingDisclaimer": "Isenção de responsabilidade sobre jejum: Esta análise é apenas para referência e não substitui aconselhamento médico profissional",
    "ai.pleaseEnterSymptoms": "Por favor, insira os sintomas",
    "ai.pleaseEnterMedications": "Por favor, insira os medicamentos",
    "ai.symptomAnalysisComplete": "Análise de sintomas concluída",
    "ai.noInteractionsFound": "Nenhuma interação encontrada",
    "ai.noKnownInteractions": "Nenhuma interação conhecida",
    "ai.foundInteractions": "Interações encontradas",
    
    # Symptoms
    "ai.generalSymptoms": "Sintomas gerais",
    "ai.multipleSymptomsDescription": "Descrição de múltiplos sintomas",
    "ai.monitorSymptomsClosely": "Monitore os sintomas de perto",
    "ai.considerConsultingProvider": "Considere consultar um provedor",
    "ai.maintainHydrationRest": "Mantenha hidratação e repouso",
    "ai.getAdequateRest": "Descanse adequadamente",
    "ai.stayHydrated": "Mantenha-se hidratado",
    "ai.monitorSymptoms": "Monitorar sintomas",
    "ai.scheduleAppointmentIfPersist": "Agende uma consulta se os sintomas persistirem",
    "ai.keepSymptomDiary": "Mantenha um diário de sintomas",
    
    # Interactions
    "ai.potentialMildInteraction": "Possível interação leve",
    "ai.mildSideEffectsPossible": "Efeitos colaterais leves possíveis",
    "ai.monitorUnusualSymptoms": "Monitore sintomas incomuns",
    "ai.drugInteractionDatabase": "Banco de dados de interações medicamentosas",
    "ai.recommendations": "Recomendações",
    "ai.fastingCompatible": "Compatível com jejum",
    "ai.fastingWarning": "Aviso de jejum",
    
    # Specific fasting warnings
    "ai.diabetesRequiresSupervision": "Diabetes requer supervisão",
    "ai.pregnancyRequiresSupervision": "Gravidez requer supervisão",
    "ai.eatingDisordersRequireSupervision": "Transtornos alimentares requerem supervisão",
    "ai.heartKidneyLiverRequireSupervision": "Doenças cardíacas/renais/hepáticas requerem supervisão",
    "ai.gastrointestinalIssuesWorsened": "Problemas gastrointestinais podem piorar",
    "ai.lowBodyFatRisky": "Baixa gordura corporal é arriscado",
    "ai.poorHydrationIncreasesRisks": "Má hidratação aumenta riscos",
    "ai.anxietyDepressionAffected": "Ansiedade/depressão podem ser afetadas",
    "ai.highActivityRequiresNutrition": "Alta atividade requer nutrição",
    "ai.poorSleepAffected": "Sono ruim é afetado",
    "ai.notSpecified": "Não especificado",
    
    # Profile sections
    "ai.basicInformation": "Informações básicas",
    "ai.nutritionalStatusBodyComposition": "Status nutricional e composição corporal",
    "ai.mentalHealthCognitiveDemands": "Saúde mental e demandas cognitivas",
    "ai.lifestyleActivityLevel": "Estilo de vida e nível de atividade",
    "ai.fastingProtocolPreferences": "Preferências de protocolo de jejum",
    "ai.medicalSupervisionMonitoring": "Supervisão médica e monitoramento",
    
    # Export status
    "ai.exportSuccessful": "Exportação bem-sucedida",
    "ai.healthReportGenerated": "Relatório de saúde gerado",
    "ai.setupRequired": "Configuração necessária",
    "ai.pleaseGoToSettings": "Por favor, vá para configurações",
    "ai.shouldBeTakenWithFood": "Deve ser tomado com comida",
    "ai.followUpActions": "Ações de acompanhamento",
    
    # Common symptoms/conditions
    "ai.viralInfection": "Infecção viral",
    "ai.gastroenteritis": "Gastroenterite",
    "ai.foodIntolerance": "Intolerância alimentar",
    "ai.tensionHeadache": "Dor de cabeça tensional",
    "ai.tensionHeadacheWithDizziness": "Dor de cabeça tensional com tontura",
    "ai.sinusCongestion": "Congestão sinusal",
    "ai.allergies": "Alergias",
    "ai.cough": "Tosse",
    "ai.backStrain": "Distensão nas costas",
    "ai.arthritis": "Artrite",
    "ai.menstrualCramps": "Cólicas menstruais",
    "ai.reflux": "Refluxo",
    "ai.sprainBruise": "Entorse/contusão",
    "ai.skinIrritation": "Irritação da pele",
    "ai.viralSyndrome": "Síndrome viral",
    "ai.stomachUpset": "Estômago perturbado",
    "ai.contactDoctorImmediately": "Entre em contato com o médico imediatamente",
    
    # Symptom tracker
    "ai.exportSymptomReport": "Exportar relatório de sintomas",
    "ai.importantNotice": "Aviso importante",
    "ai.viewAllSymptoms": "Ver todos os sintomas",
    "ai.symptomHistory": "Histórico de sintomas",
    "ai.totalSymptoms": "Total de sintomas",
    "ai.emptyAllSymptoms": "Esvaziar todos os sintomas",
    "ai.confirmEmptySymptoms": "Confirmar esvaziar sintomas",
    "ai.confirmEmptySymptomsMessage": "Tem certeza de que deseja esvaziar todos os sintomas? Esta ação não pode ser desfeita.",
    "ai.symptomTrackerReport": "Relatório do rastreador de sintomas",
    "ai.symptomReportGenerated": "Relatório de sintomas gerado",
    "ai.symptomReportFailed": "Falha ao gerar relatório de sintomas",
    "ai.exportFailed": "Exportação falhou",
    "ai.symptomTrackerDisclaimer": "Isenção de responsabilidade do rastreador de sintomas",
    "ai.auricrxMedCoach": "AuricRX MedCoach",
    "ai.symptomSaved": "Sintoma salvo",
    "ai.exportActiveSymptoms": "Exportar sintomas ativos",
    "ai.activeSymptomReport": "Relatório de sintomas ativos",
    "ai.activeSymptoms": "Sintomas ativos",
    "ai.activeSymptomsList": "Lista de sintomas ativos",
    "ai.noActiveSymptoms": "Nenhum sintoma ativo",
    "ai.noActiveSymptomsMessage": "Você não tem sintomas ativos no momento",
    "ai.noSymptomsToExport": "Nenhum sintoma para exportar",
    "ai.noSymptomsMessage": "Nenhum sintoma registrado",
    "ai.storedSymptoms": "Sintomas armazenados",
    "ai.completeSymptomHistory": "Histórico completo de sintomas",
    "ai.medicalDisclaimer": "Isenção de responsabilidade médica",
    "ai.interactionDisclaimerText": "Texto de isenção de responsabilidade de interação",
    
    # Medications list
    "ai.yourMedications": "Seus medicamentos",
    "ai.yourSupplements": "Seus suplementos",
    "ai.noMedicationsToCheck": "Nenhum medicamento para verificar",
    "ai.needTwoItems": "Precisa de pelo menos dois itens",
    "ai.checkingInteractions": "Verificando interações...",
    "ai.interactionResults": "Resultados de interações",
    "ai.generalSummary": "Resumo geral",
    "ai.failedToCheckInteractions": "Falha ao verificar interações",
    "ai.noInteractionsMessage": "Nenhuma interação encontrada",
    "ai.clinicalEffects": "Efeitos clínicos",
    
    # Health profile
    "healthProfile.title": "Perfil de saúde",
    "healthProfile.settings": "Configurações",
    "healthProfile.description": "Gerenciar suas informações de saúde",
    "healthProfile.basicInfo": "Informações básicas",
    "healthProfile.kg": "kg",
    "healthProfile.cm": "cm",
    "healthProfile.ft": "pés",
    "healthProfile.healthConditions": "Condições de saúde",
    "healthProfile.otherHealthConditions": "Outras condições de saúde",
    "healthProfile.addHealthCondition": "Adicionar condição de saúde",
    "healthProfile.enterHealthCondition": "Inserir condição de saúde",
    "healthProfile.nutritionalStatus": "Status nutricional",
    "healthProfile.mentalHealth": "Saúde mental",
    "healthProfile.lifestyleActivity": "Estilo de vida e atividade",
    "healthProfile.fastingPreferences": "Preferências de jejum",
    "healthProfile.healthMonitoring": "Monitoramento de saúde",
    "healthProfile.medicalSupervision": "Supervisão médica",
    "healthProfile.heartConditions": "Condições cardíacas",
    "healthProfile.kidneyDisease": "Doença renal",
    "healthProfile.liverDisease": "Doença hepática",
    "healthProfile.eatingDisorders": "Transtornos alimentares",
    "healthProfile.breastfeeding": "Amamentação",
    "healthProfile.gastrointestinalIssues": "Problemas gastrointestinais",
    "healthProfile.bodyFatLevel": "Nível de gordura corporal",
    "healthProfile.micronutrientLevels": "Níveis de micronutrientes",
    "healthProfile.hydrationLevel": "Nível de hidratação",
    "healthProfile.highStressEnvironment": "Ambiente de alto estresse",
    "healthProfile.intensiveMentalTasks": "Tarefas mentais intensivas",
    "healthProfile.activityLevel": "Nível de atividade",
    "healthProfile.physicalLabor": "Trabalho físico",
    "healthProfile.longShifts": "Turnos longos",
    "healthProfile.sleepQuality": "Qualidade do sono",
    "healthProfile.preferredFastingType": "Tipo de jejum preferido",
    "healthProfile.maxFastingHours": "Horas máximas de jejum",
    "healthProfile.fastingFrequency": "Frequência de jejum",
    "healthProfile.weightLossGoal": "Meta de perda de peso",
    "healthProfile.metabolicHealthGoal": "Meta de saúde metabólica",
    "healthProfile.selfMonitoring": "Automonitoramento",
    "healthProfile.wearableDevices": "Dispositivos vestíveis",
    "healthProfile.timeRestricted": "Tempo restrito",
    "healthProfile.alternateDay": "Dias alternados",
    "healthProfile.extended": "Estendido",
    "healthProfile.metabolicHealth": "Saúde metabólica",
    "healthProfile.generalHealth": "Saúde geral",
    "healthProfile.spiritual": "Espiritual",
    "healthProfile.profileSaved": "Perfil salvo",
    "healthProfile.healthProfileSavedMessage": "Seu perfil de saúde foi salvo com sucesso",
    
    # Health analytics
    "healthAnalytics.healthAnalytics": "Análise de saúde",
    
    # Medications
    "medications.searchingPharmacies": "Pesquisando farmácias...",
    "medications.singleComponent": "Componente único",
    
    # Supplements
    "supplements.distanceUnknown": "Distância desconhecida",
    "supplements.pickupAvailable": "Retirada disponível",
    "supplements.deliveryAvailable": "Entrega disponível",
    "supplements.foundStores": "Lojas encontradas",
    "supplements.updateStatus": "Atualizar status",
    "supplements.searchSupplements": "Pesquisar suplementos",
    "supplements.priceNotAvailable": "Preço não disponível",
    
    # Reminders
    "reminders.componentType": "Tipo de componente",
    
    # Settings
    "settings.emailAddress": "Endereço de e-mail",
    
    # Common
    "common.appDescription": "Seu treinador de saúde pessoal",
}


def update_json_file(file_path: Path, translations: dict):
    """Update JSON file with translations"""
    print(f"\\nUpdating {file_path.name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    updates = 0
    for key, translation in translations.items():
        # Navigate nested keys
        keys = key.split('.')
        current = data
        
        try:
            # Navigate to parent
            for k in keys[:-1]:
                current = current[k]
            
            # Update if key exists and value is English
            final_key = keys[-1]
            if final_key in current:
                old_value = current[final_key]
                # Only update if it looks like untranslated English
                if isinstance(old_value, str) and len(old_value) > 12:
                    current[final_key] = translation
                    updates += 1
                    if updates <= 10:  # Show first 10 updates
                        print(f"  {key}: '{old_value[:50]}...' → '{translation[:50]}...'")
        except (KeyError, TypeError) as e:
            print(f"  Warning: Could not find key {key}: {e}")
            continue
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Updated {updates} keys in {file_path.name}")
    return updates


def main():
    repo_root = Path(__file__).parent.parent
    zh_file = repo_root / 'src/i18n/zh.json'
    pt_file = repo_root / 'src/i18n/pt.json'
    
    print("Starting translation updates...")
    print("=" * 60)
    
    zh_updates = update_json_file(zh_file, zh_translations)
    pt_updates = update_json_file(pt_file, pt_translations)
    
    print("\\n" + "=" * 60)
    print(f"Total updates: ZH={zh_updates}, PT={pt_updates}")
    print("\\nThis is batch 1 of translations (AI and health profile sections)")
    print("More batches will follow for UI, localized, and country labels.")


if __name__ == '__main__':
    main()
