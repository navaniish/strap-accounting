# Shop Management SaaS: Google Sign-In Redirect Loop Troubleshooting

Use this guide when a user selects **Continue with Google**, completes Google sign-in, and is sent back to `/login` instead of reaching the dashboard.

## Expected authentication flow

Only an email address that has already been registered by an administrator may access the Shop Management SaaS.

```text
User selects Continue with Google
        ↓
Google authenticates the selected Gmail account
        ↓
Google redirects to the application's OAuth callback URL
        ↓
Backend validates Google's response and finds the registered user
        ↓
Backend creates an application session and sends its session cookie
        ↓
Frontend loads the current user (/api/auth/me or equivalent)
        ↓
AuthProvider records the signed-in user
        ↓
ProtectedRoute permits access
        ↓
Dashboard
```

If the browser returns to `/login`, identify the first failed step in this chain before changing code.

## Rule: registered Gmail addresses only

Google successfully proving ownership of an email address is **not** enough to grant application access. The backend must look up the Google email (or its stable Google subject identifier) in the application's user database.

- Registered, active user: create a session and continue to the dashboard.
- Unregistered, disabled, or unauthorized user: do not create a session; return a clear message such as "This Google account is not registered. Ask an administrator for access."
- Do not rely on a frontend-only allowlist. The authorization check must run on the server.
- Normalize email addresses consistently before lookup (for example, trim whitespace and use lowercase), while retaining the original display email if desired.

## 1. Confirm which authentication system is in use

Before making changes, inspect the project configuration and authentication code.

| What you find | Likely system |
| --- | --- |
| `firebase` or `firebase-admin` | Firebase Authentication |
| `authlib`, `google-auth`, `google-auth-oauthlib`, `/auth/google`, or `/auth/google/callback` | Custom Google OAuth implementation |
| `@supabase/supabase-js`, Clerk, Auth0, NextAuth/Auth.js | Managed authentication provider |

Locate these pieces of code:

1. Google login button or sign-in entry point.
2. OAuth configuration and callback handler.
3. Session creation and cookie configuration.
4. "Current user" endpoint, commonly `/api/auth/me`, `/api/user`, or `/session`.
5. Frontend `AuthProvider`/`AuthContext`.
6. Dashboard guard, commonly `ProtectedRoute`, middleware, or a route loader.

The names vary, but each responsibility must exist exactly once and agree on how a user is considered signed in.

## 2. Reproduce the problem with browser tools open

Use a registered Gmail account first. Then repeat later with an unregistered Gmail account to verify authorization behavior.

1. Open the app in Chrome or Edge.
2. Open Developer Tools: right-click the page and choose **Inspect**.
3. Open **Console** and clear existing output.
4. Open **Network**, enable **Preserve log**, and clear existing requests.
5. Click **Continue with Google**.
6. Select the registered Gmail account.
7. Let the redirect complete, even if the app sends you back to `/login`.
8. Record the URL sequence and the first request that failed or returned an unexpected redirect.

Look especially for requests containing:

```text
auth
google
callback
session
me
user
login
```

Typical sequence:

```text
/auth/google
Google accounts pages
/auth/google/callback
/api/auth/me
/dashboard
```

## 3. Use the URL to narrow the issue

| Result after Google sign-in | Most likely area |
| --- | --- |
| Reaches `/dashboard`, then immediately returns to `/login` | Frontend loading/auth-state/route guard issue, or `/api/auth/me` is unauthorized |
| Reaches `/login?error=...` | OAuth callback, backend authorization, or session creation issue |
| Google displays `redirect_uri_mismatch` | Google Cloud OAuth redirect URI configuration |
| Browser reports CORS or "Failed to fetch" | Frontend/backend origin or credential configuration |
| Callback returns 401/403 | Registered-user lookup or token validation issue |
| Callback returns 500 | Inspect backend logs; often missing env vars, callback parsing, database lookup, or cookie setup |

## 4. Inspect the OAuth callback

Find the request made immediately after Google redirects back to the application. It may be a browser navigation rather than an API fetch.

Check the callback response:

1. It should return a successful response or a deliberate redirect to the application.
2. Its server logs should show that the Google authorization response was validated.
3. It should identify the Gmail address and perform the registered-user check.
4. For an authorized user, it must create an application session **before** redirecting to the frontend.
5. The response must include `Set-Cookie` if cookie sessions are used.
6. On rejection, it should return a purposeful error; it should not silently redirect as though the user merely needs to log in again.

Useful backend log points, with secrets and tokens redacted:

```text
OAuth callback reached
Google identity verified for email: user@example.com
Application user found: true
Application user active: true
Session created: true
Session cookie sent: true
Redirecting to: https://app.example.com/dashboard
```

