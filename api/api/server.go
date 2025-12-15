package api

import (
	"net/http"
	"noteshare-api/handlers"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type APIServer struct {
	ListenAddress string
}

func (server *APIServer) Run() error {
	router := mux.NewRouter()
	// CORS config
	handler := cors.New(cors.Options{
		AllowedOrigins: []string{
			os.Getenv("CLIENT_URL"),
			os.Getenv("WSS_URL"),
		},
		AllowCredentials: true,
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		MaxAge:           86400,
		Debug:            true,
	}).Handler(router)
	// init middlewares
	router.Use(AuthMiddleware)
	router.Use(ValidatePathParams)
	router.Use(CheckUserOwnershipMiddleware)
	// init all routes and run the server
	initRoutes(router)
	return http.ListenAndServe(server.ListenAddress, handler)
}

func initRoutes(router *mux.Router) {
	handlers.InitUserRoutes(router)
	handlers.InitAuthRoutes(router)
	handlers.InitNoteRoutes(router)
	handlers.InitRoomRoutes(router)
}
