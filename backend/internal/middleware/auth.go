package middleware

import (
	"github.com/gin-gonic/gin"
)

// AuthMiddlewarePlaceholder is the architectural structure prepared for Phase 2 JWT authentication.
// In Phase 1, it allows routes to prepare for role-based protection without locking out foundation endpoints.
func AuthMiddlewarePlaceholder() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Architecture-ready stub for Phase 2:
		// tokenString := c.GetHeader("Authorization")
		// if tokenString == "" { ... }
		// claims, err := services.ValidateJWT(tokenString)
		// c.Set("user", claims)

		c.Next()
	}
}

// RequireRolePlaceholder provides the architecture for role-based route guard in Phase 2
func RequireRolePlaceholder(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Architecture-ready stub:
		// role, exists := c.Get("user_role")
		// if !exists || !contains(allowedRoles, role.(string)) {
		//     c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "Forbidden"})
		//     return
		// }
		c.Next()
	}
}

// FormatErrorResponse standardizes backend error outputs
func FormatErrorResponse(c *gin.Context, statusCode int, message string) {
	c.JSON(statusCode, gin.H{
		"success": false,
		"message": message,
	})
}
