# Use bash as shell
SHELL := /bin/bash

# Pre-setup
PRISMA := bunx --bun prisma

# Phony targets
.PHONY: install dev prisma-format prisma-generate prisma-migrate workflow

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