APP_NAME := soifon
VERSION := $(shell grep '"version"' manifest.json | head -1 | sed 's/.*: "\(.*\)".*/\1/')

.PHONY: build clean version help

build: ## Package extension into a zip
	@echo "Packaging $(APP_NAME) v$(VERSION)..."
	@mkdir -p dist
	@zip -r dist/$(APP_NAME)-$(VERSION).zip \
		manifest.json \
		background/ \
		popup/ \
		icons/ \
		logo.svg \
		-x '*.DS_Store'
	@echo "Created dist/$(APP_NAME)-$(VERSION).zip"

build-all: build ## Build all targets (alias for build)

clean: ## Remove build artifacts
	@rm -rf dist/

version: ## Print current version
	@echo $(VERSION)

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
