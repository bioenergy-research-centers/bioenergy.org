// Set test environment variables before any module loads
process.env.BIOENERGY_ORG_DB_HOST = "test-db-host.invalid";
process.env.BIOENERGY_ORG_DB_USER = "test-db-user";
process.env.BIOENERGY_ORG_DB_PASSWORD = "test-db-password";
process.env.BIOENERGY_ORG_DB_NAME = "test-db-name";
process.env.BIOENERGY_ORG_DB_LOCAL_PORT = "99999";
process.env.BIOENERGY_ORG_CLIENT_URI = "http://test-client.invalid";
process.env.VITE_BIOENERGY_ORG_API_URI = "http://test-api.invalid";
process.env.TURNSTILE_SECRETKEY = "test-secret";
process.env.GITHUB_INBOX_REPO_TOKEN = "test-token";
process.env.GITHUB_INBOX_REPO_OWNER = "test-owner";
process.env.GITHUB_INBOX_REPO = "test-repo";
process.env.GITHUB_SERVICE_ENABLED = "false";
process.env.GITHUB_SERVICE_WRITE_ENABLED = "false";
process.env.MESSAGE_MENTION_STRING = "@test-user";
