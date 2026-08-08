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

	"gorm.io/gorm"
)

func main() {
	fmt.Println("==================================================")
	fmt.Println("QR Attendance System — Complete Demo Dataset Seed")
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

	// 4. Seed Admin
	seedAdmin(db)

	// 5. Seed Teachers
	teacher1 := seedTeacher(db, "Prof. Vikram Sharma", "teacher@example.com", "teacher123", "EMP-101", "Computer Science")
	teacher2 := seedTeacher(db, "Prof. Anjali Patel", "prof.patel@example.com", "teacher123", "EMP-102", "Computer Science")

	// 6. Seed Subjects
	sub1 := seedSubject(db, "Data Structures", "CS201", "Computer Science", 3)
	sub2 := seedSubject(db, "Database Management Systems", "CS202", "Computer Science", 3)
	sub3 := seedSubject(db, "Operating Systems", "CS203", "Computer Science", 3)
	seedSubject(db, "Computer Networks", "CS204", "Computer Science", 4)

	// 7. Seed Classes
	class1 := seedClass(db, "SY BSc Computer Science", "Computer Science", 3, "A", "2026-2027")
	seedClass(db, "TY BSc Computer Science", "Computer Science", 5, "A", "2026-2027")

	// 8. Seed Teaching Assignments (Teacher -> Subject -> Class)
	if teacher1 != nil && sub1 != nil && class1 != nil {
		seedAssignment(db, teacher1.ID, sub1.ID, class1.ID)
	}
	if teacher1 != nil && sub3 != nil && class1 != nil {
		seedAssignment(db, teacher1.ID, sub3.ID, class1.ID)
	}
	if teacher2 != nil && sub2 != nil && class1 != nil {
		seedAssignment(db, teacher2.ID, sub2.ID, class1.ID)
	}

	// 9. Seed 10 Enrolled Students assigned to SY BSc CS (class1)
	class1ID := ""
	if class1 != nil {
		class1ID = class1.ID
	}

	studentsData := []struct {
		Name  string
		Email string
		Roll  string
	}{
		{"Rahul Sharma", "student@example.com", "CS001"},
		{"Priya Patel", "priya.patel@example.com", "CS002"},
		{"Amit Kumar", "amit.kumar@example.com", "CS003"},
		{"Sneha Gupta", "sneha.gupta@example.com", "CS004"},
		{"Rohit Verma", "rohit.verma@example.com", "CS005"},
		{"Ananya Deshmukh", "ananya.deshmukh@example.com", "CS006"},
		{"Kunal Singh", "kunal.singh@example.com", "CS007"},
		{"Pooja Iyer", "pooja.iyer@example.com", "CS008"},
		{"Vikas Nair", "vikas.nair@example.com", "CS009"},
		{"Deepika Joshi", "deepika.joshi@example.com", "CS010"},
	}

	for _, s := range studentsData {
		seedStudent(db, s.Name, s.Email, "student123", s.Roll, "Computer Science", 3, "A", class1ID)
	}

	fmt.Println("==================================================")
	fmt.Println("Demo Dataset Seed Completed Successfully!")
	fmt.Println("Admin:   admin@example.com   / ChangeThisPassword123")
	fmt.Println("Teacher: teacher@example.com / teacher123")
	fmt.Println("Student: student@example.com / student123")
	fmt.Println("==================================================")
}

func seedAdmin(db *gorm.DB) {
	adminEmail := strings.ToLower(strings.TrimSpace(getEnv("ADMIN_EMAIL", "admin@example.com")))
	adminPassword := getEnv("ADMIN_PASSWORD", "ChangeThisPassword123")
	adminName := getEnv("ADMIN_NAME", "System Administrator")

	var count int64
	db.Model(&models.User{}).Where("LOWER(email) = ?", adminEmail).Count(&count)
	if count > 0 {
		fmt.Printf("[SEED] Admin '%s' already exists.\n", adminEmail)
		return
	}

	passwordHash, err := services.HashPassword(adminPassword)
	if err != nil {
		log.Fatalf("Failed to hash admin password: %v", err)
	}

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
	fmt.Printf("[SEED] Created Admin: %s\n", adminEmail)
}

