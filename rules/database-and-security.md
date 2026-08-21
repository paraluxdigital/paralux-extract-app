# Database & Security Guidelines

## Firestore Collections & Ownership
- **/users/{userId}**: User profile and credit balance. Read/write restricted to authenticated owner (`request.auth.uid == userId`).
- **/api_keys/{keyId}**: API keys for external access. Only the owner can read/create/update. Hard deletes are forbidden in security rules (revoke via status flag instead).
- **/usage_logs/{logId}**: Extraction audit log and token/cost telemetry. Client has read-only access for their own logs. Writes are restricted exclusively to the Cloud Functions backend (Admin SDK).
- **/extraction_queue/{jobId}**: Async job queue. Client read-only for job status. Writes managed exclusively by Cloud Functions backend.

## Security & Privacy Guardrails
1. **Zero Hardcoded Secrets**: Never commit API keys, service accounts, or private tokens. Always use `.env` or Firebase Secret Manager.
2. **Multi-Tenancy Isolation**: Always verify user ownership (`userId == auth.uid`) in backend endpoints and client queries to prevent IDOR vulnerabilities.
3. **Telemetry Separation**: Raw Gemini token counts, model identifiers, and internal cost metrics belong strictly in `/usage_logs`. Never return internal telemetry in public client responses.
4. **Security Rules Sync**: Whenever adding a new Firestore collection or field that impacts access control, update [`firestore.rules`](../firestore.rules) and test rules before deployment.