Never log OAuth authorization codes, access tokens, ID tokens, session IDs, or cookie values.

## 5. Check the session cookie

After Google sign-in, open **Developer Tools → Application (or Storage) → Cookies** and select the application's domain.

Verify:

- An application session cookie exists after the callback.
- Its domain matches the frontend/API topology.
- Its path normally includes `/`.
- `HttpOnly` is enabled for a server session cookie.
- `Secure` is enabled in HTTPS environments.
- `SameSite` matches the deployment design.
- The cookie has not immediately expired.

### Common cookie causes

| Symptom | Likely fix |
| --- | --- |
| No `Set-Cookie` response header | Create the session in the callback response and attach the cookie to that exact response |
| `Set-Cookie` exists but browser stores nothing | Correct cookie domain/path, `Secure`, HTTPS, and `SameSite` values |
| Cookie is stored but not sent to API | Use correct domain/path and configure frontend requests to include credentials |
| Works locally but not in production | Production domain, HTTPS, proxy headers, or cross-site cookie policy differ |
| Cookie disappears after redirect | Check response order, duplicate cookie clearing, expiry, and frontend logout logic |

For a frontend and API on different sites, a cookie often needs `SameSite=None; Secure`; this requires HTTPS. If the frontend and API are same-site, prefer the stricter `Lax` or `Strict` setting when compatible with the flow. Match this to your actual domains; do not loosen cookie policy without need.

## 6. Check the current-user endpoint

After callback, the application normally calls an endpoint such as `/api/auth/me` to restore the signed-in user.

In Network, inspect that request:

- It must include the expected cookie or authorization header.
- It should return `200` and the correct authorized user.
- It should return only user-safe fields needed by the client.

Interpretation:

| `/api/auth/me` result | Meaning |
| --- | --- |
| `200` with correct user, then redirect still occurs | Frontend `AuthProvider` or `ProtectedRoute` is mishandling state |
| `401` or `403` | Session/cookie is missing, blocked, invalid, expired, or user authorization failed |
| CORS failure/no request visible | Browser prevented the credentialed request; fix origins and credentials |
| `500` | Diagnose the backend session/user lookup code |

Test this endpoint directly in the browser only if it uses cookie authentication and is safe to view. Its response should agree with what the UI believes about the current user.

## 7. Fix frontend auth loading, AuthProvider, and ProtectedRoute

The most common frontend redirect loop is treating "authentication is still loading" as "the user is signed out."

### AuthProvider requirements

On initial application load, the provider should:

1. Start with a distinct loading state, for example `isLoading: true`.
2. Request the current user endpoint with credentials enabled when using cookie sessions.
3. Store the user if the request returns `200`.
4. Store `null` only when the response conclusively means unauthenticated/unauthorized.
5. Set `isLoading: false` only after the request finishes.
6. Handle unexpected failures separately from a normal signed-out state so they can be diagnosed.

Conceptual state:

```text
Initial:      isLoading = true,  user = unknown
Session OK:   isLoading = false, user = current user
No session:   isLoading = false, user = null
API failure:  isLoading = false, user = null/error state, with error logged or shown appropriately
```

### ProtectedRoute requirements

The route guard must wait until authentication loading finishes.

```text
if auth is loading:
    render a loading state
else if no user:
    redirect to /login
else:
    render the protected page
```

Do not redirect to `/login` merely because `user` is temporarily `null` during the first render. That race condition commonly causes this loop:

```text
Dashboard mounts
→ AuthProvider starts /api/auth/me
→ ProtectedRoute sees user = null before request resolves
→ redirects to /login
→ valid session is never allowed to finish restoring
```

Also verify:

- The app uses one canonical auth state rather than multiple unrelated providers.
- The callback redirect points to a route that can wait for auth restoration.
- Login-page effects do not automatically redirect users away or clear sessions prematurely.
- Dashboard route guards and server middleware use consistent session rules.
- Logout logic only clears session after an intentional logout action.

## 8. Configure credentialed requests and CORS

If the frontend calls a separate backend origin and authentication uses cookies, both sides must explicitly support credentialed requests.

Frontend request examples:

```js
fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
```

```js
axios.get(`${API_URL}/api/auth/me`, { withCredentials: true })
```

Backend CORS requirements for cookie requests:

- Allow the exact frontend origin, for example `https://app.example.com`.
- Enable credentials.
- Allow the necessary methods and headers.
- Do **not** use `Access-Control-Allow-Origin: *` together with credentials; browsers reject that combination.
- Configure every deployed frontend origin separately (local development, staging, production), rather than allowing arbitrary origins.

