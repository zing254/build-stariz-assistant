# Security Policy

## Security Features

### Rate Limiting
- 60 requests per minute per IP address
- Returns HTTP 429 when exceeded
- Configurable in `backend/main.py`

### API Authentication (Optional)
- Bearer token authentication via `STARIZ_API_TOKEN` env var
- Public endpoints: `/`, `/health`, `/docs`, `/openapi.json`
- All other endpoints require valid token when enabled

### File Path Security
- Path traversal protection on all file operations
- Validates paths against allowed directories
- Prevents access to system files outside user home and /tmp

### CORS Configuration
- Development: permissive (`*`) for local development
- Production: should be restricted to specific origins

### Input Validation
- Pydantic models validate all request bodies
- Type checking and required field enforcement
- Automatic error responses for invalid input

## Reporting a Vulnerability

If you discover a security vulnerability, please:
1. Do NOT open a public issue
2. Contact the maintainer directly
3. Include a detailed description of the vulnerability
4. Include steps to reproduce

## Security Best Practices for Production

1. **Enable API Authentication**: Set `STARIZ_API_TOKEN` environment variable
2. **Restrict CORS**: Update `allow_origins` in `main.py` to specific domains
3. **Use HTTPS**: Deploy behind a reverse proxy with TLS
4. **Rotate Tokens**: Change `STARIZ_API_TOKEN` periodically
5. **Monitor Logs**: Check backend logs for suspicious activity
6. **Update Dependencies**: Regularly update Python and Node.js packages
7. **Limit File Access**: Configure allowed directories in `FileTools`
8. **Use Strong Models**: Consider using larger Ollama models for production

## Dependency Security

### Python Dependencies
- All dependencies pinned to specific versions in `requirements.txt`
- Regular security audits recommended
- Remove unused dependencies (done in v2.6.0)

### Node.js Dependencies
- `package-lock.json` ensures reproducible installs
- Run `npm audit` regularly to check for vulnerabilities
- Dev dependencies separated from production dependencies

## Offline Security

STARIZ is designed to run 100% offline:
- AI model runs locally via Ollama
- Voice STT uses Vosk (offline model)
- Voice TTS uses Piper (offline model)
- RAG uses ChromaDB (embedded database)
- No data is sent to external services

### Exceptions (External API Calls)
- Weather widget: Open-Meteo API (free, no key required)
- Crypto widget: CoinGecko API (free, no key required)
- News widget: Currently uses mock data (no external calls)

## Version History

| Version | Security Changes |
|---------|-----------------|
| 2.6.0 | Added rate limiting, optional auth, path traversal protection |
| 2.5.0 | Added path traversal protection to file tools |
