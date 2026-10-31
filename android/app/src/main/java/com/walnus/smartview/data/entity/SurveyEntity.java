package com.walnus.smartview.data.entity;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

/**
 * SmartView Pro™ - Survey Entity
 * Milestone: SV-002 / SV-003
 * Walnus Global Ventures
 */
@Entity(tableName = "surveys")
public class SurveyEntity {

    @PrimaryKey
    @NonNull
    @ColumnInfo(name = "id")
    private String id;

    @NonNull
    @ColumnInfo(name = "project_id")
    private String projectId;

    @NonNull
    @ColumnInfo(name = "title")
    private String title;

    @NonNull
    @ColumnInfo(name = "status")
    private String status;

    @ColumnInfo(name = "created_at_epoch_ms")
    private long createdAtEpochMs;

    public SurveyEntity(@NonNull String id, @NonNull String projectId, @NonNull String title, @NonNull String status, long createdAtEpochMs) {
        this.id = id;
        this.projectId = projectId;
        this.title = title;
        this.status = status;
        this.createdAtEpochMs = createdAtEpochMs;
    }

    @NonNull
    public String getId() { return id; }
    public void setId(@NonNull String id) { this.id = id; }

    @NonNull
    public String getProjectId() { return projectId; }
    public void setProjectId(@NonNull String projectId) { this.projectId = projectId; }

    @NonNull
    public String getTitle() { return title; }
    public void setTitle(@NonNull String title) { this.title = title; }

    @NonNull
    public String getStatus() { return status; }
    public void setStatus(@NonNull String status) { this.status = status; }

    public long getCreatedAtEpochMs() { return createdAtEpochMs; }
    public void setCreatedAtEpochMs(long createdAtEpochMs) { this.createdAtEpochMs = createdAtEpochMs; }
}
