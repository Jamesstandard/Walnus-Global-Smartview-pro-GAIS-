import { createDefaultVisualizationProject, WALNUS_EXTERIOR_PALETTE } from '../src/lib/surfaceVisualizationEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runSv006Tests() {
  console.log('\n================================================================================');
  console.log('         SMARTVIEW PRO™ SV-006 SURFACE SELECTION & COATING TESTS                ');
  console.log('================================================================================');

  const project = createDefaultVisualizationProject('cap_test_01', 'data:image/png;base64,fake');
  assert(project !== undefined, 'Project defined');
  assert(project.captureId === 'cap_test_01', 'Capture ID matched');
  assert(project.regions.length > 0, 'Default regions populated');
  assert(WALNUS_EXTERIOR_PALETTE.length >= 8, 'Exterior palette loaded');

  console.log(`[PASS] Visualization project initialized with ${project.regions.length} surface region(s)`);
  console.log(`[PASS] Walnus exterior palette loaded with ${WALNUS_EXTERIOR_PALETTE.length} professional colours`);
  console.log('================================================================================\n');
}

runSv006Tests();
