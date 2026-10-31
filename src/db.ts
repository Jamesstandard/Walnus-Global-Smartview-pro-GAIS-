import Dexie, { type EntityTable } from 'dexie';
import { PaintProject, ChatMessage, SiteContact, Survey, SurveyCapture } from './types';

export const db = new Dexie('PaintEcosystemDB') as Dexie & {
  projects: EntityTable<PaintProject, 'id'>;
  messages: EntityTable<ChatMessage, 'id'>;
  contacts: EntityTable<SiteContact, 'id'>;
  surveys: EntityTable<Survey, 'id'>;
  surveyCaptures: EntityTable<SurveyCapture, 'id'>;
  surveyMedia: EntityTable<{ id: string; surveyId: string; dataUrl: string; mimeType: string; size: number }, 'id'>;
  syncQueue: EntityTable<{ id: string; type: 'project' | 'message' | 'contact' | 'survey' | 'capture'; payload: any; timestamp: number }, 'id'>;
};

// Schema declaration
db.version(1).stores({
  projects: 'id, name, status, syncStatus, lastUpdated',
  messages: 'id, projectId, sender, timestamp, syncStatus',
  syncQueue: 'id, type, timestamp'
});

db.version(2).stores({
  projects: 'id, name, status, syncStatus, lastUpdated',
  messages: 'id, projectId, sender, timestamp, syncStatus',
  contacts: 'id, name, role, email, phone, applicationId, isLinked',
  syncQueue: 'id, type, timestamp'
});

// Milestone SV-003: Camera Acquisition & Local Media Persistence Schema
db.version(3).stores({
  projects: 'id, name, status, syncStatus, lastUpdated',
  messages: 'id, projectId, sender, timestamp, syncStatus',
  contacts: 'id, name, role, email, phone, applicationId, isLinked',
  syncQueue: 'id, type, timestamp',
  surveys: 'id, projectId, title, status, createdAtEpochMs',
  surveyCaptures: 'id, surveyId, localPath, captureType, createdAtEpochMs',
  surveyMedia: 'id, surveyId'
}).upgrade(async () => {
  // Explicit migration log from v2 to v3
  console.info('[Dexie DB Migration v2->v3] Migrating smartview database: added surveys, survey_captures, and local media tables');
});

export const saveContactOffline = async (contact: SiteContact) => {
  await db.contacts.put(contact);
  await db.syncQueue.put({ id: `contact_${contact.id}`, type: 'contact', payload: contact, timestamp: Date.now() });
};

export const saveProjectOffline = async (project: PaintProject) => {
  project.syncStatus = 'pending';
  project.lastUpdated = Date.now();
  await db.projects.put(project);
  await db.syncQueue.put({ id: `proj_${project.id}`, type: 'project', payload: project, timestamp: Date.now() });
};

export const saveMessageOffline = async (message: ChatMessage) => {
  message.syncStatus = 'pending';
  message.timestamp = Date.now();
  await db.messages.put(message);
  await db.syncQueue.put({ id: `msg_${message.id}`, type: 'message', payload: message, timestamp: Date.now() });
};

export const resolveConflicts = async (serverData: any, localData: any) => {
  // Robust Conflict Resolution Strategy:
  // 1. Time-based Last-Write-Wins as a baseline.
  // 2. Status-based overrides: A state progression (e.g. 'estimated' -> 'formulating') 
  //    always wins over a lesser state, regardless of timestamp, to prevent regression.
  
  const statusWeights: Record<string, number> = {
    'estimated': 1,
    'formulating': 2,
    'mixing': 3,
    'packaged': 4
  };

  const serverStatusWeight = statusWeights[serverData.status] || 0;
  const localStatusWeight = statusWeights[localData.status] || 0;

  // If server has progressed further down the pipeline, it wins
  if (serverStatusWeight > localStatusWeight) {
    return { ...serverData, syncStatus: 'synced', _conflictResolved: true };
  }
  
  // If local has progressed further, local wins
  if (localStatusWeight > serverStatusWeight) {
    return { ...localData, syncStatus: 'synced', _conflictResolved: true };
  }

  // If statuses are the same, fallback to Last-Write-Wins
  if (serverData.lastUpdated > localData.lastUpdated) {
    return { ...serverData, syncStatus: 'synced', _conflictResolved: true };
  }
  
  return { ...localData, syncStatus: 'synced', _conflictResolved: true };
};

