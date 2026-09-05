import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const targetArg = process.argv[2] || 'staff';
const isStaff = targetArg.toLowerCase() === 'staff';

const config = {
  appId: isStaff ? 'com.genz.retail.staff' : 'com.genz.retail.admin',
  appName: isStaff ? 'Strap Staff' : 'Strap Accounting',
  targetEnv: isStaff ? 'STAFF' : 'ALL',
  outputApk: isStaff ? 'Strap-Staff.apk' : 'Strap-Accounting.apk'
};

console.log(`\n======================================================`);
console.log(`🚀 Building Separate APK: [${config.appName}]`);
console.log(`📌 Package ID: ${config.appId}`);
console.log(`======================================================\n`);

try {
  // 1. Update capacitor.config.json
  const capConfigPath = path.resolve('capacitor.config.json');
  const capConfig = JSON.parse(fs.readFileSync(capConfigPath, 'utf8'));
  capConfig.appId = config.appId;
  capConfig.appName = config.appName;
  fs.writeFileSync(capConfigPath, JSON.stringify(capConfig, null, 2));

  // 2. Update android/app/build.gradle
  const buildGradlePath = path.resolve('android/app/build.gradle');
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  gradleContent = gradleContent.replace(/namespace = ".*?"/, `namespace = "${config.appId}"`);
  gradleContent = gradleContent.replace(/applicationId ".*?"/, `applicationId "${config.appId}"`);
  fs.writeFileSync(buildGradlePath, gradleContent);

  // 3. Update android/app/src/main/res/values/strings.xml
  const stringsPath = path.resolve('android/app/src/main/res/values/strings.xml');
  let stringsContent = fs.readFileSync(stringsPath, 'utf8');
  stringsContent = stringsContent.replace(/<string name="app_name">.*?<\/string>/, `<string name="app_name">${config.appName}</string>`);
  stringsContent = stringsContent.replace(/<string name="title_activity_main">.*?<\/string>/, `<string name="title_activity_main">${config.appName}</string>`);
  stringsContent = stringsContent.replace(/<string name="package_name">.*?<\/string>/, `<string name="package_name">${config.appId}</string>`);
  stringsContent = stringsContent.replace(/<string name="custom_url_scheme">.*?<\/string>/, `<string name="custom_url_scheme">${config.appId}</string>`);
  fs.writeFileSync(stringsPath, stringsContent);

  // 4. Run Vite build with environment variable
  console.log(`📦 Building web assets (VITE_APP_TARGET=${config.targetEnv})...`);
  execSync(`VITE_APP_TARGET=${config.targetEnv} npm run build`, { stdio: 'inherit' });

  // 5. Sync Capacitor Android
  console.log(`🔄 Syncing Capacitor Android assets...`);
  execSync(`npx cap sync android`, { stdio: 'inherit' });

  // 6. Build Gradle APK
  console.log(`🔨 Compiling Android APK with Gradle...`);
  execSync(`cd android && ./gradlew assembleDebug`, { stdio: 'inherit' });

  // 7. Copy output APK
  const debugApkPath = path.resolve('android/app/build/outputs/apk/debug/app-debug.apk');
  const targetApkPath = path.resolve(config.outputApk);
  fs.copyFileSync(debugApkPath, targetApkPath);

  console.log(`\n🎉 SUCCESS! Created ${config.outputApk}`);
  console.log(`👉 App Name: "${config.appName}"`);
  console.log(`👉 Android Package ID: "${config.appId}"\n`);
} catch (err) {
  console.error(`❌ Build failed:`, err);
  process.exit(1);
}