func seedTeacher(db *gorm.DB, name, email, password, employeeID, department string) *models.Teacher {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	var user models.User
	err := db.Where("LOWER(email) = ?", cleanEmail).First(&user).Error
	if err == nil {
		var teacher models.Teacher
		db.Where("user_id = ?", user.ID).First(&teacher)
		return &teacher
	}

	passwordHash, err := services.HashPassword(password)
	if err != nil {
		log.Printf("Failed to hash password for teacher %s: %v", cleanEmail, err)
		return nil
	}

	user = models.User{
		Name:         name,
		Email:        cleanEmail,
		PasswordHash: passwordHash,
		Role:         models.RoleTeacher,
		IsActive:     true,
	}

	if err := db.Create(&user).Error; err != nil {
		log.Printf("Failed to create user for teacher %s: %v", cleanEmail, err)
		return nil
	}

	teacher := models.Teacher{
		UserID:     user.ID,
		EmployeeID: employeeID,
		Department: department,
	}

	if err := db.Create(&teacher).Error; err != nil {
		log.Printf("Failed to create teacher profile for %s: %v", cleanEmail, err)
		return nil
	}

	fmt.Printf("[SEED] Created Teacher: %s (%s)\n", name, cleanEmail)
	return &teacher
}

func seedSubject(db *gorm.DB, name, code, department string, semester int) *models.Subject {
	cleanCode := strings.ToUpper(strings.TrimSpace(code))
	var subject models.Subject
	err := db.Where("code = ?", cleanCode).First(&subject).Error
	if err == nil {
		return &subject
	}

	subject = models.Subject{
		Name:       name,
		Code:       cleanCode,
		Department: department,
		Semester:   semester,
	}

	if err := db.Create(&subject).Error; err != nil {
		log.Printf("Failed to create subject %s: %v", cleanCode, err)
		return nil
	}

	fmt.Printf("[SEED] Created Subject: %s (%s)\n", name, cleanCode)
	return &subject
}

func seedClass(db *gorm.DB, name, department string, semester int, section, academicYear string) *models.Class {
	var class models.Class
	err := db.Where("department = ? AND semester = ? AND section = ? AND academic_year = ?", department, semester, section, academicYear).First(&class).Error
	if err == nil {
		return &class
	}

	class = models.Class{
		Name:         name,
		Department:   department,
		Semester:     semester,
		Section:      section,
		AcademicYear: academicYear,
	}

	if err := db.Create(&class).Error; err != nil {
		log.Printf("Failed to create class %s: %v", name, err)
		return nil
	}

	fmt.Printf("[SEED] Created Class: %s (Sem %d %s)\n", name, semester, section)
	return &class
}

func seedAssignment(db *gorm.DB, teacherID, subjectID, classID string) {
	var count int64
	db.Model(&models.TeacherSubjectClass{}).
		Where("teacher_id = ? AND subject_id = ? AND class_id = ?", teacherID, subjectID, classID).
		Count(&count)
	if count > 0 {
		return
	}

	assignment := models.TeacherSubjectClass{
		TeacherID: teacherID,
		SubjectID: subjectID,
		ClassID:   classID,
	}

	if err := db.Create(&assignment).Error; err != nil {
		log.Printf("Failed to assign teacher: %v", err)
		return
	}

	fmt.Println("[SEED] Created Teaching Assignment allocation.")
}

func seedStudent(db *gorm.DB, name, email, password, rollNumber, department string, semester int, section, classID string) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))
	var user models.User
	err := db.Where("LOWER(email) = ?", cleanEmail).First(&user).Error
	if err == nil {
		// Update student class if not set
		var student models.Student
		if err := db.Where("user_id = ?", user.ID).First(&student).Error; err == nil {
			if student.ClassID == nil && classID != "" {
				db.Model(&student).Update("class_id", classID)
			}
		}
		return
	}

	passwordHash, err := services.HashPassword(password)
	if err != nil {
		log.Printf("Failed to hash password for student %s: %v", cleanEmail, err)
		return
	}

	user = models.User{
		Name:         name,
		Email:        cleanEmail,
		PasswordHash: passwordHash,
		Role:         models.RoleStudent,
		IsActive:     true,
	}

	if err := db.Create(&user).Error; err != nil {
		log.Printf("Failed to create user for student %s: %v", cleanEmail, err)
		return
	}

	var classIDPtr *string
	if classID != "" {
		cCopy := classID
		classIDPtr = &cCopy
	}

	student := models.Student{
		UserID:     user.ID,
		RollNumber: rollNumber,
		Department: department,
		Semester:   semester,
		Section:    section,
		ClassID:    classIDPtr,
	}

	if err := db.Create(&student).Error; err != nil {
		log.Printf("Failed to create student profile for %s: %v", cleanEmail, err)
		return
	}

	fmt.Printf("[SEED] Created Student: %s (%s - Roll %s)\n", name, cleanEmail, rollNumber)
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok && val != "" {
		return val
	}
	return fallback
}
