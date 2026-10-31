/**
 * SmartView Pro™ - Survey Capture Repository Abstraction
 * Milestone: SV-003 Camera Acquisition & Local Media Persistence
 * Walnus Global Ventures
 *
 * Provides a clean domain-level repository abstraction over Room/Dexie local data source.
 * Isolates UI and ViewModels from raw database operations and enforces media lifecycle cleanup.
 */

import { Survey, SurveyCapture } from '../types';
import {
  db,
  saveSurveyCaptureOffline,
  getSurveyCaptures,
  getSurveyCaptureById,
  deleteSurveyCaptureOffline,
  deleteSurveyCascadeOffline,
  getSurveyMediaData,
  saveSurveyOffline,
  getSurveysForProject,
  getAllSurveysOffline,
  getSurveyById,
} from '../db';

export interface ISurveyCaptureRepository {
  getCapturesForSurvey(surveyId: string): Promise<SurveyCapture[]>;
  getCaptureById(id: string): Promise<SurveyCapture | null>;
  saveCapture(capture: SurveyCapture, rawImageData: string): Promise<SurveyCapture>;
  deleteCapture(id: string): Promise<boolean>;
  deleteCapturesForSurvey(surveyId: string): Promise<number>;
  getMediaData(localPath: string): Promise<string | null>;
  
  // Survey Management
  getSurveysForProject(projectId: string): Promise<Survey[]>;
  getAllSurveys(): Promise<Survey[]>;
  getSurveyById(id: string): Promise<Survey | null>;
  saveSurvey(survey: Survey): Promise<Survey>;
  deleteSurvey(surveyId: string): Promise<{ deletedCaptures: number }>;
}

export class SurveyCaptureRepository implements ISurveyCaptureRepository {
  async getCapturesForSurvey(surveyId: string): Promise<SurveyCapture[]> {
    if (!surveyId) return [];
    return await getSurveyCaptures(surveyId);
  }

  async getCaptureById(id: string): Promise<SurveyCapture | null> {
    if (!id) return null;
    const capture = await getSurveyCaptureById(id);
    return capture || null;
  }

  async saveCapture(capture: SurveyCapture, rawImageData: string): Promise<SurveyCapture> {
    if (!capture.surveyId) {
      throw new Error('[SurveyCaptureRepository] Cannot save capture without a valid surveyId');
    }
    await saveSurveyCaptureOffline(capture, rawImageData);
    return capture;
  }

  async deleteCapture(id: string): Promise<boolean> {
    if (!id) return false;
    return await deleteSurveyCaptureOffline(id);
  }

  async deleteCapturesForSurvey(surveyId: string): Promise<number> {
    if (!surveyId) return 0;
    const res = await deleteSurveyCascadeOffline(surveyId);
    return res.deletedCaptures;
  }

  async getMediaData(localPath: string): Promise<string | null> {
    if (!localPath) return null;
    return await getSurveyMediaData(localPath);
  }

  async getSurveysForProject(projectId: string): Promise<Survey[]> {
    return await getSurveysForProject(projectId);
  }

  async getAllSurveys(): Promise<Survey[]> {
    return await getAllSurveysOffline();
  }

  async getSurveyById(id: string): Promise<Survey | null> {
    const survey = await getSurveyById(id);
    return survey || null;
  }

  async saveSurvey(survey: Survey): Promise<Survey> {
    await saveSurveyOffline(survey);
    return survey;
  }

  async deleteSurvey(surveyId: string): Promise<{ deletedCaptures: number }> {
    return await deleteSurveyCascadeOffline(surveyId);
  }
}

// Singleton repository instance
export const surveyCaptureRepository = new SurveyCaptureRepository();
