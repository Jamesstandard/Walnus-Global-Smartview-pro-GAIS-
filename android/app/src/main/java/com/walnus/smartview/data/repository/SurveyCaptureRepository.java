package com.walnus.smartview.data.repository;

import android.content.Context;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.walnus.smartview.data.dao.SurveyCaptureDao;
import com.walnus.smartview.data.dao.SurveyDao;
import com.walnus.smartview.data.entity.SurveyCaptureEntity;

import java.io.File;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * SmartView Pro™ - Survey Capture Repository
 * Milestone: SV-003
 *
 * Implements the domain-level abstraction between UI/ViewModels and data layer.
 * Enforces file lifecycle cleanup: deleting metadata also deletes corresponding physical files,
 * and deleting a survey triggers cleanup of all associated media files to avoid orphaned assets.
 */
public class SurveyCaptureRepository {

    private static final String TAG = "SurveyCaptureRepo";
    private final SurveyCaptureDao captureDao;
    private final SurveyDao surveyDao;
    private final Context appContext;
    private final ExecutorService ioExecutor;

    public SurveyCaptureRepository(
        SurveyCaptureDao captureDao,
        SurveyDao surveyDao,
        Context context
    ) {
        this.captureDao = captureDao;
        this.surveyDao = surveyDao;
        this.appContext = context.getApplicationContext();
        this.ioExecutor = Executors.newFixedThreadPool(2);
    }

    public List<SurveyCaptureEntity> getCapturesForSurvey(String surveyId) {
        return captureDao.getCapturesForSurvey(surveyId);
    }

    @Nullable
    public SurveyCaptureEntity getCaptureById(String id) {
        return captureDao.getById(id);
    }

    public void saveCapture(SurveyCaptureEntity capture) {
        captureDao.insert(capture);
        Log.i(TAG, "Saved capture metadata id=" + capture.getId() + " for survey=" + capture.getSurveyId());
    }

    /**
     * Deletes capture metadata from database and purges physical image file from storage.
     */
    public boolean deleteCapture(String id) {
        SurveyCaptureEntity capture = captureDao.getById(id);
        if (capture == null) return false;

        // Delete physical file
        deletePhysicalFile(capture.getLocalPath());

        // Delete from database
        captureDao.deleteById(id);
        Log.i(TAG, "Deleted capture id=" + id + " and removed local file=" + capture.getLocalPath());
        return true;
    }

    /**
     * Deletes survey and cleans up all associated physical media files.
     */
    public void deleteSurveyAndCaptures(String surveyId) {
        List<SurveyCaptureEntity> captures = captureDao.getCapturesForSurvey(surveyId);
        for (SurveyCaptureEntity c : captures) {
            deletePhysicalFile(c.getLocalPath());
        }
        // Room cascade removes database records
        surveyDao.deleteById(surveyId);
        Log.i(TAG, "Purged survey id=" + surveyId + " and " + captures.size() + " associated media files");
    }

    private void deletePhysicalFile(String localPath) {
        if (localPath == null || localPath.isEmpty()) return;
        try {
            File file = new File(localPath);
            if (file.exists() && !file.delete()) {
                Log.w(TAG, "Warning: failed to immediately delete local file " + localPath);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error during file deletion for " + localPath, e);
        }
    }
}
