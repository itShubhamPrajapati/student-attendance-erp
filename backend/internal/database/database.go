package database

import (
	"errors"
	"fmt"
	"log"
	"time"

	"qr-attendance-backend/internal/config"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var (
	// DB is the global database instance
	DB *gorm.DB
)

// InitDatabase initializes the PostgreSQL connection via GORM and verifies it
func InitDatabase(cfg *config.Config) (*gorm.DB, error) {
	if cfg == nil {
		return nil, errors.New("database configuration is nil")
	}

	dsn := cfg.GetDSN()

	// GORM logging configuration
	gormLogLevel := logger.Warn
	if cfg.Environment == "development" {
		gormLogLevel = logger.Info
	}

	var db *gorm.DB
	var err error

	// Retry connection up to 3 times to handle cloud serverless databases (e.g. Neon cold-starts)
	for attempt := 1; attempt <= 3; attempt++ {
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(gormLogLevel),
			NowFunc: func() time.Time {
				return time.Now().UTC()
			},
		})
		if err == nil {
			// Configure underlying SQL connection pool
			sqlDB, dbErr := db.DB()
			if dbErr == nil {
				sqlDB.SetMaxIdleConns(10)
				sqlDB.SetMaxOpenConns(50)
				sqlDB.SetConnMaxLifetime(1 * time.Hour)

				if pingErr := sqlDB.Ping(); pingErr == nil {
					DB = db
					log.Println("Database connected successfully.")
					return DB, nil
				} else {
					err = pingErr
				}
			} else {
				err = dbErr
			}
		}

		log.Printf("[DATABASE] Connection attempt %d failed: %v. Retrying in 1.5s...", attempt, err)
		time.Sleep(1500 * time.Millisecond)
	}

	return nil, fmt.Errorf("failed to open database connection after 3 attempts: %w", err)
}

// CheckConnection checks if the active database connection is healthy
func CheckConnection() error {
	if DB == nil {
		return errors.New("database instance is uninitialized")
	}
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to retrieve sql.DB: %w", err)
	}
	return sqlDB.Ping()
}
