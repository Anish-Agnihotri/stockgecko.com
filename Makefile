# Use bash as shell
SHELL := /bin/bash

# Pre-setup
PRISMA := bunx --bun prisma

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
	@curl -s http://localhost:5173/api/jobs/collect \
		-H "Authorization: Bearer $$(grep CRON_SECRET .env | cut -d'=' -f2 | tr -d '"')" | jq

# Full setup: migrate, start dev, run test-collect twice, then kill dev
setup:
	@$(PRISMA) migrate dev
	@bun run dev & DEV_PID=$$!; \
		echo "Waiting 30s..."; \
		sleep 30; \
		echo "Running test-collect (1/2)..."; \
		curl -s http://localhost:5173/api/jobs/collect \
			-H "Authorization: Bearer $$(grep CRON_SECRET .env | cut -d'=' -f2 | tr -d '"')" | jq; \
		echo "Waiting 60s..."; \
		sleep 60; \
		echo "Running test-collect (2/2)..."; \
		curl -s http://localhost:5173/api/jobs/collect \
			-H "Authorization: Bearer $$(grep CRON_SECRET .env | cut -d'=' -f2 | tr -d '"')" | jq; \
		echo "Waiting 60s..."; \
		sleep 60; \
		echo "Killing dev server..."; \
		sleep 60; \
		kill $$DEV_PID || true