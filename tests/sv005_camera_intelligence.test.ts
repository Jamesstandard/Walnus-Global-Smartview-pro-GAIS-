import { detectDeviceCapabilities } from '../src/lib/cameraCapabilityService';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSv005Tests() {
  console.log('\n================================================================================');
  console.log('         SMARTVIEW PRO™ SV-005 CAMERA INTELLIGENCE & HUD TESTS                  ');
  console.log('================================================================================');

  const report = await detectDeviceCapabilities();
  assert(report !== undefined, 'Capability report defined');
  assert(report.deviceTier !== undefined, 'Device tier defined');
  assert(['HIGH', 'MID', 'ENTRY'].includes(report.deviceTier), 'Valid device tier');
  assert(report.recommendedResolution.width > 0, 'Resolution width valid');
  assert(report.recommendedResolution.height > 0, 'Resolution height valid');
  assert(typeof report.targetFps === 'number', 'Target FPS is number');
  assert(typeof report.enableAdvancedHud === 'boolean', 'enableAdvancedHud is boolean');

  console.log(`[PASS] Detected Device Tier: ${report.deviceTier}`);
  console.log(`[PASS] Recommended Resolution: ${report.recommendedResolution.width}x${report.recommendedResolution.height}`);
  console.log(`[PASS] Target FPS: ${report.targetFps}`);
  console.log(`[PASS] Advanced HUD Enabled: ${report.enableAdvancedHud}`);
  console.log('================================================================================\n');
}

runSv005Tests();
