package com.walnus.smartview.data;

import android.content.Context;

import androidx.annotation.NonNull;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

import com.walnus.smartview.data.dao.SurveyCaptureDao;
import com.walnus.smartview.data.dao.SurveyDao;
import com.walnus.smartview.data.entity.SurveyCaptureEntity;
import com.walnus.smartview.data.entity.SurveyEntity;

/**
 * SmartView Pro™ - Primary Room Database
 * Database Name: smartview_pro.db
 * Current Version: 2 (Migrated from Version 1)
 */
@Database(
    entities = {
        SurveyEntity.class,
        SurveyCaptureEntity.class
    },
    version = 2,
    exportSchema = false
)
public abstract class SmartViewDatabase extends RoomDatabase {

    private static final String DATABASE_NAME = "smartview_pro.db";
    private static volatile SmartViewDatabase sInstance;

    public abstract SurveyDao surveyDao();
    public abstract SurveyCaptureDao surveyCaptureDao();

    /**
     * Explicit Migration from Version 1 to Version 2:
     * Adds the survey_captures table with foreign key cascade to surveys(id) and indices.
     */
    public static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(@NonNull SupportSQLiteDatabase database) {
            // Create survey_captures table
            database.execSQL(
                "CREATE TABLE IF NOT EXISTS `survey_captures` (" +
                "`id` TEXT NOT NULL, " +
                "`survey_id` TEXT NOT NULL, " +
                "`local_path` TEXT NOT NULL, " +
                "`capture_type` TEXT NOT NULL, " +
                "`width` INTEGER, " +
                "`height` INTEGER, " +
                "`created_at_epoch_ms` INTEGER NOT NULL, " +
                "PRIMARY KEY(`id`), " +
                "FOREIGN KEY(`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE" +
                ")"
            );
            // Create indexes for efficient retrieval and cascade operations
            database.execSQL("CREATE INDEX IF NOT EXISTS `index_survey_captures_survey_id` ON `survey_captures` (`survey_id`)");
            database.execSQL("CREATE INDEX IF NOT EXISTS `index_survey_captures_created_at_epoch_ms` ON `survey_captures` (`created_at_epoch_ms`)");
        }
    };

    public static SmartViewDatabase getInstance(Context context) {
        if (sInstance == null) {
            synchronized (SmartViewDatabase.class) {
                if (sInstance == null) {
                    sInstance = Room.databaseBuilder(
                        context.getApplicationContext(),
                        SmartViewDatabase.class,
                        DATABASE_NAME
                    )
                    .addMigrations(MIGRATION_1_2)
                    .build();
                }
            }
        }
        return sInstance;
    }
}
