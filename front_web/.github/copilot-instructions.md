# Frontend React - Cloud Project Setup Instructions

## Project Overview

This is a React frontend application built with Vite for a Spring Boot backend. It includes authentication pages (Login and Signin) that communicate with the backend's authentication endpoints.

## Key Features

- React application with Vite
- React Router for navigation
- Login and Signin pages
- JWT authentication with localStorage
- Axios for API calls
- Responsive design with CSS styling
- Protected routes

## Important Setup Configuration

### 1. Backend URL Configuration

The API is configured to connect to `http://localhost:8080` by default. If your backend runs on a different port or URL, update it in:

**File:** `src/services/api.js`

```javascript
const API_BASE_URL = 'http://localhost:8080'; // Change this if needed
```

### 2. CORS Configuration

Your Spring Boot backend must allow CORS requests from `http://localhost:5173`. Add this configuration to your backend:

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/auth/**")
                    .allowedOrigins("http://localhost:5173")
                    .allowedMethods("*")
                    .allowedHeaders("*");
            }
        };
    }
}
```

### 3. Backend Endpoints Required

Your backend must provide these endpoints:

**POST /auth/login**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response:
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**POST /auth/signin**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password"
}
```

Response: Same as login

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx           # Login page component
│   └── Signin.jsx          # Registration page component
├── services/
│   └── api.js              # Axios client with authentication logic
├── styles/
│   └── Auth.css            # Styling for authentication pages
├── App.jsx                 # Main app with routing
├── main.jsx                # Application entry point
└── App.css                 # Global styles
```

## Available Routes

- `/login` - Login page
- `/signin` - Registration page  
- `/dashboard` - Protected dashboard (accessible after login)
- `/` - Redirects to /login

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Development Server

- Runs on `http://localhost:5173`
- Hot Module Replacement (HMR) enabled
- Automatic reload on file changes

## Troubleshooting

### API Connection Issues

1. Verify your backend is running on the correct port
2. Check the `API_BASE_URL` in `src/services/api.js`
3. Ensure CORS is properly configured in your backend
4. Open browser DevTools → Network tab to inspect API requests

### Login/Signin Not Working

1. Check that your backend authentication endpoints match the expected format
2. Verify the response includes both `token` and `user` fields
3. Check browser console for error messages
4. Ensure backend returns proper HTTP status codes

### Styling Issues

Modify `src/styles/Auth.css` to customize the appearance of authentication pages.

## Next Steps

1. Start the development server with `npm run dev`
2. Ensure your Spring Boot backend is running
3. Test login at `http://localhost:5173/login`
4. Test registration at `http://localhost:5173/signin`
5. Add more pages/components as needed in `src/pages/` and `src/components/`

## Additional Resources

- [React Documentation](https://react.dev)
- [React Router Documentation](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com)
- [Vite Documentation](https://vitejs.dev)
