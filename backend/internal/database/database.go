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

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(gormLogLevel),
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}

	// Configure underlying SQL connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get underlying generic database object: %w", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(1 * time.Hour)

	// Verify the connection with ping
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("database ping verification failed: %w", err)
	}

	DB = db
	log.Println("Database connected successfully.")
	return DB, nil
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
