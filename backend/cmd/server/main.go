package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"qr-attendance-backend/internal/config"
	"qr-attendance-backend/internal/database"
	"qr-attendance-backend/internal/routes"
)

func main() {
	// 1. Load Environment Configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Critical error loading environment configuration: %v", err)
	}

	// 2. Initialize PostgreSQL Database Connection
	dbStatus := "connected"
	db, err := database.InitDatabase(cfg)
	if err != nil {
		dbStatus = "disconnected"
		log.Printf("[WARNING] Database connection initialization failed: %v", err)
		log.Printf("[INFO] Database Target: %s", cfg.GetSafeDSN())
	} else {
		// 3. Execute SQL Migrations
		migrationsPath := "migrations"
		if _, err := os.Stat(migrationsPath); os.IsNotExist(err) {
			// Fallback if executed from root directory
			migrationsPath = filepath.Join("backend", "migrations")
		}

		if err := database.RunMigrations(db, migrationsPath); err != nil {
			log.Printf("[ERROR] SQL Migration execution failed: %v", err)
		}
	}

	// 4. Print Clean Startup Logging Banner
	fmt.Println("==================================================")
	fmt.Println("QR Attendance API — Phase 3 Academic Structure & Class Management")
	fmt.Printf("Environment: %s\n", cfg.Environment)
	fmt.Printf("Server: :%s\n", cfg.ServerPort)
	fmt.Printf("Database: %s\n", dbStatus)
	fmt.Printf("Health Endpoint: http://localhost:%s/api/health\n", cfg.ServerPort)
	fmt.Println("==================================================")

	// 5. Setup Gin HTTP Router
	router := routes.SetupRouter(cfg)

	// 6. Start HTTP Server
	serverAddr := fmt.Sprintf(":%s", cfg.ServerPort)
	server := &http.Server{
		Addr:    serverAddr,
		Handler: router,
	}

	log.Printf("Starting QR Attendance Backend server on port %s...", cfg.ServerPort)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server failed to start on %s: %v", serverAddr, err)
	}
}