If an API is behind a reverse proxy, ensure it forwards the original host and HTTPS information correctly. Incorrect proxy configuration can cause the application to issue non-secure cookies or calculate a wrong callback URL.

## 9. Verify Google OAuth configuration

In Google Cloud Console, open the OAuth client used by this application and check the authorized redirect URIs.

The redirect URI in code must match an authorized URI exactly, including:

- Scheme: `http` versus `https`
- Hostname/subdomain
- Port number
- Path
- Trailing slash

Example:

```text
Configured: https://api.example.com/auth/google/callback
Requested:  https://api.example.com/auth/google/callback
```

These are different and will fail:

```text
https://api.example.com/auth/google/callback
https://app.example.com/auth/google/callback
http://api.example.com/auth/google/callback
https://api.example.com/auth/google/callback/
```

Also confirm that the OAuth client ID and secret loaded by the running environment are the expected values. Treat these credentials as secrets; never place the client secret in frontend code.

## 10. Test in a disciplined order

Complete each test before moving to the next.

1. **Callback test:** Sign in with a registered Gmail. Confirm the OAuth callback succeeds.
2. **Authorization test:** Confirm server logs show the user was found and active.
3. **Cookie test:** Confirm the callback sends, and the browser stores, the session cookie.
4. **Session test:** Confirm `/api/auth/me` returns `200` for the same browser session.
5. **Frontend state test:** Confirm AuthProvider changes from loading to the correct user.
6. **Route test:** Confirm ProtectedRoute waits during loading and then renders the dashboard.
7. **Unregistered-user test:** Sign in with an unregistered Gmail. Confirm access is denied with a clear message and no dashboard access.
8. **Fresh-browser test:** Repeat in an incognito/private window to avoid stale cookies and cached state.
9. **Production test:** Repeat on the deployed HTTPS domain, not only localhost.

## Diagnostic matrix

| Observation | Where to look | Likely root cause | Next action |
| --- | --- | --- | --- |
| Google fails before callback | Google error page | Incorrect redirect URI | Match Google Cloud URI and application callback exactly |
| Callback is never reached | Network/backend logs | Wrong OAuth start URL, proxy, or redirect URI | Verify authorization URL and deployed callback route |
| Callback returns 403 for known user | Callback logs/database | Email lookup/active status mismatch | Normalize lookup and check registration/activation data |
| Callback succeeds but cookie missing | Callback response/Application cookies | Session not attached or cookie rejected | Inspect `Set-Cookie`, domain, `Secure`, `SameSite`, expiry |
| Cookie exists, `/me` returns 401 | `/me` request headers/backend logs | Cookie not sent or session not readable | Enable credentials, correct CORS/cookie domain, inspect session store |
| `/me` returns 200, UI redirects to login | AuthProvider/ProtectedRoute | Loading race or duplicate auth state | Add loading gate; use one authoritative provider |
| Browser reports CORS | Console/Network | Origin or credentials config | Allow exact origin and credentials on API; send credentials from client |
| Works locally, fails in production | Deployed network/cookies/proxy | HTTPS/domain/proxy configuration | Compare callback URI, cookie flags, CORS origins, forwarded headers |

## Final acceptance tests

The issue is resolved only when all of these are true:

- A registered, active Gmail account can complete Google sign-in and land on the dashboard.
- The app does not flash or redirect back to `/login` while restoring auth state.
- The OAuth callback verifies identity, enforces the registered-Gmail-only rule, and creates a session only for authorized users.
- The browser receives and retains the expected session cookie (or the chosen secure token mechanism works consistently).
- `/api/auth/me` (or equivalent) returns `200` with the current user after login and after a page refresh.
- Protected routes render a loading state until authentication is known, then allow the authorized user through.
- An unregistered or disabled Gmail account receives a clear denial and cannot access protected data.
- Credentialed API calls work without CORS errors in the deployed environment.
- The full flow works in a clean private/incognito browser window and in production HTTPS.

## Information to collect if the loop remains

Provide these items for focused diagnosis (redact secrets, tokens, and cookie values):

1. The browser URL sequence from clicking Google sign-in through the redirect.
2. Network entries for the callback and current-user endpoint, including status codes and response headers (especially the presence, not value, of `Set-Cookie`).
3. Console errors from the same attempt.
4. Whether the application session cookie appears in browser storage.
5. The code/configuration for the Google login trigger, OAuth callback, session creation, current-user endpoint, AuthProvider, and ProtectedRoute.
6. The authentication provider in use (Firebase, custom OAuth, Supabase, Clerk, Auth0, Auth.js/NextAuth, or another service).

With those details, the fault can be placed precisely in the OAuth callback, authorization rule, session/cookie layer, or frontend route handling.
