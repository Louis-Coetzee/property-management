# Multitenant Next.js Authentication System

A secure, custom authentication system built with Next.js, Convex, and Resend for multitenant applications.

## Features

- 🏢 **Multitenant Architecture**: Domain-based routing with `app/[domain]` structure
- 🔐 **Custom Authentication**: No third-party auth libraries - built from scratch
- 🛡️ **Security First**: bcrypt password hashing, email verification, session management
- 📧 **Email Integration**: Resend.com for verification and password reset emails
- ✅ **Live Password Validation**: Real-time password strength checking
- 🎨 **Professional UI**: Clean, modern design with Tailwind CSS
- 📱 **Responsive**: Mobile-first design approach
- ⚡ **Type Safe**: Full TypeScript support with strict type checking
- 🔍 **ESLint Ready**: Configured with Next.js ESLint rules

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Convex (serverless database and API)
- **Email**: Resend.com
- **Validation**: React Hook Form + Zod
- **Authentication**: Custom JWT-like sessions with bcrypt

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Convex account
- Resend account

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Set up Convex**:
```bash
npx convex dev
```
Follow the prompts to create/connect your Convex project.

3. **Set up environment variables**:
Create a `.env.local` file with:
```env
# Convex (auto-generated)
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Resend Email Service
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@yourdomain.com

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Start development server**:
```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Architecture

### Domain Routing

The application uses middleware to handle domain-based routing:
- Requests to any domain are routed to `/[domain]/...`
- Each domain acts as a separate tenant
- Middleware extracts the domain and routes accordingly

### Database Schema

**Users Table**:
- Personal information (name, email, contact)
- Secure password hashing with bcrypt
- Email verification status and tokens
- Multi-app access control with roles
- Domain-specific registration tracking

**Sessions Table**:
- Secure session token management
- Domain-specific sessions
- Automatic expiration

### Authentication Flow

1. **Registration**:
   - User fills registration form with live password validation
   - Password hashed with bcrypt (salt rounds: 12)
   - Email verification token generated
   - User assigned to registering domain with default "user" role
   - Verification email sent via Resend

2. **Email Verification**:
   - Click link in email to verify account
   - Token validated and marked as used
   - Account activated for login

3. **Login**:
   - Email and password validation
   - Check if email is verified
   - Generate secure session token on success
   - Store session in browser localStorage

4. **Session Management**:
   - Automatic session validation
   - Secure logout with token cleanup
   - Domain-specific session isolation

## File Structure

```
app/
├── [domain]/                    # Domain-specific routes
│   ├── auth/                   # Authentication pages
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   ├── verify-email/      # Email verification
│   │   ├── resend-verification/ # Resend verification
│   │   └── forgot-password/   # Password reset
│   ├── dashboard/             # User dashboard
│   ├── profile/               # User profile
│   ├── terms/                 # Terms and conditions
│   ├── privacy/               # Privacy policy
│   ├── layout.tsx             # Domain layout
│   ├── page.tsx               # Domain home page
│   ├── AuthProvider.tsx       # Authentication context
│   └── ConvexProvider.tsx     # Database context
├── layout.tsx                 # Root layout
└── globals.css               # Global styles

components/
├── Navbar.tsx                # Navigation component
└── PasswordValidator.tsx     # Password validation component

convex/
├── schema.ts                 # Database schema
├── auth.ts                   # Authentication functions
└── email.ts                  # Email functions

lib/
└── email.ts                  # Email service utilities

middleware.ts                 # Domain routing middleware
```

## Key Features Explained

### Multitenant App Access

Users can have access to multiple apps within the same authentication system:

```typescript
apps: {
  bookings: {
    calendarId: "abc123",
    grantedAt: timestamp,
    hasAccess: true,
    role: "user",
  },
  store: {
    storeId: "def456", 
    grantedAt: timestamp,
    hasAccess: false,
    role: "admin",
  },
}
```

### Password Security

- Minimum 8 characters
- Must contain uppercase letter
- Must contain lowercase letter  
- Must contain number
- Must contain special character
- Live validation during typing
- bcrypt hashing with salt rounds: 12

### Email Templates

Professional HTML email templates for:
- Email verification with branded design
- Password reset with security notices
- Responsive design for all devices

## Development

### Running Tests

```bash
# Type checking
npx tsc --noEmit

# Linting
npx eslint . --ext .ts,.tsx

# Build verification
npm run build
```

### Code Quality

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Consistent code formatting
- **Type Safety**: Full type coverage

## Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Deploy to your preferred platform** (Vercel, Netlify, etc.)

3. **Update environment variables** in production:
   - Set production CONVEX_DEPLOYMENT
   - Set production NEXT_PUBLIC_CONVEX_URL
   - Set production RESEND_API_KEY
   - Set production NEXT_PUBLIC_APP_URL

## Security Considerations

- ✅ Password hashing with bcrypt
- ✅ Email verification required
- ✅ Secure session token generation
- ✅ XSS protection with proper escaping
- ✅ CSRF protection via domain validation
- ✅ SQL injection prevention (NoSQL database)
- ✅ Input validation with Zod schemas
- ✅ Type safety with TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed description

---

Built with ❤️ using Next.js, Convex, and modern web technologies.