// ----------------------------------------------------------------------
// SV-003: Survey & SurveyCapture Local Persistence & Media Lifecycle
// ----------------------------------------------------------------------

export const saveSurveyOffline = async (survey: Survey): Promise<void> => {
  survey.lastUpdatedEpochMs = Date.now();
  await db.surveys.put(survey);
  await db.syncQueue.put({
    id: `survey_${survey.id}`,
    type: 'survey',
    payload: survey,
    timestamp: Date.now(),
  });
};

export const getSurveysForProject = async (projectId: string): Promise<Survey[]> => {
  return await db.surveys.where('projectId').equals(projectId).sortBy('createdAtEpochMs');
};

export const getAllSurveysOffline = async (): Promise<Survey[]> => {
  return await db.surveys.orderBy('createdAtEpochMs').reverse().toArray();
};

export const getSurveyById = async (id: string): Promise<Survey | undefined> => {
  return await db.surveys.get(id);
};

/**
 * Cascade Deletion: Deletes survey, its associated captures, and all physical media blobs.
 * Prevents orphaned records and orphan media storage usage.
 */
export const deleteSurveyCascadeOffline = async (surveyId: string): Promise<{ deletedCaptures: number }> => {
  // 1. Fetch all associated captures
  const captures = await db.surveyCaptures.where('surveyId').equals(surveyId).toArray();

  // 2. Remove all corresponding media records
  for (const capture of captures) {
    await db.surveyMedia.delete(capture.localPath);
  }

  // 3. Delete capture entities
  await db.surveyCaptures.where('surveyId').equals(surveyId).delete();

  // 4. Delete survey entity
  await db.surveys.delete(surveyId);

  return { deletedCaptures: captures.length };
};

export const saveSurveyCaptureOffline = async (
  capture: SurveyCapture,
  rawImageData: string
): Promise<void> => {
  // Store media payload locally
  await db.surveyMedia.put({
    id: capture.localPath,
    surveyId: capture.surveyId,
    dataUrl: rawImageData,
    mimeType: 'image/jpeg',
    size: rawImageData.length,
  });

  // Store metadata
  capture.syncStatus = 'pending';
  await db.surveyCaptures.put(capture);

  // Update capture counter on parent survey
  const parentSurvey = await db.surveys.get(capture.surveyId);
  if (parentSurvey) {
    const totalCount = await db.surveyCaptures.where('surveyId').equals(capture.surveyId).count();
    parentSurvey.captureCount = totalCount;
    parentSurvey.lastUpdatedEpochMs = Date.now();
    await db.surveys.put(parentSurvey);
  }

  await db.syncQueue.put({
    id: `capture_${capture.id}`,
    type: 'capture',
    payload: capture,
    timestamp: Date.now(),
  });
};

export const getSurveyCaptures = async (surveyId: string): Promise<SurveyCapture[]> => {
  return await db.surveyCaptures
    .where('surveyId')
    .equals(surveyId)
    .reverse()
    .sortBy('createdAtEpochMs');
};

export const getSurveyCaptureById = async (id: string): Promise<SurveyCapture | undefined> => {
  return await db.surveyCaptures.get(id);
};

export const getSurveyMediaData = async (localPath: string): Promise<string | null> => {
  const media = await db.surveyMedia.get(localPath);
  return media ? media.dataUrl : null;
};

/**
 * Deletes a single capture and ensures its local media data is also expunged.
 */
export const deleteSurveyCaptureOffline = async (id: string): Promise<boolean> => {
  const capture = await db.surveyCaptures.get(id);
  if (!capture) return false;

  // Clean media file
  await db.surveyMedia.delete(capture.localPath);

  // Clean metadata
  await db.surveyCaptures.delete(id);

  // Decrement survey capture count
  const parentSurvey = await db.surveys.get(capture.surveyId);
  if (parentSurvey) {
    const totalCount = await db.surveyCaptures.where('surveyId').equals(capture.surveyId).count();
    parentSurvey.captureCount = totalCount;
    parentSurvey.lastUpdatedEpochMs = Date.now();
    await db.surveys.put(parentSurvey);
  }

  return true;
};

