package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/database"
	"qr-attendance-backend/internal/models"
	"qr-attendance-backend/internal/services"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("QR Attendance System — Database Seed CLI")
	fmt.Println("==================================================")

	// 1. Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// 2. Connect to database
	db, err := database.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Database connection failed: %v", err)
	}

	// 3. Ensure migrations have run
	migrationsPath := "migrations"
	if _, err := os.Stat(migrationsPath); os.IsNotExist(err) {
		migrationsPath = filepath.Join("backend", "migrations")
	}

	if err := database.RunMigrations(db, migrationsPath); err != nil {
		log.Fatalf("Migration execution failed: %v", err)
	}

	// 4. Retrieve Admin seed credentials from environment variables
	adminName := getEnv("ADMIN_NAME", "System Administrator")
	adminEmail := strings.ToLower(strings.TrimSpace(getEnv("ADMIN_EMAIL", "admin@example.com")))
	adminPassword := getEnv("ADMIN_PASSWORD", "ChangeThisPassword123")

	if adminEmail == "" || adminPassword == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD must be configured in .env")
	}

	// 5. Check if admin already exists
	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ?", adminEmail).Count(&count)
	if count > 0 {
		fmt.Println("Admin already exists.")
		return
	}

	// 6. Hash password with bcrypt
	passwordHash, err := services.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("Failed to hash admin password: %v", err)
	}

	// 7. Create admin user
	adminUser := models.User{
		Name:         adminName,
		Email:        adminEmail,
		PasswordHash: passwordHash,
		Role:         models.RoleAdmin,
		IsActive:     true,
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Printf("Admin created successfully.\nEmail: %s\nRole: %s\n", adminEmail, models.RoleAdmin)
	fmt.Println("==================================================")
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
