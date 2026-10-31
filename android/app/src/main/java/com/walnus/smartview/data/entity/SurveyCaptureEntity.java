package com.walnus.smartview.data.entity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;

/**
 * SmartView Pro™ - Survey Capture Entity
 * Milestone: SV-003 Camera Acquisition & Local Media Persistence
 * Walnus Global Ventures
 *
 * Foreign Key cascade: deleting a Survey removes associated survey_captures records.
 */
@Entity(
    tableName = "survey_captures",
    foreignKeys = @ForeignKey(
        entity = SurveyEntity.class,
        parentColumns = "id",
        childColumns = "survey_id",
        onDelete = ForeignKey.CASCADE
    ),
    indices = {
        @Index(value = "survey_id"),
        @Index(value = "created_at_epoch_ms")
    }
)
public class SurveyCaptureEntity {

    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "id")
    private String id;

    @NonNull
    @ColumnInfo(name = "survey_id")
    private String surveyId;

    @NonNull
    @ColumnInfo(name = "local_path")
    private String localPath;

    @NonNull
    @ColumnInfo(name = "capture_type")
    private String captureType;

    @Nullable
    @ColumnInfo(name = "width")
    private Integer width;

    @Nullable
    @ColumnInfo(name = "height")
    private Integer height;

    @ColumnInfo(name = "created_at_epoch_ms")
    private long createdAtEpochMs;

    public SurveyCaptureEntity(
        @NonNull String id,
        @NonNull String surveyId,
        @NonNull String localPath,
        @NonNull String captureType,
        @Nullable Integer width,
        @Nullable Integer height,
        long createdAtEpochMs
    ) {
        this.id = id;
        this.surveyId = surveyId;
        this.localPath = localPath;
        this.captureType = captureType;
        this.width = width;
        this.height = height;
        this.createdAtEpochMs = createdAtEpochMs;
    }

    @NonNull
    public String getId() { return id; }
    public void setId(@NonNull String id) { this.id = id; }

    @NonNull
    public String getSurveyId() { return surveyId; }
    public void setSurveyId(@NonNull String surveyId) { this.surveyId = surveyId; }

    @NonNull
    public String getLocalPath() { return localPath; }
    public void setLocalPath(@NonNull String localPath) { this.localPath = localPath; }

    @NonNull
    public String getCaptureType() { return captureType; }
    public void setCaptureType(@NonNull String captureType) { this.captureType = captureType; }

    @Nullable
    public Integer getWidth() { return width; }
    public void setWidth(@Nullable Integer width) { this.width = width; }

    @Nullable
    public Integer getHeight() { return height; }
    public void setHeight(@Nullable Integer height) { this.height = height; }

    public long getCreatedAtEpochMs() { return createdAtEpochMs; }
    public void setCreatedAtEpochMs(long createdAtEpochMs) { this.createdAtEpochMs = createdAtEpochMs; }
}
