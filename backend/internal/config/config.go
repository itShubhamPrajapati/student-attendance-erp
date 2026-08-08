package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all backend environment configuration
type Config struct {
	ServerPort   string
	Environment  string
	FrontendURL  string
	DBHost       string
	DBPort       int
	DBUser       string
	DBPassword   string
	DBName       string
	DBSSLMode    string
	JWTSecret    string
	JWTExpHours  int
}

// LoadConfig reads configuration from .env and environment variables
func LoadConfig() (*Config, error) {
	// Attempt to load .env, but do not fail if it's missing (e.g. in container/prod env)
	_ = godotenv.Load()

	dbPort, err := strconv.Atoi(getEnv("DATABASE_PORT", "5432"))
	if err != nil {
		dbPort = 5432
	}

	jwtExp, err := strconv.Atoi(getEnv("JWT_EXPIRATION_HOURS", "24"))
	if err != nil {
		jwtExp = 24
	}

	cfg := &Config{
		ServerPort:  getEnv("SERVER_PORT", "8080"),
		Environment: getEnv("ENVIRONMENT", "development"),
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:5173"),
		DBHost:      getEnv("DATABASE_HOST", "localhost"),
		DBPort:      dbPort,
		DBUser:      getEnv("DATABASE_USER", "postgres"),
		DBPassword:  getEnv("DATABASE_PASSWORD", ""),
		DBName:      getEnv("DATABASE_NAME", "qr_attendance"),
		DBSSLMode:   getEnv("DATABASE_SSLMODE", "disable"),
		JWTSecret:   getEnv("JWT_SECRET", "default_secret_key_change_in_phase2"),
		JWTExpHours: jwtExp,
	}

	return cfg, nil
}

// GetDSN returns the PostgreSQL connection string for GORM
func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

// GetSafeDSN returns the connection string with the password masked for safe logging
func (c *Config) GetSafeDSN() string {
	return fmt.Sprintf(
		"host=%s port=%d user=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBName, c.DBSSLMode,
	)
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists && value != "" {
		return value
	}
	return fallback
}
