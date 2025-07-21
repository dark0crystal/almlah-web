# To run backend in dev (prod for production)
MODE=dev go run cmd/main.go

# Clean Architecture

## /internal/domain — Core Business Logic
- Entities: Data types and core logic
- Interfaces: Abstract definitions (e.g., repository interface)

## /internal/usecases — Application Logic
- Coordinates logic using domain interfaces.
- Implements workflows and use cases like “rate movie” or “search movie”.

## /internal/adapters — Implementation Layer
- Adapts real-world services to interface contracts (DB, APIs).
- Concrete implementations of interfaces declared in domain or usecases.

## /internal/interfaces — Entry Points (Controllers)
- Entry points into the system: HTTP handlers, CLI, gRPC.
- Accept requests, parse input, call use cases, return output.

## /internal/infrastructure — App Setup Helpers
- Configuration
- Logging setup
- Middleware
- DB pool, caching clients, etc.