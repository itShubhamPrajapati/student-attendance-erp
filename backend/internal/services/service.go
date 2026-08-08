package services

// AuthServiceStub provides the architectural placeholder for authentication services (Phase 2)
type AuthServiceStub struct{}

// AttendanceServiceStub provides the architectural placeholder for QR attendance sessions (Phase 2/3)
type AttendanceServiceStub struct{}

// NewAuthServiceStub creates a new instance of the auth service stub
func NewAuthServiceStub() *AuthServiceStub {
	return &AuthServiceStub{}
}

// NewAttendanceServiceStub creates a new instance of the attendance service stub
func NewAttendanceServiceStub() *AttendanceServiceStub {
	return &AttendanceServiceStub{}
}
