const fs = require('fs');
const parser = require('@babel/parser');
const files = ['src/services/smartNotificationEngine.js','src/services/smartNotifications.ts','src/services/reminderNotifications.js','src/screens/SmartNotificationsScreen.tsx','src/navigation/AppNavigator.js','src/providers/AppController.js','components/Medications.js'];
for (const file of files) { parser.parse(fs.readFileSync(file,'utf8'), {sourceType:'module',plugins:['jsx','typescript']}); console.log('Syntax OK:', file); }
JSON.parse(fs.readFileSync('app.json','utf8'));
JSON.parse(fs.readFileSync('package.json','utf8'));
