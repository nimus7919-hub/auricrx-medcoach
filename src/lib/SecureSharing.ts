import { Platform, Linking, Alert, Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

export class SecureSharing {
  /**
   * Share to WhatsApp using secure local file approach
   */
  static async shareToWhatsApp(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📱 SecureSharing: Starting WhatsApp sharing with local file...');
      console.log('📱 Doctor:', doctor.name);
      console.log('📱 Phone:', doctor.phoneNumber);
      console.log('📱 File:', options.fileName);
      
      if (!doctor.phoneNumber) {
        throw new Error('Doctor phone number not available');
      }
      
      // Step 1: Copy file to a shareable location
      console.log('📁 Step 1: Preparing file for sharing...');
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });
      
      console.log('✅ SecureSharing: File prepared successfully');
      console.log('📁 Shareable URI:', shareableUri);
      
      // Step 2: Generate WhatsApp message
      const whatsappMessage = `Hi Dr. ${doctor.name}, please find attached my medical document: ${options.fileName}\n\nThis document was shared securely through AuricRX Medical Coach.`;
      
      console.log('📝 Generated WhatsApp message:', whatsappMessage);
      
      // Step 3: Try to open WhatsApp directly to doctor's chat
      console.log('📱 Step 3: Opening WhatsApp to doctor chat...');
      const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
      const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(whatsappMessage)}`;
      
      console.log('📱 WhatsApp URL:', whatsappUrl);
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      console.log('📱 Can open WhatsApp URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        console.log('✅ SecureSharing: WhatsApp opened to doctor chat');
        
        // Show alert to guide user to attach file
        setTimeout(() => {
          Alert.alert(
            '📎 Attach File',
            `WhatsApp is now open to Dr. ${doctor.name}'s chat. Please tap the attachment button (📎) and select "Document" to attach the PDF file.`,
            [
              {
                text: 'Got it!',
                style: 'default'
              }
            ]
          );
        }, 2000);
        
        return true;
      } else {
        console.log('⚠️ SecureSharing: Cannot open WhatsApp URL, trying fallback...');
        
        // Fallback: Use expo-sharing to show sharing dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(shareableUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
          });
          console.log('✅ SecureSharing: File shared via expo-sharing fallback');
          return true;
        } else {
          throw new Error('Sharing not available');
        }
      }
    } catch (error) {
      console.error('❌ SecureSharing: Failed to share to WhatsApp:', error);
      
      // Show error alert
      Alert.alert(
        '❌ Error',
        `Failed to open WhatsApp: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
      return false;
    }
  }
  
  /**
   * Share to Gmail using secure local file approach
   */
  static async shareToGmail(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📧 SecureSharing: Starting Gmail sharing with local file...');
      console.log('📧 Doctor:', doctor.name);
      console.log('📧 Email:', doctor.email);
      console.log('📧 File:', options.fileName);
      
      if (!doctor.email) {
        throw new Error('Doctor email not available');
      }
      
      // Step 1: Copy file to a shareable location
      console.log('📁 Step 1: Preparing file for sharing...');
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });
      
      console.log('✅ SecureSharing: File prepared successfully');
      console.log('📁 Shareable URI:', shareableUri);
      
      // Step 2: Generate Gmail message
      const gmailMessage = `Hi Dr. ${doctor.name},\n\nPlease find attached my medical document: ${options.fileName}\n\nThis document was shared securely through AuricRX Medical Coach.\n\nBest regards,\nPatient`;
      
      console.log('📝 Generated Gmail message:', gmailMessage);
      
      // Step 3: Try to open Gmail with pre-filled message
      console.log('📧 Step 3: Opening Gmail...');
      const gmailUrl = `mailto:${doctor.email}?subject=Medical Document: ${options.fileName}&body=${encodeURIComponent(gmailMessage)}`;
      
      console.log('📧 Gmail URL:', gmailUrl);
      
      const canOpen = await Linking.canOpenURL(gmailUrl);
      console.log('📧 Can open Gmail URL:', canOpen);
      
      if (canOpen) {
        await Linking.openURL(gmailUrl);
        console.log('✅ SecureSharing: Gmail opened with pre-filled message');
        
        // Show alert to guide user to attach file
        setTimeout(() => {
          Alert.alert(
            '📎 Attach File',
            `Gmail is now open to Dr. ${doctor.name}'s email. Please tap the attachment button (📎) and select the PDF file to attach.`,
            [
              {
                text: 'Got it!',
                style: 'default'
              }
            ]
          );
        }, 2000);
        
        return true;
      } else {
        console.log('⚠️ SecureSharing: Cannot open Gmail URL, trying fallback...');
        
        // Fallback: Use expo-sharing to show sharing dialog
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(shareableUri, {
            mimeType: 'application/pdf',
            dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
          });
          console.log('✅ SecureSharing: File shared via expo-sharing fallback');
          return true;
        } else {
          throw new Error('Sharing not available');
        }
      }
    } catch (error) {
      console.error('❌ SecureSharing: Failed to share to Gmail:', error);
      
      // Show error alert
      Alert.alert(
        '❌ Error',
        `Failed to open Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [
          {
            text: 'OK',
            style: 'default'
          }
        ]
      );
      
      return false;
    }
  }
}
