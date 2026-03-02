# Use bash as shell
SHELL := /bin/bash

# Pre-setup
PRISMA := bunx --bun prisma
AUTH_HEADER := "Authorization: Bearer $$(grep CRON_SECRET .env | cut -d'=' -f2 | tr -d '"')"
COLLECT_URL := http://localhost:5173/api/jobs/collect

# Phony targets
.PHONY: install dev prisma-format prisma-generate prisma-migrate workflow test-collect setup

# Default target: local dev run
all: dev

# Install deps w/ bun
install:
	@bun install

# Dev command: local
dev:
	@bun run dev

# Prisma format schema
prisma-format:
	@$(PRISMA) format

# Prisma generate types/client
prisma-generate:
	@$(PRISMA) generate

# Apply Prisma schema to dev db, trigger generators
prisma-migrate:
	@$(PRISMA) migrate dev

# Open workflow web view
workflow:
	@bunx workflow web

# Test: kick off local collection job
test-collect:
	@curl -s $(COLLECT_URL) -H $(AUTH_HEADER) | jq

# Full setup: migrate, start dev, run test-collect twice, then kill dev
setup:
	@$(PRISMA) migrate dev
	@bun run dev > /dev/null 2>&1 & DEV_PID=$$!; \
		echo "Dev server started (PID: $$DEV_PID). Waiting 30s..."; \
		sleep 30; \
		for i in 1 2; do \
			echo "Running test-collect ($$i/2)..."; \
			$(MAKE) test-collect; \
			echo "Waiting 60s..."; \
			sleep 60; \
		done; \
		echo "Killing dev server..."; \
		kill $$DEV_PID || true