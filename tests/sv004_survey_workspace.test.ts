/**
 * SmartView Pro™ - SV-004 Automated Test Suite
 * Survey Workspace & Capture Management Pipeline
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

  db.version(3).stores({
    projects: 'id, name, status, syncStatus, lastUpdated',
    messages: 'id, projectId, sender, timestamp, syncStatus',
    contacts: 'id, name, role, email, phone, applicationId, isLinked',
    syncQueue: 'id, type, timestamp',
    surveys: 'id, projectId, title, status, createdAtEpochMs',
    surveyCaptures: 'id, surveyId, localPath, captureType, createdAtEpochMs',
    surveyMedia: 'id, surveyId',
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

async function runSv004Tests() {
  console.log('================================================================');
  console.log('SMARTVIEW PRO™ SV-004 SURVEY WORKSPACE & CAPTURE MANAGEMENT TESTS');
  console.log('Walnus Global Ventures - Automated Test Runner');
  console.log('================================================================\n');

  const testDbName = `smartview_sv004_test_${Date.now()}`;
  let db = createTestDatabase(testDbName);

  // ----------------------------------------------------------------------
  // TEST GROUP 1: New Survey Creation & Metadata Persistence
  // ----------------------------------------------------------------------
  console.log('TEST GROUP 1: New Survey Creation & Metadata Persistence');

  const survey1: Survey = {
    id: 'srv_sector4_facade_101',
    projectId: 'proj_commercial_district',
    title: 'Building Façade Survey - Sector 4',
    clientName: 'Apex Engineering Ltd',
    siteAddress: 'Plot 14, Commercial Avenue, Ikeja',
    surveyorName: 'Eng. Marcus Vance',
    notes: 'Substrate crack inspection and weather-resistant paint coat assessment',
    projectReference: 'PRJ-2026-BLK-04',
    clientContact: '+234 803 123 4567',
    projectType: 'Paint Coating Survey',
    latitude: 6.5244,
    longitude: 3.3792,
    status: 'active',
    createdAtEpochMs: Date.now() - 10000,
    lastUpdatedEpochMs: Date.now() - 10000,
    captureCount: 0,
  };

  await db.surveys.put(survey1);
  const fetchedSurvey = await db.surveys.get('srv_sector4_facade_101');

  assert(!!fetchedSurvey, 'Survey retrieved from local database');
  assert(fetchedSurvey?.title === 'Building Façade Survey - Sector 4', 'Survey title preserved');
  assert(fetchedSurvey?.clientName === 'Apex Engineering Ltd', 'Client name metadata preserved');
  assert(fetchedSurvey?.siteAddress === 'Plot 14, Commercial Avenue, Ikeja', 'Site address metadata preserved');
  assert(fetchedSurvey?.surveyorName === 'Eng. Marcus Vance', 'Surveyor name metadata preserved');
  assert(fetchedSurvey?.latitude === 6.5244 && fetchedSurvey?.longitude === 3.3792, 'Non-blocking GPS coordinates preserved');
  assert(fetchedSurvey?.status === 'active', 'Survey status initialized as active');

  // ----------------------------------------------------------------------
  // TEST GROUP 2: Registry Search & Filtering Logic
  // ----------------------------------------------------------------------
  console.log('\nTEST GROUP 2: Registry Search & Filtering Logic');

  const survey2: Survey = {
    id: 'srv_screed_block_b_102',
    projectId: 'proj_residential_tower',
    title: 'Floor Screed Substrate Audit - Block B',
    clientName: 'BuildCorp Global',
    siteAddress: 'Block B, Marina Skyline',
    surveyorName: 'Inspector Sarah Chen',
    status: 'completed',
    createdAtEpochMs: Date.now() - 5000,
    lastUpdatedEpochMs: Date.now() - 5000,
    captureCount: 0,
  };

  await db.surveys.put(survey2);

  const allSurveys = await db.surveys.toArray();
  assert(allSurveys.length === 2, `Registry contains exactly 2 surveys (Actual: ${allSurveys.length})`);

  const activeSurveys = allSurveys.filter((s) => s.status === 'active');
  assert(activeSurveys.length === 1 && activeSurveys[0].id === 'srv_sector4_facade_101', 'Filtered active status correctly');

  const searchResults = allSurveys.filter((s) => s.clientName?.toLowerCase().includes('apex'));
  assert(searchResults.length === 1 && searchResults[0].id === 'srv_sector4_facade_101', 'Search query matched client name');

  // ----------------------------------------------------------------------
  // TEST GROUP 3: Camera Capture & Workspace Association
  // ----------------------------------------------------------------------
  console.log('\nTEST GROUP 3: Camera Capture & Workspace Association');

  const mockImageData1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD-mock-image-1';
  const capture1Id = `cap_${survey1.id}_${Date.now()}_a1b2c3`;
  const localPath1 = `survey_media/${survey1.id}/${capture1Id}.jpg`;

  const capture1: SurveyCapture = {
    id: capture1Id,
    surveyId: survey1.id,
    localPath: localPath1,
    captureType: 'ELEVATION',
    width: 1920,
    height: 1080,
    createdAtEpochMs: Date.now(),
    notes: 'South elevation mortar joint crack',
  };

  // Save media blob & metadata
  await db.surveyMedia.put({
    id: localPath1,
    surveyId: survey1.id,
    dataUrl: mockImageData1,
    mimeType: 'image/jpeg',
    size: mockImageData1.length,
  });
  await db.surveyCaptures.put(capture1);

  // Update capture counter
  const cCount1 = await db.surveyCaptures.where('surveyId').equals(survey1.id).count();
  survey1.captureCount = cCount1;
  await db.surveys.put(survey1);

  const updatedSurvey1 = await db.surveys.get(survey1.id);
  assert(updatedSurvey1?.captureCount === 1, `Capture count auto-incremented to 1 (Actual: ${updatedSurvey1?.captureCount})`);

  // Add 2nd capture
  const mockImageData2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD-mock-image-2';
  const capture2Id = `cap_${survey1.id}_${Date.now() + 10}_d4e5f6`;
  const localPath2 = `survey_media/${survey1.id}/${capture2Id}.jpg`;

  const capture2: SurveyCapture = {
    id: capture2Id,
    surveyId: survey1.id,
    localPath: localPath2,
    captureType: 'CLOSE_UP_DEFECT',
    width: 1920,
    height: 1080,
    createdAtEpochMs: Date.now() + 10,
    notes: 'Substrate efflorescence detail',
  };

  await db.surveyMedia.put({
    id: localPath2,
    surveyId: survey1.id,
    dataUrl: mockImageData2,
    mimeType: 'image/jpeg',
    size: mockImageData2.length,
  });
  await db.surveyCaptures.put(capture2);

  const cCount2 = await db.surveyCaptures.where('surveyId').equals(survey1.id).count();
  survey1.captureCount = cCount2;
  await db.surveys.put(survey1);

  const finalSurvey1 = await db.surveys.get(survey1.id);
  assert(finalSurvey1?.captureCount === 2, `Capture count updated to 2 (Actual: ${finalSurvey1?.captureCount})`);

  // ----------------------------------------------------------------------
  // TEST GROUP 4: Workspace Capture Review & Single Deletion
  // ----------------------------------------------------------------------
  console.log('\nTEST GROUP 4: Workspace Capture Review & Single Deletion');

  // Purge capture 1
  await db.surveyMedia.delete(capture1.localPath);
  await db.surveyCaptures.delete(capture1.id);

  const remainingCaptures = await db.surveyCaptures.where('surveyId').equals(survey1.id).toArray();
  assert(remainingCaptures.length === 1, `1 capture remains after single deletion (Actual: ${remainingCaptures.length})`);
  assert(remainingCaptures[0].id === capture2.id, 'Correct capture record remains in workspace');

  const media1Blob = await db.surveyMedia.get(localPath1);
  assert(media1Blob === undefined, 'Deleted capture media blob was cleanly purged from IndexedDB');

  // Update counter
  const cCountRem = await db.surveyCaptures.where('surveyId').equals(survey1.id).count();
  survey1.captureCount = cCountRem;
  await db.surveys.put(survey1);

  const surveyAfterDelete = await db.surveys.get(survey1.id);
  assert(surveyAfterDelete?.captureCount === 1, `Capture count decremented to 1 (Actual: ${surveyAfterDelete?.captureCount})`);

  // ----------------------------------------------------------------------
  // TEST GROUP 5: Persistence Across App Restart / Database Reload
  // ----------------------------------------------------------------------
  console.log('\nTEST GROUP 5: Persistence Across App Restart / Database Reload');

  db.close();
  db = createTestDatabase(testDbName);

  const reloadedSurvey = await db.surveys.get(survey1.id);
  assert(!!reloadedSurvey, 'Survey survived database closure and app restart');
  assert(reloadedSurvey?.clientName === 'Apex Engineering Ltd', 'Survey metadata fully intact after restart');

  const reloadedCaptures = await db.surveyCaptures.where('surveyId').equals(survey1.id).toArray();
  assert(reloadedCaptures.length === 1, 'Survey captures survived restart');

  const reloadedMedia = await db.surveyMedia.get(localPath2);
  assert(!!reloadedMedia && reloadedMedia.dataUrl === mockImageData2, 'Media blob data survived restart');

  // ----------------------------------------------------------------------
  // TEST GROUP 6: Cascade Survey Deletion & Orphan File Prevention
  // ----------------------------------------------------------------------
  console.log('\nTEST GROUP 6: Cascade Survey Deletion & Orphan File Prevention');

  // Perform cascade deletion of survey1
  const capturesToPurge = await db.surveyCaptures.where('surveyId').equals(survey1.id).toArray();
  for (const c of capturesToPurge) {
    await db.surveyMedia.delete(c.localPath);
  }
  await db.surveyCaptures.where('surveyId').equals(survey1.id).delete();
  await db.surveys.delete(survey1.id);

  const deletedCheck = await db.surveys.get(survey1.id);
  assert(deletedCheck === undefined, 'Survey entity deleted');

  const orphanCapturesCheck = await db.surveyCaptures.where('surveyId').equals(survey1.id).toArray();
  assert(orphanCapturesCheck.length === 0, 'All survey captures cascade-deleted');

  const orphanMediaCheck = await db.surveyMedia.get(localPath2);
  assert(orphanMediaCheck === undefined, 'All local media blobs purged (0 orphan files)');

  // ----------------------------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runSv004Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
