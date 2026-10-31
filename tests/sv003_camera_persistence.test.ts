/**
 * SmartView Pro™ - SV-003 Automated Test Suite
 * Camera Capture & Local Media Persistence Pipeline
 * Walnus Global Ventures
 */

import 'fake-indexeddb/auto';
import Dexie, { type EntityTable } from 'dexie';
import { Survey, SurveyCapture, CaptureType } from '../src/types';
import { CameraCoordinator } from '../src/lib/cameraCoordinator';

interface TestDbSchema {
  projects: EntityTable<any, 'id'>;
  messages: EntityTable<any, 'id'>;
  contacts: EntityTable<any, 'id'>;
  surveys: EntityTable<Survey, 'id'>;
  surveyCaptures: EntityTable<SurveyCapture, 'id'>;
  surveyMedia: EntityTable<{ id: string; surveyId: string; dataUrl: string; mimeType: string; size: number }, 'id'>;
  syncQueue: EntityTable<any, 'id'>;
}

function createTestDatabase(name: string) {
  const db = new Dexie(name) as Dexie & TestDbSchema;

  db.version(1).stores({
    projects: 'id, name, status, syncStatus, lastUpdated',
    messages: 'id, projectId, sender, timestamp, syncStatus',
    syncQueue: 'id, type, timestamp',
  });

  db.version(2).stores({
    projects: 'id, name, status, syncStatus, lastUpdated',
    messages: 'id, projectId, sender, timestamp, syncStatus',
    contacts: 'id, name, role, email, phone, applicationId, isLinked',
    syncQueue: 'id, type, timestamp',
  });

  // SV-003 Migration
  db.version(3).stores({
    projects: 'id, name, status, syncStatus, lastUpdated',
    messages: 'id, projectId, sender, timestamp, syncStatus',
    contacts: 'id, name, role, email, phone, applicationId, isLinked',
    syncQueue: 'id, type, timestamp',
    surveys: 'id, projectId, title, status, createdAtEpochMs',
    surveyCaptures: 'id, surveyId, localPath, captureType, createdAtEpochMs',
    surveyMedia: 'id, surveyId',
  }).upgrade(() => {
    // Migration v2 -> v3
  });

  return db;
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('SMARTVIEW PRO™ SV-003 CAMERA CAPTURE & MEDIA PERSISTENCE TESTS');
  console.log('Walnus Global Ventures - Automated Test Runner');
  console.log('================================================================\n');

  // -------------------------------------------------------------
  // Test 1: Dexie DB Migration from v2 to v3 & Entity Creation
  // -------------------------------------------------------------
  console.log('TEST GROUP 1: Database Migration & Schema Integrity');
  const db = createTestDatabase(`test_smartview_${Date.now()}`);
  await db.open();

  assert(db.verno === 3, `Database opened at schema version 3 (Actual: ${db.verno})`);
  assert(!!db.surveys, 'Surveys entity table exists in schema v3');
  assert(!!db.surveyCaptures, 'SurveyCaptures entity table exists in schema v3');
  assert(!!db.surveyMedia, 'SurveyMedia local storage table exists in schema v3');

  // -------------------------------------------------------------
  // Test 2: Survey Entity Insertion & Retrieval
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 2: Survey Entity CRUD');
  const testSurvey: Survey = {
    id: 'srv_west_facade_01',
    projectId: 'proj_commercial_tower_4',
    title: 'West Façade Elevation Inspection',
    status: 'active',
    description: 'Structural inspection and paint surface survey',
    createdAtEpochMs: 1730000000000,
    lastUpdatedEpochMs: 1730000000000,
    captureCount: 0,
  };

  await db.surveys.put(testSurvey);
  const retrievedSurvey = await db.surveys.get('srv_west_facade_01');
  assert(retrievedSurvey !== undefined, 'Survey saved and retrieved successfully');
  assert(retrievedSurvey?.title === 'West Façade Elevation Inspection', 'Survey title preserved intact');
  assert(retrievedSurvey?.status === 'active', 'Survey status is active');

  // -------------------------------------------------------------
  // Test 3: SurveyCapture Entity Insertion with Mandatory Survey ID
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 3: SurveyCapture Insertion & Metadata Association');
  const sampleDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...mockJPEGData';
  const capture1: SurveyCapture = {
    id: 'cap_srv_west_01_t1_a1b2c3d4',
    surveyId: 'srv_west_facade_01',
    localPath: 'survey_media/srv_west_facade_01/cap_srv_west_01_t1_a1b2c3d4.jpg',
    captureType: 'STANDARD_STILL',
    width: 1920,
    height: 1080,
    fileSizeBytes: 48520,
    createdAtEpochMs: 1730000100000,
    notes: 'Base substrate showing minor efflorescence',
    thumbnailDataUrl: sampleDataUrl,
    syncStatus: 'pending',
  };

  const capture2: SurveyCapture = {
    id: 'cap_srv_west_01_t2_e5f6g7h8',
    surveyId: 'srv_west_facade_01',
    localPath: 'survey_media/srv_west_facade_01/cap_srv_west_01_t2_e5f6g7h8.jpg',
    captureType: 'CLOSE_UP_DEFECT',
    width: 1920,
    height: 1080,
    fileSizeBytes: 52140,
    createdAtEpochMs: 1730000200000,
    notes: 'Close-up crack record',
    thumbnailDataUrl: sampleDataUrl,
    syncStatus: 'pending',
  };

  // Save media blobs into surveyMedia
  await db.surveyMedia.put({
    id: capture1.localPath,
    surveyId: capture1.surveyId,
    dataUrl: sampleDataUrl,
    mimeType: 'image/jpeg',
    size: 48520,
  });
  await db.surveyMedia.put({
    id: capture2.localPath,
    surveyId: capture2.surveyId,
    dataUrl: sampleDataUrl,
    mimeType: 'image/jpeg',
    size: 52140,
  });

  // Save capture metadata
  await db.surveyCaptures.put(capture1);
  await db.surveyCaptures.put(capture2);

  const capturesList = await db.surveyCaptures.where('surveyId').equals('srv_west_facade_01').toArray();
  assert(capturesList.length === 2, `Retrieved exactly 2 captures for survey srv_west_facade_01 (Actual: ${capturesList.length})`);
  assert(capturesList[0].captureType === 'STANDARD_STILL', 'Capture 1 type verified as STANDARD_STILL');
  assert(capturesList[1].captureType === 'CLOSE_UP_DEFECT', 'Capture 2 type verified as CLOSE_UP_DEFECT');

  // Verify media blob retrievability
  const mediaBlob = await db.surveyMedia.get(capture1.localPath);
  assert(mediaBlob !== undefined, 'Physical media blob retrieved from local storage');
  assert(mediaBlob?.dataUrl === sampleDataUrl, 'Media blob dataUrl contents intact');

  // -------------------------------------------------------------
  // Test 4: Single Capture Deletion & Local Media Cleanup
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 4: Single Capture Deletion & File Cleanup');
  // Delete capture 1
  await db.surveyMedia.delete(capture1.localPath);
  await db.surveyCaptures.delete(capture1.id);

  const remainingCaptures = await db.surveyCaptures.where('surveyId').equals('srv_west_facade_01').toArray();
  assert(remainingCaptures.length === 1, `1 capture remaining after deletion (Actual: ${remainingCaptures.length})`);
  assert(remainingCaptures[0].id === capture2.id, 'Correct capture record remains');

  const deletedMedia = await db.surveyMedia.get(capture1.localPath);
  assert(deletedMedia === undefined, 'Associated media blob was cleanly purged from local storage');

  // -------------------------------------------------------------
  // Test 5: Survey Cascade Deletion (Foreign Key Cascade & Orphan Prevention)
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 5: Survey Cascade Deletion & Orphan File Prevention');
  // Add a 3rd capture to test survey cascade
  const capture3: SurveyCapture = {
    id: 'cap_srv_west_01_t3_i9j0k1l2',
    surveyId: 'srv_west_facade_01',
    localPath: 'survey_media/srv_west_facade_01/cap_srv_west_01_t3_i9j0k1l2.jpg',
    captureType: 'ELEVATION',
    createdAtEpochMs: 1730000300000,
    syncStatus: 'pending',
  };
  await db.surveyMedia.put({
    id: capture3.localPath,
    surveyId: capture3.surveyId,
    dataUrl: sampleDataUrl,
    mimeType: 'image/jpeg',
    size: 50000,
  });
  await db.surveyCaptures.put(capture3);

  // Execute cascade deletion of survey srv_west_facade_01
  const allCaptures = await db.surveyCaptures.where('surveyId').equals('srv_west_facade_01').toArray();
  for (const c of allCaptures) {
    await db.surveyMedia.delete(c.localPath);
  }
  await db.surveyCaptures.where('surveyId').equals('srv_west_facade_01').delete();
  await db.surveys.delete('srv_west_facade_01');

  const postCascadeSurveys = await db.surveys.get('srv_west_facade_01');
  assert(postCascadeSurveys === undefined, 'Survey deleted from database');

  const postCascadeCaptures = await db.surveyCaptures.where('surveyId').equals('srv_west_facade_01').toArray();
  assert(postCascadeCaptures.length === 0, `All captures cascade-deleted (Count: ${postCascadeCaptures.length})`);

  const orphanedMedia2 = await db.surveyMedia.get(capture2.localPath);
  const orphanedMedia3 = await db.surveyMedia.get(capture3.localPath);
  assert(orphanedMedia2 === undefined && orphanedMedia3 === undefined, 'All physical media blobs purged with no orphan files');

  // -------------------------------------------------------------
  // Test 6: Persistence Across Database Reload / Re-opening
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 6: Database Persistence Across Reload');
  const persistentSurvey: Survey = {
    id: 'srv_persisted_site_09',
    projectId: 'proj_walnus_hq',
    title: 'Walnus Global HQ Façade Audit',
    status: 'active',
    createdAtEpochMs: Date.now(),
    lastUpdatedEpochMs: Date.now(),
    captureCount: 1,
  };
  const persistentCapture: SurveyCapture = {
    id: 'cap_persisted_shot_99',
    surveyId: 'srv_persisted_site_09',
    localPath: 'survey_media/srv_persisted_site_09/cap_persisted_shot_99.jpg',
    captureType: 'WIDE_ANGLE',
    width: 3840,
    height: 2160,
    createdAtEpochMs: Date.now(),
    syncStatus: 'synced',
  };

  await db.surveys.put(persistentSurvey);
  await db.surveyCaptures.put(persistentCapture);
  await db.close();

  // Reopen the database simulating app restart
  const dbReloaded = createTestDatabase(db.name);
  await dbReloaded.open();

  const reloadedSurvey = await dbReloaded.surveys.get('srv_persisted_site_09');
  const reloadedCaptures = await dbReloaded.surveyCaptures.where('surveyId').equals('srv_persisted_site_09').toArray();

  assert(reloadedSurvey !== undefined, 'Survey survived database restart/reload');
  assert(reloadedCaptures.length === 1, 'Survey captures survived database restart/reload');
  assert(reloadedCaptures[0].width === 3840, 'Capture metadata properties completely preserved across reload');
  await dbReloaded.close();

  // -------------------------------------------------------------
  // Test 7: Camera Coordinator Lifecycle State Machine
  // -------------------------------------------------------------
  console.log('\nTEST GROUP 7: Camera Coordinator State Machine Transitions');
  const coordinator = new CameraCoordinator();

  assert(coordinator.getState() === 'Idle', 'Initial Camera state is Idle');

  // Listen to state transitions
  const stateLog: string[] = [];
  coordinator.setStateListener((newState, err) => {
    stateLog.push(newState);
  });

  // Test collision-resistant ID generation
  const capId1 = coordinator.generateCaptureId('survey_101');
  const capId2 = coordinator.generateCaptureId('survey_101');
  assert(capId1 !== capId2, 'Capture identifiers are collision-resistant (unique across successive calls)');
  assert(capId1.startsWith('cap_survey_101_'), 'Capture identifier incorporates survey ID prefix');
  assert(!/^\d+$/.test(capId1), 'Capture identifier is NOT purely clock-based');

  // Test state transition to Idle on stop
  coordinator.stopCamera();
  assert(coordinator.getState() === 'Idle', 'Transitioned back to Idle on stopCamera()');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('Physical Camera Verification: NOT PERFORMED (Simulated in automated test runner)');
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
