const fs=require('fs');
const p=JSON.parse(fs.readFileSync('package.json','utf8'));p.dependencies['expo-task-manager']='~13.1.6';p.dependencies['expo-background-fetch']='~13.1.6';fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');
