import uiI18n from "../i18n";
import { Platform, Linking, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { WebPDFService } from './WebPDFService';

export interface ShareOptions {
  fileUri: string;
  fileName: string;
  message: string;
  title?: string;
  mimeType?: string;
}

export interface DoctorContact {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  specialty?: string;
  clinicName?: string;
}

export class SimpleSharing {
  /**
   * Share to WhatsApp using web service approach
   */
  static async shareToWhatsApp(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📱 SimpleSharing: Starting WhatsApp sharing with web service...');
      console.log('📱 Doctor:', doctor.name);
      console.log('📱 Phone:', doctor.phoneNumber);
      console.log('📱 File:', options.fileName);
      
      if (!doctor.phoneNumber) {
        throw new Error(uiI18n.t("ui.doctorPhoneNumberNotAvailable"));
      }
      
      // Step 1: Upload PDF to web service and get shareable link
      console.log('🌐 Step 1: Uploading PDF to web service...');
      const uploadResult = await WebPDFService.uploadPDF(options.fileUri, options.fileName);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ SimpleSharing: Failed to upload PDF to web service');
        throw new Error(uploadResult.error || uiI18n.t("ui.failedToUploadPdf"));
      }
      
      console.log('✅ SimpleSharing: PDF uploaded successfully');
      console.log('🔗 Shareable URL:', uploadResult.url);
      
      // Step 2: Generate WhatsApp message with PDF link
      const whatsappMessage = WebPDFService.generateWhatsAppMessage(
        doctor.name,
        options.fileName,
        uploadResult.url
      );
      
      console.log('📝 Generated WhatsApp message:', whatsappMessage);
      
      // Step 3: Open WhatsApp directly to doctor's chat with the message
      console.log('📱 Step 3: Opening WhatsApp to doctor chat...');
      const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;
      
      console.log('📱 WhatsApp URL:', whatsappUrl);
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      console.log('📱 Can open WhatsApp URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        console.log('✅ SimpleSharing: WhatsApp opened to doctor chat with PDF link');
        
        // Show success alert
        Alert.alert(
          uiI18n.t("adminProfile.success"),
          uiI18n.t("ui.whatsappOpenedToDrValueSChatWithThePdfLinkTheDoctorCanClickTheLinkToViewYourDocument", { value1: doctor.name }),
          [
            {
              text: uiI18n.t("ui.gotIt"),
              style: 'default'
            }
          ]
        );
        
        return true;
      } else {
        console.log('⚠️ SimpleSharing: Cannot open WhatsApp URL');
        throw new Error(uiI18n.t("ui.cannotOpenWhatsapp"));
      }
    } catch (error) {
      console.error('❌ SimpleSharing: Failed to share to WhatsApp:', error);
      
      // Show error alert
      Alert.alert(
        uiI18n.t("errors.title"),
        uiI18n.t("errors.generic"),
        [
          {
            text: uiI18n.t("adminProfile.ok"),
            style: 'default'
          }
        ]
      );
      
      return false;
    }
  }
  
  /**
   * Share to Gmail using web service approach
   */
  static async shareToGmail(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📧 SimpleSharing: Starting Gmail sharing with web service...');
      console.log('📧 Doctor:', doctor.name);
      console.log('📧 Email:', doctor.email);
      console.log('📧 File:', options.fileName);
      
      if (!doctor.email) {
        throw new Error(uiI18n.t("ui.doctorEmailNotAvailable"));
      }
      
      // Step 1: Upload PDF to web service and get shareable link
      console.log('🌐 Step 1: Uploading PDF to web service...');
      const uploadResult = await WebPDFService.uploadPDF(options.fileUri, options.fileName);
      
      if (!uploadResult.success || !uploadResult.url) {
        console.error('❌ SimpleSharing: Failed to upload PDF to web service');
        throw new Error(uploadResult.error || uiI18n.t("ui.failedToUploadPdf"));
      }
      
      console.log('✅ SimpleSharing: PDF uploaded successfully');
      console.log('🔗 Shareable URL:', uploadResult.url);
      
      // Step 2: Generate Gmail message with PDF link
      const gmailMessage = WebPDFService.generateGmailMessage(
        doctor.name,
        options.fileName,
        uploadResult.url
      );
      
      console.log('📝 Generated Gmail message:', gmailMessage);
      
      // Step 3: Open Gmail with pre-filled message
      console.log('📧 Step 3: Opening Gmail...');
      const gmailUrl = `mailto:${doctor.email}?subject=Medical Document: ${options.fileName}&body=${encodeURIComponent(gmailMessage)}`;
      
      console.log('📧 Gmail URL:', gmailUrl);
      
      const canOpen = await Linking.canOpenURL(gmailUrl);
      console.log('📧 Can open Gmail URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(gmailUrl);
        console.log('✅ SimpleSharing: Gmail opened with PDF link');
        
        // Show success alert
        Alert.alert(
          uiI18n.t("adminProfile.success"),
          uiI18n.t("ui.gmailOpenedToDrValueSEmailWithThePdfLinkTheDoctorCanClickTheLinkToViewYourDocument", { value1: doctor.name }),
          [
            {
              text: uiI18n.t("ui.gotIt"),
              style: 'default'
            }
          ]
        );
        
        return true;
      } else {
        console.log('⚠️ SimpleSharing: Cannot open Gmail URL');
        throw new Error(uiI18n.t("ui.cannotOpenGmail"));
      }
    } catch (error) {
      console.error('❌ SimpleSharing: Failed to share to Gmail:', error);
      
      // Show error alert
      Alert.alert(
        uiI18n.t("errors.title"),
        uiI18n.t("errors.generic"),
        [
          {
            text: uiI18n.t("adminProfile.ok"),
            style: 'default'
          }
        ]
      );
      
      return false;
    }
  }
}
