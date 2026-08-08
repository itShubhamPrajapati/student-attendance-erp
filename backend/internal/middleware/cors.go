package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORSMiddleware configures cross-origin resource sharing for local frontend development
func CORSMiddleware(allowedOrigin string) gin.HandlerFunc {
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:5173"
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Allow any mobile/LAN origin or configured origin
		if origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		} else if allowedOrigin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		} else {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		}

		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
