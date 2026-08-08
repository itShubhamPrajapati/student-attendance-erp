package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

// RunMigrations executes SQL migration files from the migrations directory
func RunMigrations(db *gorm.DB, migrationsDir string) error {
	// Create schema_migrations table if not exists
	createTableSQL := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(100) PRIMARY KEY,
			applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		);
	`
	if err := db.Exec(createTableSQL).Error; err != nil {
		return fmt.Errorf("failed to create schema_migrations table: %w", err)
	}

	// Find all .sql files
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory '%s': %w", migrationsDir, err)
	}

	var sqlFiles []string
	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".sql") {
			sqlFiles = append(sqlFiles, file.Name())
		}
	}
	sort.Strings(sqlFiles)

	for _, filename := range sqlFiles {
		var count int64
		db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", filename).Scan(&count)
		if count > 0 {
			// Already applied
			continue
		}

		filePath := filepath.Join(migrationsDir, filename)
		content, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read migration file '%s': %w", filename, err)
		}

		log.Printf("[MIGRATION] Applying %s...", filename)

		// Execute migration in a transaction
		txErr := db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Exec(string(content)).Error; err != nil {
				return fmt.Errorf("failed executing migration SQL in '%s': %w", filename, err)
			}
			if err := tx.Exec("INSERT INTO schema_migrations (version) VALUES (?)", filename).Error; err != nil {
				return fmt.Errorf("failed recording migration version '%s': %w", filename, err)
			}
			return nil
		})

		if txErr != nil {
			return txErr
		}

		log.Printf("[MIGRATION] Successfully applied %s", filename)
	}

	return nil
}
