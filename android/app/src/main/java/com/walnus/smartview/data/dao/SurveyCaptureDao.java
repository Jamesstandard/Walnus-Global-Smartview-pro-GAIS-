package com.walnus.smartview.data.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.walnus.smartview.data.entity.SurveyCaptureEntity;

import java.util.List;

/**
 * SmartView Pro™ - Survey Capture Data Access Object
 * Milestone: SV-003
 */
@Dao
public interface SurveyCaptureDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(SurveyCaptureEntity capture);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<SurveyCaptureEntity> captures);

    @Update
    void update(SurveyCaptureEntity capture);

    @Delete
    void delete(SurveyCaptureEntity capture);

    @Query("DELETE FROM survey_captures WHERE id = :id")
    int deleteById(String id);

    @Query("DELETE FROM survey_captures WHERE survey_id = :surveyId")
    int deleteBySurveyId(String surveyId);

    @Query("SELECT * FROM survey_captures WHERE id = :id LIMIT 1")
    SurveyCaptureEntity getById(String id);

    @Query("SELECT * FROM survey_captures WHERE survey_id = :surveyId ORDER BY created_at_epoch_ms DESC")
    List<SurveyCaptureEntity> getCapturesForSurvey(String surveyId);

    @Query("SELECT COUNT(*) FROM survey_captures WHERE survey_id = :surveyId")
    int countCapturesForSurvey(String surveyId);

    @Query("SELECT * FROM survey_captures ORDER BY created_at_epoch_ms DESC")
    List<SurveyCaptureEntity> getAllCaptures();
}
