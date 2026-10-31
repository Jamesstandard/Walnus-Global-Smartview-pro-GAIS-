package com.walnus.smartview.data.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import com.walnus.smartview.data.entity.SurveyEntity;

import java.util.List;

/**
 * SmartView Pro™ - Survey Data Access Object
 */
@Dao
public interface SurveyDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(SurveyEntity survey);

    @Update
    void update(SurveyEntity survey);

    @Delete
    void delete(SurveyEntity survey);

    @Query("DELETE FROM surveys WHERE id = :surveyId")
    void deleteById(String surveyId);

    @Query("SELECT * FROM surveys WHERE id = :id LIMIT 1")
    SurveyEntity getById(String id);

    @Query("SELECT * FROM surveys WHERE project_id = :projectId ORDER BY created_at_epoch_ms DESC")
    List<SurveyEntity> getSurveysByProject(String projectId);

    @Query("SELECT * FROM surveys ORDER BY created_at_epoch_ms DESC")
    List<SurveyEntity> getAllSurveys();
}
