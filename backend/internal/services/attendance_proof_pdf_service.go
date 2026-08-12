package services

import (
	"bytes"
	"fmt"
	"strings"

	"qr-attendance-backend/internal/models"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
)

// GenerateAttendanceProofPDF generates an official, high-resolution printable A4 portrait attendance receipt
func GenerateAttendanceProofPDF(data *models.AttendanceProofResponse) ([]byte, error) {
	if data == nil {
		return nil, fmt.Errorf("proof data is nil")
	}

	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(15, 15, 15)
	pdf.SetAutoPageBreak(true, 15)
	pdf.AddPage()

	// 1. Generate Verification QR Code Image
	qrBytes, err := qrcode.Encode(data.VerificationURL, qrcode.Medium, 256)
	if err == nil {
		imageOpt := gofpdf.ImageOptions{
			ImageType: "PNG",
			ReadDpi:   true,
		}
		pdf.RegisterImageOptionsReader("proof_qr", imageOpt, bytes.NewReader(qrBytes))
	}

	// 2. Institutional Header
	pdf.SetFont("Arial", "B", 18)
	pdf.SetTextColor(15, 23, 42) // Slate-900
	pdf.CellFormat(0, 8, "INSTITUTIONAL ATTENDANCE SYSTEM", "", 1, "C", false, 0, "")

	pdf.SetFont("Arial", "", 10)
	pdf.SetTextColor(100, 116, 139) // Slate-500
	pdf.CellFormat(0, 5, "Official Digital Attendance Verification & Audit Receipt", "", 1, "C", false, 0, "")
	pdf.Ln(3)

	// Top Divider
	pdf.SetDrawColor(226, 232, 240) // Slate-200
	pdf.SetLineWidth(0.6)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(4)

	// 3. Status Banner
	statusUpper := strings.ToUpper(strings.TrimSpace(data.AttendanceStatus))
	isLate := statusUpper == models.StatusLate
	isAbsent := statusUpper == models.StatusAbsent

	if isLate {
		pdf.SetFillColor(254, 243, 199) // Amber-100
		pdf.SetTextColor(180, 83, 9)    // Amber-700
		pdf.SetDrawColor(251, 191, 36)  // Amber-400
	} else if isAbsent {
		pdf.SetFillColor(254, 226, 226) // Rose-100
		pdf.SetTextColor(185, 28, 28)   // Rose-700
		pdf.SetDrawColor(248, 113, 113) // Rose-400
	} else {
		pdf.SetFillColor(220, 252, 231) // Emerald-100
		pdf.SetTextColor(21, 128, 61)   // Emerald-700
		pdf.SetDrawColor(74, 222, 128)  // Emerald-400
	}

	pdf.SetLineWidth(0.4)
	pdf.SetFont("Arial", "B", 13)
	bannerText := fmt.Sprintf("ATTENDANCE STATUS: %s", strings.ToUpper(data.StatusLabel))
	pdf.CellFormat(0, 10, bannerText, "1", 1, "C", true, 0, "")
	pdf.Ln(4)

	// Section 1: Student Information Box
	renderSectionHeader(pdf, "STUDENT INFORMATION")

	drawInfoGrid(pdf, [][]string{
		{"Student Name:", data.StudentName, "Roll Number:", data.RollNumber},
		{"Class / Batch:", data.ClassName, "Department:", data.Department},
		{"Semester / Section:", fmt.Sprintf("Sem %d - %s", data.Semester, data.Section), "Student Email:", data.Email},
	})
	pdf.Ln(3)

	// Section 2: Session & Subject Details Box
	renderSectionHeader(pdf, "LECTURE & ATTENDANCE DETAILS")

	markedTimeStr := data.AttendanceMarkedAt.Format("15:04:05")
	if data.AttendanceMarkedAt.IsZero() {
		markedTimeStr = "—"
	}

	drawInfoGrid(pdf, [][]string{
		{"Course / Subject:", data.SubjectName, "Subject Code:", data.SubjectCode},
		{"Faculty Instructor:", data.TeacherName, "Faculty Department:", data.TeacherDepartment},
		{"Session Date:", data.SessionDate, "Scheduled Time:", fmt.Sprintf("%s – %s", data.SessionStartTime, data.SessionEndTime)},
		{"Attendance Marked At:", markedTimeStr, "Late Threshold:", fmt.Sprintf("%d Minutes", data.LateThresholdMinutes)},
	})
	pdf.Ln(3)

	// Section 3: Verification & Authenticity Box (with QR Code)
	renderSectionHeader(pdf, "DIGITAL VERIFICATION & AUDIT TRAIL")

	boxStartY := pdf.GetY()
	boxWidth := 180.0
	boxHeight := 48.0

	pdf.SetFillColor(248, 250, 252) // Slate-50
	pdf.SetDrawColor(203, 213, 225) // Slate-300
	pdf.SetLineWidth(0.3)
	pdf.Rect(15, boxStartY, boxWidth, boxHeight, "FD")

	// Left Column Text: Proof ID & Verification details
	pdf.SetXY(18, boxStartY+4)
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(115, 5, "PROOF IDENTIFIER:", "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "B", 13)
	pdf.SetTextColor(79, 70, 229) // Indigo-600
	pdf.CellFormat(115, 6, data.PublicID, "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "B", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(115, 4, "VERIFICATION STATUS:", "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "B", 9)
	pdf.SetTextColor(22, 101, 52) // Emerald-800
	pdf.CellFormat(115, 5, "AUTHENTIC & VERIFIED IN REAL-TIME", "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(100, 116, 139)
	pdf.CellFormat(115, 4, "Public Verification URL:", "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "", 7.5)
	pdf.SetTextColor(37, 99, 235) // Blue-600
	pdf.CellFormat(115, 4, data.VerificationURL, "", 1, "L", false, 0, "")

	pdf.SetX(18)
	pdf.SetFont("Arial", "I", 7.5)
	pdf.SetTextColor(148, 163, 184)
	pdf.CellFormat(115, 4, fmt.Sprintf("Generated: %s UTC", data.GeneratedAt.Format("2006-01-02 15:04:05")), "", 1, "L", false, 0, "")

	// Right Column: Embedded QR Code
	if err == nil {
		qrSize := 38.0
		pdf.ImageOptions("proof_qr", 15+boxWidth-qrSize-5, boxStartY+4, qrSize, qrSize, false, gofpdf.ImageOptions{ImageType: "PNG"}, 0, "")
		pdf.SetXY(15+boxWidth-qrSize-5, boxStartY+4+qrSize)
		pdf.SetFont("Arial", "B", 7)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(qrSize, 3.5, "SCAN TO VERIFY", "", 0, "C", false, 0, "")
	}

	pdf.SetY(boxStartY + boxHeight + 8)

	// 4. Institutional Notice Footer
	pdf.SetDrawColor(226, 232, 240)
	pdf.SetLineWidth(0.4)
	pdf.Line(15, pdf.GetY(), 195, pdf.GetY())
	pdf.Ln(3)

	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(148, 163, 184) // Slate-400
	pdf.MultiCell(0, 3.8, "This is an official computer-generated digital attendance proof issued by the QR-Based Student Attendance Management System. Real-time verification is authoritative through the embedded verification token and QR code. No physical signature is required.", "", "C", false)

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to render PDF document: %w", err)
	}

	return buf.Bytes(), nil
}

// renderSectionHeader draws a clean navy section title bar
func renderSectionHeader(pdf *gofpdf.Fpdf, title string) {
	pdf.SetFillColor(30, 41, 59) // Slate-800
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Arial", "B", 9)
	pdf.CellFormat(0, 6, "  "+title, "", 1, "L", true, 0, "")
	pdf.Ln(1)
}

// drawInfoGrid renders a 4-column key-value matrix
func drawInfoGrid(pdf *gofpdf.Fpdf, rows [][]string) {
	pdf.SetDrawColor(241, 245, 249) // Slate-100
	colWidths := []float64{38, 52, 38, 52}

	for idx, row := range rows {
		if len(row) < 4 {
			continue
		}
		if idx%2 == 0 {
			pdf.SetFillColor(255, 255, 255)
		} else {
			pdf.SetFillColor(248, 250, 252) // Slate-50
		}

		// Label 1
		pdf.SetFont("Arial", "B", 8.5)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(colWidths[0], 6.5, row[0], "1", 0, "L", true, 0, "")

		// Val 1
		pdf.SetFont("Arial", "", 8.5)
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(colWidths[1], 6.5, " "+row[1], "1", 0, "L", true, 0, "")

		// Label 2
		pdf.SetFont("Arial", "B", 8.5)
		pdf.SetTextColor(100, 116, 139)
		pdf.CellFormat(colWidths[2], 6.5, row[2], "1", 0, "L", true, 0, "")

		// Val 2
		pdf.SetFont("Arial", "", 8.5)
		pdf.SetTextColor(15, 23, 42)
		pdf.CellFormat(colWidths[3], 6.5, " "+row[3], "1", 1, "L", true, 0, "")
	}
}
