# Verification Checklist

This document helps verify that the SaaS Starter Kit is working correctly.

## Pre-Flight Checks

- [ ] Docker Desktop is installed and running
- [ ] Ports 80, 5173, 8000, 5432 are available
- [ ] At least 4GB RAM available for Docker

## Build Verification

```bash
cd starter-kit
docker compose up --build
```

Expected output:
- [ ] All 4 services build successfully (nginx, frontend, backend, db)
- [ ] No build errors in logs
- [ ] Services start within 10 minutes

## Service Health Checks

### 1. Database
```bash
docker compose logs db | grep "ready to accept connections"
```
- [ ] PostgreSQL started successfully

### 2. Backend
```bash
curl http://localhost/api/health
```
Expected: `{"status":"ok"}`
- [ ] Backend responds to health check
- [ ] Database tables created
- [ ] Seed data loaded (check logs for "Created admin user")

### 3. Frontend
```bash
curl http://localhost/
```
- [ ] Frontend HTML loads
- [ ] No 502/503 errors

### 4. Nginx
- [ ] Nginx routes `/` to frontend
- [ ] Nginx routes `/api/` to backend
- [ ] No proxy errors in logs

## Functional Testing

### Authentication Flow

1. **Register New User**
   - [ ] Navigate to http://localhost/
   - [ ] Redirects to login page
   - [ ] Click "Register"
   - [ ] Enter email and password (8+ chars)
   - [ ] Successfully creates account
   - [ ] Redirects to dashboard

2. **Login**
   - [ ] Logout from dashboard
   - [ ] Login with admin@example.com / admin123
   - [ ] Successfully authenticates
   - [ ] Redirects to dashboard
   - [ ] Shows admin role

3. **Session Persistence**
   - [ ] Refresh page - still logged in
   - [ ] Session cookie is HttpOnly
   - [ ] Session expires after 24 hours

### Dashboard

- [ ] Shows user email
- [ ] Shows user role (Admin/User)
- [ ] Shows assigned tier
- [ ] Lists tier features
- [ ] Admin sees "Go to Admin Panel" link

### Admin Panel (admin@example.com only)

1. **Tier Management**
   - [ ] Lists existing tiers (Free, Pro, Enterprise)
   - [ ] Can create new tier with features JSON
   - [ ] Can delete tier
   - [ ] Features JSON validates

2. **User Management**
   - [ ] Lists all users
   - [ ] Shows current tier for each user
   - [ ] Can assign tier to user via dropdown
   - [ ] Assignment persists

3. **Feature Flags**
   - [ ] Lists all feature flags
   - [ ] Shows enabled/disabled state
   - [ ] Can toggle flags
   - [ ] Changes take effect immediately

### Feature Gating

1. **Test Advanced Reports Feature**
   ```bash
   # With admin user (has Enterprise tier with advanced_reports)
   curl -b cookies.txt http://localhost/api/features/example/advanced-feature
   ```
   - [ ] Admin with Enterprise tier: 200 OK
   - [ ] User without tier: 403 Forbidden
   - [ ] When flag disabled: 404 Not Found

2. **Frontend Feature Gate**
   - [ ] FeatureGate component shows upgrade prompt when access denied
   - [ ] Shows content when access granted

### API Endpoints

Test with curl or Postman:

```bash
# Health check
curl http://localhost/api/health

# List tiers (public)
curl http://localhost/api/tiers

# Register
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Login (saves cookie)
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}' \
  -c cookies.txt

# Get current user (requires auth)
curl -b cookies.txt http://localhost/api/auth/me

# List users (admin only)
curl -b cookies.txt http://localhost/api/admin/users

# List feature flags (admin only)
curl -b cookies.txt http://localhost/api/features
```

## Hot Reload Testing

### Backend Hot Reload
1. Edit `backend/routes/health.py`
2. Change return value to `{"status": "healthy"}`
3. Save file
4. Check logs for "Reloading..."
5. Test: `curl http://localhost/api/health`
6. [ ] Change reflected without restart

### Frontend Hot Reload
1. Edit `frontend/src/pages/Dashboard.jsx`
2. Change heading text
3. Save file
4. Check browser
5. [ ] Change reflected without restart

## Data Persistence

1. Create a new tier in admin panel
2. Stop services: `docker compose down`
3. Start services: `docker compose up`
4. [ ] Tier still exists
5. [ ] Admin user still exists
6. [ ] All data persisted

## Error Handling

### Authentication Errors
- [ ] Invalid credentials: 401 Unauthorized
- [ ] Missing session: 401 Unauthorized
- [ ] Expired session: 401 Unauthorized
- [ ] Non-admin accessing admin endpoint: 403 Forbidden

### Validation Errors
- [ ] Short password (<8 chars): 400 Bad Request
- [ ] Invalid email format: 400 Bad Request
- [ ] Duplicate email: 409 Conflict
- [ ] Invalid JSON in tier features: 400 Bad Request

### Resource Errors
- [ ] Non-existent tier: 404 Not Found
- [ ] Non-existent user: 404 Not Found
- [ ] Disabled feature flag: 404 Not Found

## Performance

- [ ] Initial build completes in <10 minutes
- [ ] Subsequent starts in <30 seconds
- [ ] API responses <100ms
- [ ] Frontend loads <2 seconds
- [ ] Hot reload <1 second

## Security

- [ ] Session cookie has HttpOnly flag
- [ ] Session cookie has SameSite=Strict
- [ ] Passwords are hashed (not plaintext in DB)
- [ ] Session encrypted (not readable in cookie)
- [ ] CORS configured correctly
- [ ] Admin endpoints require admin role

## CI/CD

```bash
# Trigger GitHub Actions (if repo is on GitHub)
git push origin main
```

- [ ] CI workflow runs
- [ ] Backend builds
- [ ] Frontend builds
- [ ] Tests pass (when implemented)
- [ ] Completes in <5 minutes

## Cleanup

```bash
# Stop and remove everything
docker compose down -v

# Remove images
docker rmi starter-kit-backend starter-kit-frontend starter-kit-nginx
```

## Common Issues

### Issue: Services won't start
**Check:** `docker compose logs`
**Fix:** `docker compose down -v && docker compose up --build`

### Issue: Port 80 in use
**Check:** `netstat -ano | findstr :80` (Windows)
**Fix:** Stop other service or change port in docker-compose.yml

### Issue: Database connection errors
**Check:** `docker compose logs db`
**Fix:** Wait 30 seconds for DB to initialize

### Issue: Frontend shows blank page
**Check:** Browser console for errors
**Fix:** Check nginx logs, verify proxy configuration

## Success Criteria

All checks above should pass. The application should:
- ✅ Start with single command
- ✅ Complete authentication flow
- ✅ Manage tiers and users
- ✅ Enforce feature gating
- ✅ Support hot reload
- ✅ Persist data across restarts
- ✅ Handle errors gracefully
- ✅ Meet performance targets

## Next Steps After Verification

1. Review code in `backend/` and `frontend/`
2. Read `.kiro/specs/` for detailed documentation
3. Customize for your use case
4. Add your own features
5. Deploy to production

---

**Note:** This is a starter kit. Customize it for your needs!
