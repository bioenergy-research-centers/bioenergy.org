# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial vue app for client side rendering
- Initial express server for server side rendering
- Initial docker configuration
- GitHub Actions QC workflow
- Initial ESLint config file (eslint.config.js)
- Initial top-level package metadata files (package.json, package-lock.json)
- Script for data ingestion.
- API endpoint for data feed validation.
- Multi-schema support for views and data ingest / validation to support schema migration.
- API endpoints for schema listing and retrieval with pagination.
- MCP server for Agentic AI access.
- Database migrations via Umzug for schema changes the model cannot express, applied with `npm run migrate`. The server refuses to start while migrations are pending.
- Full text search index (`search_tsv` generated column with GIN index) covering specific
  dataset fields, replacing a per-request scan of the whole JSON document.

### Changed

- Dataset text search now supports quoted phrases, ranks results by relevance instead of
  date, applies English stemming, and no longer matches on JSON key names.

### Fixed

- Text searches containing unbalanced parentheses, colons, or other punctuation returned
  HTTP 500. Such queries are now parsed safely.

[unreleased]: https://github.com/bioenergy-research-centers/bioenergy.org/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/bioenergy-research-centers/bioenergy.org/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/bioenergy-research-centers/bioenergy.org/releases/tag/v0.0.1
