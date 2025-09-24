import { Platform, Linking, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
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

export class CustomSharing {
  /**
   * Share to Gmail directly with file attachment
   */
  static async shareToGmail(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📧 CustomSharing: Attempting to share to Gmail...');
      console.log('📧 File URI:', options.fileUri);
      console.log('📧 Doctor email:', doctor.email);

      if (!doctor.email) {
        throw new Error('Doctor email not available');
      }

      // Copy file to a more accessible location
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });

      if (Platform.OS === 'android') {
        // Try multiple Android intent approaches
        console.log('🤖 Android detected, trying multiple intent methods...');
        
        // Method 1: Try with file URI and Gmail package
        try {
          console.log('📧 Method 1: IntentLauncher with Gmail package...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: `file://${shareableUri}`,
            extra: {
              'android.intent.extra.SUBJECT': options.title || `Medical Document: ${options.fileName}`,
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.EMAIL': [doctor.email],
            },
            packageName: 'com.google.android.gm',
          });
          console.log('✅ CustomSharing: Gmail opened directly via IntentLauncher (Method 1)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 1 failed:', intentError);
        }
        
        // Method 2: Try without file:// prefix
        try {
          console.log('📧 Method 2: IntentLauncher without file:// prefix...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.SUBJECT': options.title || `Medical Document: ${options.fileName}`,
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.EMAIL': [doctor.email],
            },
            packageName: 'com.google.android.gm',
          });
          console.log('✅ CustomSharing: Gmail opened directly via IntentLauncher (Method 2)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 2 failed:', intentError);
        }
        
        // Method 3: Try without package restriction
        try {
          console.log('📧 Method 3: IntentLauncher without package restriction...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.SUBJECT': options.title || `Medical Document: ${options.fileName}`,
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.EMAIL': [doctor.email],
            },
          });
          console.log('✅ CustomSharing: Gmail opened without package restriction (Method 3)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 3 failed:', intentError);
        }
        
        // Method 4: Try with content:// URI
        try {
          console.log('📧 Method 4: IntentLauncher with content:// URI...');
          const contentUri = shareableUri.replace('file://', 'content://');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: contentUri,
            extra: {
              'android.intent.extra.SUBJECT': options.title || `Medical Document: ${options.fileName}`,
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.EMAIL': [doctor.email],
            },
            packageName: 'com.google.android.gm',
          });
          console.log('✅ CustomSharing: Gmail opened with content:// URI (Method 4)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 4 failed:', intentError);
        }
      }

      // Fallback to expo-sharing
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(shareableUri, {
            mimeType: options.mimeType || 'application/pdf',
            dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
          });
          console.log('✅ CustomSharing: Gmail opened via expo-sharing');
          return true;
        }
      } catch (sharingError) {
        console.log('⚠️ CustomSharing: expo-sharing failed:', sharingError);
      }

      // Final fallback to Share.share
      const shareResult = await Share.share({
        url: shareableUri,
        title: options.title || `Medical Document: ${options.fileName}`,
        message: options.message,
      });

      if (shareResult.action === Share.sharedAction) {
        console.log('✅ CustomSharing: Gmail opened via Share.share');
        return true;
      }

      throw new Error('All sharing methods failed');
    } catch (error) {
      console.error('❌ CustomSharing: Failed to share to Gmail:', error);
      return false;
    }
  }

  /**
   * Share to WhatsApp directly with file attachment
   */
  static async shareToWhatsApp(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📱 CustomSharing: Attempting to share to WhatsApp...');
      console.log('📱 File URI:', options.fileUri);
      console.log('📱 Doctor phone:', doctor.phoneNumber);

      if (!doctor.phoneNumber) {
        throw new Error('Doctor phone number not available');
      }

      // Copy file to a more accessible location
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });

      if (Platform.OS === 'android') {
        console.log('🤖 Android detected, trying WhatsApp-specific methods...');
        console.log('📱 Shareable URI:', shareableUri);
        console.log('📱 Doctor phone:', doctor.phoneNumber);
        console.log('📱 Message:', options.message);
        
        // Method 1: Try using generic Android intent to show WhatsApp in sharing dialog
        try {
          console.log('📱 Method 1: Generic Android intent to show WhatsApp in sharing dialog...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          
          // Use generic SEND intent without package targeting to show WhatsApp as option
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': `${options.message}\n\nPhone: ${phoneNumber}`,
              'android.intent.extra.SUBJECT': `Medical Document: ${options.fileName}`,
            },
          });
          console.log('✅ CustomSharing: Sharing dialog opened with WhatsApp option (Method 1)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 1 failed:', intentError);
        }
        
        // Method 2: Try using a more direct Android intent approach with WhatsApp package
        try {
          console.log('📱 Method 2: Direct Android intent with WhatsApp package...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          
          // Try to use IntentLauncher with a more direct approach
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': `${options.message}\n\nPhone: ${phoneNumber}`,
              'android.intent.extra.SUBJECT': `Medical Document: ${options.fileName}`,
            },
            packageName: 'com.whatsapp',
          });
          console.log('✅ CustomSharing: WhatsApp opened directly with file (Method 2)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 2 failed:', intentError);
        }
        
        // Method 3: Try using expo-sharing directly
        try {
          console.log('📱 Method 3: Using expo-sharing directly...');
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(shareableUri, {
              mimeType: 'application/pdf',
              dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
            });
            console.log('✅ CustomSharing: File shared via expo-sharing (Method 3)');
            return true;
          } else {
            console.log('⚠️ CustomSharing: expo-sharing not available');
          }
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 3 failed:', intentError);
        }
        
        // Method 4: Try opening WhatsApp to doctor's chat with message
        try {
          console.log('📱 Method 4: Opening WhatsApp to doctor chat with message...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
          console.log('📱 WhatsApp URL:', whatsappUrl);
          
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          console.log('📱 Can open WhatsApp URL:', canOpen);
          
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
            console.log('✅ CustomSharing: WhatsApp opened to doctor chat (Method 4)');
            
            // Show an alert to guide the user to attach the file
            setTimeout(() => {
              Alert.alert(
                '📎 Attach File',
                'WhatsApp is now open to your doctor\'s chat. Please tap the attachment button (📎) and select "Document" to attach the PDF file.',
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
            console.log('⚠️ CustomSharing: Cannot open WhatsApp URL');
          }
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 4 failed:', intentError);
        }
        
        // Method 5: Try using IntentLauncher with specific WhatsApp targeting
        try {
          console.log('📱 Method 5: IntentLauncher with WhatsApp package targeting...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': options.message,
            },
            packageName: 'com.whatsapp',
          });
          console.log('✅ CustomSharing: WhatsApp opened directly via IntentLauncher (Method 2)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 2 failed:', intentError);
        }
        
        // Method 3: Try opening WhatsApp to doctor's chat first, then share file
        try {
          console.log('📱 Method 3: Opening WhatsApp to doctor chat, then sharing file...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
          
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            console.log('📱 Opening WhatsApp to doctor chat...');
            await Linking.openURL(whatsappUrl);
            
            // Wait a moment, then try to share the file
            setTimeout(async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(shareableUri, {
                    mimeType: options.mimeType || 'application/pdf',
                    dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
                  });
                  console.log('✅ CustomSharing: File shared to WhatsApp after opening chat (Method 3)');
                }
              } catch (error) {
                console.log('⚠️ CustomSharing: Failed to share file after opening WhatsApp:', error);
              }
            }, 3000);
            
            console.log('✅ CustomSharing: WhatsApp opened to doctor chat (Method 3)');
            return true;
          } else {
            console.log('⚠️ CustomSharing: Cannot open WhatsApp URL');
          }
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 3 failed:', intentError);
        }
        
        // Method 4: Try a simpler approach - just open WhatsApp to doctor's chat
        try {
          console.log('📱 Method 4: Simple WhatsApp chat opening...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(options.message)}`;
          
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            await Linking.openURL(whatsappUrl);
            console.log('✅ CustomSharing: WhatsApp opened to doctor chat with message (Method 4)');
            
            // Show an alert to guide the user to attach the file
            setTimeout(() => {
              Alert.alert(
                '📎 Attach File',
                'WhatsApp is now open to your doctor\'s chat. Please tap the attachment button (📎) and select "Document" to attach the PDF file.',
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
            console.log('⚠️ CustomSharing: Cannot open WhatsApp URL');
          }
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 4 failed:', intentError);
        }
        
        // Method 5: Try using a different approach - open WhatsApp first, then share file
        try {
          console.log('📱 Method 5: Open WhatsApp first, then share file...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
          
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          if (canOpen) {
            // Open WhatsApp first
            await Linking.openURL(whatsappUrl);
            console.log('📱 WhatsApp opened, now trying to share file...');
            
            // Wait a moment, then try to share the file
            setTimeout(async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(shareableUri, {
                    mimeType: options.mimeType || 'application/pdf',
                    dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
                  });
                  console.log('✅ CustomSharing: File shared after opening WhatsApp (Method 5)');
                }
              } catch (error) {
                console.log('⚠️ CustomSharing: Failed to share file after opening WhatsApp:', error);
              }
            }, 3000);
            
            console.log('✅ CustomSharing: WhatsApp opened, file sharing initiated (Method 5)');
            return true;
          } else {
            console.log('⚠️ CustomSharing: Cannot open WhatsApp URL');
          }
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 5 failed:', intentError);
        }
        
        // Method 6: Try using IntentLauncher without package restriction
        try {
          console.log('📱 Method 6: IntentLauncher without package restriction...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': options.message,
            },
          });
          console.log('✅ CustomSharing: WhatsApp opened without package restriction (Method 6)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 6 failed:', intentError);
        }
        
        // Method 7: Try with file:// prefix
        try {
          console.log('📱 Method 7: IntentLauncher with file:// prefix...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: options.mimeType || 'application/pdf',
            data: `file://${shareableUri}`,
            extra: {
              'android.intent.extra.TEXT': options.message,
            },
          });
          console.log('✅ CustomSharing: WhatsApp opened with file:// prefix (Method 7)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 7 failed:', intentError);
        }
        
        // Method 8: Try with different MIME type
        try {
          console.log('📱 Method 8: IntentLauncher with different MIME type...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: 'application/octet-stream',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': options.message,
            },
          });
          console.log('✅ CustomSharing: WhatsApp opened with octet-stream MIME (Method 8)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 8 failed:', intentError);
        }
        
        // Method 9: Try with SEND_MULTIPLE action
        try {
          console.log('📱 Method 9: IntentLauncher with SEND_MULTIPLE action...');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND_MULTIPLE', {
            type: options.mimeType || 'application/pdf',
            data: shareableUri,
            extra: {
              'android.intent.extra.TEXT': options.message,
            },
          });
          console.log('✅ CustomSharing: WhatsApp opened with SEND_MULTIPLE (Method 9)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 9 failed:', intentError);
        }
        
        // Method 10: Try with a different approach - using SENDTO with WhatsApp data
        try {
          console.log('📱 Method 10: IntentLauncher with SENDTO and WhatsApp data...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          await IntentLauncher.startActivityAsync('android.intent.action.SENDTO', {
            data: `whatsapp://send?phone=${phoneNumber}`,
            extra: {
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.STREAM': shareableUri,
            },
            packageName: 'com.whatsapp',
          });
          console.log('✅ CustomSharing: WhatsApp opened with SENDTO (Method 10)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 10 failed:', intentError);
        }
        
        // Method 11: Try with a different approach - using SENDTO without package
        try {
          console.log('📱 Method 11: IntentLauncher with SENDTO without package...');
          const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
          await IntentLauncher.startActivityAsync('android.intent.action.SENDTO', {
            data: `whatsapp://send?phone=${phoneNumber}`,
            extra: {
              'android.intent.extra.TEXT': options.message,
              'android.intent.extra.STREAM': shareableUri,
            },
          });
          console.log('✅ CustomSharing: WhatsApp opened with SENDTO without package (Method 11)');
          return true;
        } catch (intentError) {
          console.log('⚠️ CustomSharing: Method 11 failed:', intentError);
        }
      }

      // Method 12: Try using Share.share with WhatsApp-specific message
      try {
        console.log('📱 Method 12: Share.share with WhatsApp-specific message...');
        const shareResult = await Share.share({
          url: shareableUri,
          title: options.title || `Medical Document: ${options.fileName}`,
          message: `${options.message}\n\nWhatsApp: ${doctor.phoneNumber}`,
        });

        if (shareResult.action === Share.sharedAction) {
          console.log('✅ CustomSharing: WhatsApp opened via Share.share (Method 11)');
          return true;
        }
      } catch (shareError) {
        console.log('⚠️ CustomSharing: Method 11 failed:', shareError);
      }

      // Fallback to expo-sharing
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(shareableUri, {
            mimeType: options.mimeType || 'application/pdf',
            dialogTitle: `Share Medical Document with Dr. ${doctor.name} via WhatsApp`,
          });
          console.log('✅ CustomSharing: WhatsApp opened via expo-sharing');
          return true;
        }
      } catch (sharingError) {
        console.log('⚠️ CustomSharing: expo-sharing failed:', sharingError);
      }

      // Final fallback to Share.share
      const shareResult = await Share.share({
        url: shareableUri,
        title: options.title || `Medical Document: ${options.fileName}`,
        message: options.message,
      });

      if (shareResult.action === Share.sharedAction) {
        console.log('✅ CustomSharing: WhatsApp opened via Share.share');
        return true;
      }

      throw new Error('All sharing methods failed');
    } catch (error) {
      console.error('❌ CustomSharing: Failed to share to WhatsApp:', error);
      return false;
    }
  }

  /**
   * Share to WhatsApp with direct contact opening
   */
  static async shareToWhatsAppWithContact(options: ShareOptions, doctor: DoctorContact): Promise<boolean> {
    try {
      console.log('📱 CustomSharing: Attempting to share to WhatsApp with contact...');
      console.log('📱 File URI:', options.fileUri);
      console.log('📱 Doctor phone:', doctor.phoneNumber);

      if (!doctor.phoneNumber) {
        throw new Error('Doctor phone number not available');
      }

      // Copy file to a more accessible location
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });

      // Parse phone number
      const phoneNumber = doctor.phoneNumber.replace(/\D/g, '');
      
      if (Platform.OS === 'android') {
        // Try to open WhatsApp directly to the contact first
        try {
          const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
          const canOpen = await Linking.canOpenURL(whatsappUrl);
          
          if (canOpen) {
            console.log('📱 CustomSharing: Opening WhatsApp to contact...');
            await Linking.openURL(whatsappUrl);
            
            // Wait a moment, then try to share the file
            setTimeout(async () => {
              try {
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                  await Sharing.shareAsync(shareableUri, {
                    mimeType: options.mimeType || 'application/pdf',
                    dialogTitle: `Share Medical Document with Dr. ${doctor.name}`,
                  });
                  console.log('✅ CustomSharing: File shared to WhatsApp after opening contact');
                }
              } catch (error) {
                console.log('⚠️ CustomSharing: Failed to share file after opening WhatsApp:', error);
              }
            }, 2000);
            
            console.log('✅ CustomSharing: WhatsApp opened to contact');
            return true;
          }
        } catch (contactError) {
          console.log('⚠️ CustomSharing: Failed to open WhatsApp to contact:', contactError);
        }
      }

      // Fallback to regular WhatsApp sharing
      return await this.shareToWhatsApp(options, doctor);
    } catch (error) {
      console.error('❌ CustomSharing: Failed to share to WhatsApp with contact:', error);
      return false;
    }
  }

  /**
   * Generic sharing with file attachment
   */
  static async shareGeneric(options: ShareOptions): Promise<boolean> {
    try {
      console.log('📤 CustomSharing: Attempting generic sharing...');
      console.log('📤 File URI:', options.fileUri);

      // Copy file to a more accessible location
      const shareableUri = `${FileSystem.documentDirectory}${options.fileName}_${Date.now()}.pdf`;
      await FileSystem.copyAsync({
        from: options.fileUri,
        to: shareableUri,
      });

      // Try expo-sharing first
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(shareableUri, {
            mimeType: options.mimeType || 'application/pdf',
            dialogTitle: options.title || `Share ${options.fileName}`,
          });
          console.log('✅ CustomSharing: Generic sharing via expo-sharing');
          return true;
        }
      } catch (sharingError) {
        console.log('⚠️ CustomSharing: expo-sharing failed:', sharingError);
      }

      // Fallback to Share.share
      const shareResult = await Share.share({
        url: shareableUri,
        title: options.title || `Medical Document: ${options.fileName}`,
        message: options.message,
      });

      if (shareResult.action === Share.sharedAction) {
        console.log('✅ CustomSharing: Generic sharing via Share.share');
        return true;
      }

      throw new Error('All sharing methods failed');
    } catch (error) {
      console.error('❌ CustomSharing: Failed to share generically:', error);
      return false;
    }
  }
}

export default CustomSharing;
