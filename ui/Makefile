# Hybrid Sovereign UI — build targets

SHELL := /bin/bash
NPM := npm

.PHONY: help install build build-shared build-admin build-tenant \
        build-admin-plugin build-tenant-plugin typecheck dev-admin dev-tenant clean

help: ## Show available targets
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | awk -F ':|##' '{printf "  %-22s %s\n", $$1, $$3}'

install: ## Install all workspace dependencies
	$(NPM) install

build-shared: ## Build @hybridsovereign/shared
	$(NPM) run build -w @hybridsovereign/shared

build-admin: build-shared ## Build admin dashboard
	$(NPM) run build -w @hybridsovereign/admin-dashboard

build-tenant: build-shared ## Build tenant dashboard
	$(NPM) run build -w @hybridsovereign/tenant-dashboard

build-admin-plugin: build-shared ## Build admin console plugin
	$(NPM) run build -w @hybridsovereign/admin-console-plugin

build-tenant-plugin: build-shared ## Build tenant console plugin
	$(NPM) run build -w @hybridsovereign/tenant-console-plugin

build: build-shared build-admin build-tenant build-admin-plugin build-tenant-plugin ## Build all packages

typecheck: ## Typecheck all packages
	$(NPM) run typecheck --workspaces --if-present

dev-admin: ## Start admin dashboard dev server (port 3000)
	$(NPM) run dev -w @hybridsovereign/admin-dashboard

dev-tenant: ## Start tenant dashboard dev server (port 3001)
	$(NPM) run dev -w @hybridsovereign/tenant-dashboard

clean: ## Remove build artifacts and node_modules
	rm -rf node_modules packages/*/node_modules packages/*/dist
