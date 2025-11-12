# ShowSync

**End the streaming debate. Start watching together.**

ShowSync is an intelligent TV series recommendation platform that eliminates the frustration of group decision-making. Using advanced AI analysis, it discovers the perfect shows that match everyone's taste—turning hours of scrolling and debating into minutes of confident choices.

## Table of Contents

- [Why ShowSync?](#why-showsync)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Product Strengths](#product-strengths)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Why ShowSync?

### The Problem

We've all been there: it's Friday night, everyone's ready to watch something together, but 30 minutes later you're still scrolling through Netflix, Disney+, and HBO Max. Each person suggests different shows, veto battles ensue, and the excitement fades into frustration.

**Traditional approaches fail because:**

- Manual discussion doesn't scale beyond 2-3 people
- Individual preferences conflict without clear resolution
- No systematic way to find common ground
- Time wasted browsing instead of watching

### The Solution

ShowSync transforms group entertainment decisions from chaos into confidence. Our AI-powered platform analyzes everyone's viewing preferences simultaneously and delivers curated recommendations that satisfy the entire group—complete with compelling justifications for why each show works for your unique mix of tastes.

**The result?** Less arguing, more watching. Less scrolling, more enjoying.

## Key Features

### 🎯 Smart Preference Management

- **Two-Tier Favoriting System**: Mark series as "like" or "love" to signal preference strength
- **Intelligent Ignore Lists**: Block series you've already seen or aren't interested in—never see them in recommendations
- **Rich Series Database**: Search and explore thousands of TV series with official data, descriptions, and artwork from TMDB
- **Flexible Preference Updates**: Change your mind anytime—update preferences as your taste evolves

### 👥 Collaborative Watch Rooms

- **Instant Room Creation**: Generate a unique, shareable link in seconds
- **Persistent Invitations**: Room links never expire—perfect for ongoing friend groups or family viewing
- **Effortless Joining**: No complex setup—just click the link and you're in
- **Participant Visibility**: See who's in your room and whose preferences are being considered

### 🤖 AI-Powered Recommendations

- **Multi-Model AI Engine**: Leverages OpenRouter.ai for access to OpenAI, Anthropic, Google, and other leading AI models
- **Contextual Justifications**: Each recommendation includes a detailed explanation of why it fits your group's combined preferences
- **Preference Prioritization**: "Love" preferences weighted more heavily than "like" for accurate matching
- **Smart Filtering**: Automatically excludes series on anyone's ignore list
- **Iterative Refinement**: Don't like a suggestion? Ignore it and regenerate for fresh options
- **Asynchronous Processing**: Recommendations generate in the background—no waiting, just check back when ready

### 📊 Quality Feedback Loop

- **Simple Rating System**: Thumbs up/down on recommendation quality
- **User-Driven Improvement**: Your feedback helps refine the AI's understanding
- **Per-Request Feedback**: Rate each recommendation session independently

### 🔐 Secure & Private

- **JWT Authentication**: Industry-standard token-based security
- **Token Rotation**: Automatic refresh for enhanced protection
- **Password Management**: Secure password change functionality
- **Privacy First**: Your viewing preferences are yours alone

## How It Works

**Getting started is simple—set up your profile, invite your group, and get recommendations in minutes.**

### Step 1: Create Your Profile

Register for a free account and start building your TV series preferences. Search from thousands of shows using our TMDB integration and mark your favorites:

- **"Love"** for series you're passionate about
- **"Like"** for shows you'd enjoy watching
- Add series to your **ignore list** to exclude them from recommendations

### Step 2: Build Your Preference Foundation

The more you add, the better your recommendations. Our AI learns from:

- Your favorite genres and themes
- Series you've marked as "love" (weighted more heavily)
- Shows you want to avoid
- Your unique viewing patterns

### Step 3: Create or Join a Watch Room

**Creating a room:**

- Click "Create Watch Room"
- Get a unique, shareable link instantly
- Send it to your friends, family, or partner

**Joining a room:**

- Click the invitation link
- Automatically join the group
- See who else is participating

### Step 4: Get AI-Powered Recommendations

Once everyone has joined and set their preferences:

- Request recommendations with one click
- AI analyzes all group members' preferences simultaneously
- Receive 5-10 curated series matches
- Each recommendation includes a detailed justification explaining why it works for your group

### Step 5: Review & Refine

Browse your recommendations and decide what to watch:

- Read AI-generated justifications for each series
- View official descriptions and artwork
- Not interested? Add it to your ignore list
- Regenerate for new options that avoid ignored series

### Step 6: Provide Feedback

Help improve the system:

- Rate recommendation quality with a simple thumbs up/down
- Your feedback refines the AI's understanding
- Better future recommendations for everyone

## Product Strengths

### 🚀 What Sets ShowSync Apart

#### 1. **AI That Actually Understands Groups**

Most recommendation engines optimize for individuals. ShowSync's AI is specifically designed for group decision-making, balancing multiple preferences simultaneously to find shows everyone will enjoy—not just compromises.

#### 2. **Transparent & Explainable AI**

No black box algorithms. Every recommendation comes with a clear, detailed justification explaining exactly why it matches your group's combined preferences. Make informed decisions with confidence.

#### 3. **Zero Friction Collaboration**

Forget complex invitations, account linking, or app downloads. Create a room, share a link, done. Works on any device with a browser—no barriers between you and your recommendations.

#### 4. **Persistent & Flexible**

Watch rooms don't expire. Perfect for:

- **Couples** with ongoing "what should we watch?" questions
- **Friend groups** planning regular viewing sessions
- **Families** coordinating across different schedules
- **Book clubs** transitioning to TV series clubs

Return to the same room whenever you need new recommendations.

#### 5. **Privacy-Focused Design**

Your viewing preferences are personal. ShowSync ensures:

- No data sharing with third parties
- Secure authentication with industry-standard JWT
- Individual preference control
- Optional participation in any room

#### 6. **Continuously Improving**

The feedback system creates a virtuous cycle:

- Users rate recommendation quality
- AI learns from aggregate feedback
- Future recommendations get better
- Everyone benefits from collective improvement

#### 7. **Built on Modern, Scalable Architecture**

- **Asynchronous processing** ensures fast, responsive experience
- **Monorepo structure** enables rapid feature development
- **Comprehensive testing** (unit, integration, E2E) guarantees reliability
- **Production-ready infrastructure** on Fly.io with Docker

### 💡 Use Cases

**Perfect for:**

- 👫 **Couples** ending the nightly "what do we watch?" debate
- 👨‍👩‍👧‍👦 **Families** finding shows everyone (kids and adults) can enjoy
- 👯 **Friend groups** planning regular watch parties or group discussions
- 🏠 **Roommates** discovering common ground for shared TV time
- 📚 **Virtual watch parties** where participants are geographically distributed
- 🎭 **Entertainment clubs** seeking curated, justified recommendations

## Tech Stack

ShowSync leverages modern, production-grade technologies chosen for performance, developer experience, and long-term maintainability. The architecture follows industry best practices with strict TypeScript, comprehensive testing, and type-safe APIs.

### Frontend

#### Core Framework & Language

- **[React](https://react.dev/) 19.2** - Component-based UI with concurrent rendering and server components support
- **[TypeScript](https://www.typescriptlang.org/) 5.9** - Strict mode enabled for maximum type safety and early error detection
- **[Vite](https://vitejs.dev/) 7.1** - Lightning-fast HMR and optimized production builds with native ESM

#### Routing & Navigation

- **[React Router](https://reactrouter.com/) 7.9** - Type-safe routing with data loading, nested routes, and automatic code splitting

#### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com/) 4.1** - Utility-first CSS with JIT compilation for optimal bundle sizes
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives (Dialog, Dropdown, Popover, etc.)
- **CSS Modules** - Scoped styling for component-specific styles

#### Forms & Validation

- **[React Hook Form](https://react-hook-form.com/) 7.66** - Performant, flexible forms with minimal re-renders
- **[Zod](https://zod.dev/) 4.1** - TypeScript-first schema validation with type inference

#### Why This Stack?

- **Performance**: Vite's dev server starts in milliseconds; React 19's concurrent features improve UX
- **Type Safety**: End-to-end type safety from forms to API with TypeScript + Zod + React Hook Form
- **Developer Experience**: Hot module replacement, type inference, and excellent IDE support
- **Accessibility**: Radix UI components follow WAI-ARIA patterns out of the box

### Backend

#### Runtime & Framework

- **[Node.js](https://nodejs.org/) 24.11** - Latest LTS with enhanced performance and native TypeScript support
- **[TypeScript](https://www.typescriptlang.org/) 5.9** - Strict mode for compile-time safety and better refactoring
- **[Fastify](https://fastify.dev/) 5.6** - High-performance web framework (3x faster than Express) with schema-based validation

#### Database & ORM

- **[PostgreSQL](https://www.postgresql.org/) 17** - ACID-compliant relational database with advanced features (JSONB, full-text search)
- **[Drizzle ORM](https://orm.drizzle.team/) 0.44** - Lightweight, type-safe ORM with zero runtime overhead and SQL-like syntax
- **Migrations** - Version-controlled schema changes with automatic SQL generation

#### Validation & Security

- **[TypeBox](https://github.com/sinclairzx81/typebox) 0.34** - JSON Schema Type Builder with static type inference for request/response validation
- **[JWT](https://jwt.io/)** - Stateless authentication with access/refresh token rotation for enhanced security
- **bcrypt** - Industry-standard password hashing (12+ rounds)

#### Logging & Observability

- **[Pino](https://getpino.io/) 10.1** - High-performance structured logging
- **Request Tracing** - Unique request IDs for distributed tracing and debugging

#### Testing

- **[Vitest](https://vitest.dev/) 3.2** - Vite-native test runner with Jest-compatible API and instant feedback

#### Why This Backend Stack?

- **Performance**: Fastify's low overhead and Pino's speed ensure sub-10ms response times for most endpoints
- **Type Safety**: TypeBox schemas provide both runtime validation and compile-time types
- **Developer Productivity**: Drizzle's SQL-like syntax is intuitive; Fastify's plugin system promotes modularity
- **Reliability**: PostgreSQL's ACID guarantees and comprehensive testing prevent data corruption

### External APIs & Services

#### AI & Machine Learning

- **[OpenRouter.ai](https://openrouter.ai/)** - Unified API gateway for multiple LLM providers (OpenAI GPT-4, Anthropic Claude, Google Gemini)
  - Enables model comparison and fallback strategies
  - Cost optimization through provider selection
  - No vendor lock-in

#### Content Database

- **[TMDB API](https://www.themoviedb.org/documentation/api)** - The Movie Database REST API
  - 500,000+ TV series with rich metadata
  - Official artwork, descriptions, and genre classifications
  - Regular updates with new releases

#### Email Delivery

- **[Resend](https://resend.com/)** - Modern transactional email API
  - Password reset emails
  - Account verification
  - High deliverability with built-in SPF/DKIM
  - Developer-friendly React email templates

### Infrastructure & DevOps

#### Monorepo Architecture

- **[Turborepo](https://turbo.build/) 2.5** - High-performance build system with intelligent caching
- **npm Workspaces** - Shared dependencies and scripts across frontend/backend
- **Workspace Benefits**: Shared TypeScript configs, unified linting, atomic commits

#### CI/CD & Deployment

- **GitHub Actions** - Automated testing, linting, and deployment on every push
- **[Fly.io](https://fly.io/)** - Global edge hosting with automatic SSL, health checks, and zero-downtime deployments
- **Docker** - Containerized builds for consistent environments (dev/staging/prod)

#### Testing Strategy

- **[Vitest](https://vitest.dev/)** - Unit and integration tests for business logic
- **[Playwright](https://playwright.dev/) 1.56** - Cross-browser E2E tests simulating real user workflows
- **Coverage Tracking** - Automated test coverage reports in CI pipeline

#### Why This Infrastructure?

- **Speed**: Turborepo's caching reduces build times by 60-80%
- **Reliability**: Playwright E2E tests catch regressions before production
- **Scalability**: Fly.io's multi-region deployment enables global low-latency access
- **Developer Workflow**: Monorepo enables coordinated changes across frontend/backend in a single PR

### Architecture Highlights

#### Type Safety Across Layers

```text
TypeBox Schema (Backend) → API Response → Zod Schema (Frontend) → React Hook Form
```

#### Security Layers

- JWT with token rotation (15min access, 7-day refresh)
- HTTP-only cookies for refresh tokens
- CORS with origin whitelisting
- Rate limiting on authentication endpoints
- SQL injection prevention via parameterized queries

#### Performance Optimizations

- Vite code splitting for 50KB+ initial bundle reduction
- PostgreSQL connection pooling
- Async recommendation generation prevents blocking
- Pino's async logging doesn't block the event loop

## Getting Started Locally

To run the project on your local machine, please follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) v24.11.1 or later (managed via [Volta](https://volta.sh/))
- [npm](https://www.npmjs.com/) v11.6.2 or later
- [PostgreSQL](https://www.postgresql.org/) 17 or later
- [Docker](https://www.docker.com/) and Docker Compose (optional, for containerized setup)

### Installation

1. **Clone the repository:**

    ```sh
    git clone https://github.com/cieslarmichal/show-sync.git
    cd show-sync
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Set up environment variables:**

    Create environment configuration files for both backend and frontend:

    **Backend (`apps/backend/config/local.json`):**

    ```json
    {
      "openRouter": {
        "apiKey": "your-openrouter-api-key"
      },
      "tmdb": {
        "apiKey": "your-tmdb-api-key",
      }
    }
    ```

    **Frontend (`apps/frontend/.env.local`):**

    ```sh
    VITE_API_URL=http://localhost:3000
    ```

    Get your API keys from:

    - OpenRouter: <https://openrouter.ai/>
    - TMDB: <https://www.themoviedb.org/settings/api>

4. **Set up the database:**

    Start PostgreSQL (if using Docker):

    ```sh
    docker-compose up -d postgres
    ```

    Run database migrations:

    ```sh
    npm run db:migrate --workspace=@apps/backend
    ```

5. **Build the project:**

    ```sh
    npm run build:dev
    ```

6. **Start the development servers:**

    In separate terminals:

    **Backend:**

    ```sh
    npm run dev --workspace=@apps/backend
    ```

    **Frontend:**

    ```sh
    npm run dev --workspace=@apps/frontend
    ```

    - Backend will be available at `http://localhost:3000`
    - Frontend will be available at `http://localhost:5173`

## Project Scope

This section outlines what's included in the current version and what's planned for the future.

### ✅ Current MVP Features

**Core Capabilities:**

- ✅ **Web-First Platform**: Fully accessible via any modern browser—no downloads required
- ✅ **TV Series Focus**: Specialized for TV series recommendations with rich metadata
- ✅ **Free Access**: No paywalls or subscriptions—completely free for all users
- ✅ **Persistent Rooms**: Watch room links never expire—use them indefinitely
- ✅ **Asynchronous AI**: Background processing with status tracking—no blocking waits
- ✅ **Secure Authentication**: JWT-based auth with automatic token rotation for enhanced security
- ✅ **Nuanced Preferences**: Two-tier system (like/love) for expressing preference strength
- ✅ **Smart Filtering**: Global ignore lists ensure you never see unwanted recommendations
- ✅ **Quality Feedback**: Rate recommendations to help improve the AI

**What This Means:**

- Start using ShowSync today with all core features
- No setup complexity or payment required
- Enterprise-grade security and reliability
- Continuous improvement through user feedback

### 🚧 Future Roadmap

**Planned Enhancements:**

- 📱 **Native Mobile Apps**: Dedicated iOS and Android applications for mobile-first experience
- 🎬 **Movie Support**: Expand beyond TV series to include movie recommendations
- 💎 **Premium Features**: Optional paid tiers with advanced capabilities (while keeping core features free)
- 📜 **Recommendation History**: Browse and revisit past recommendation sessions
- 🎭 **Advanced Filtering**: Filter by genre, streaming platform, release year, runtime, and more
- 📊 **Analytics Dashboard**: Insights into group viewing patterns and preference trends
- 🔗 **Platform Integration**: Direct links to streaming services for one-click watching
- 👥 **Social Features**: Share favorite recommendations, follow friends' preferences

**Not Planned (By Design):**

- ❌ Monetizing user data or selling to third parties
- ❌ Mandatory social features or public profiles
- ❌ Ads or sponsored recommendations

## Project Status

**Current Status**: 🚀 **Production-Ready MVP** with active development

### ✅ Released Features

ShowSync is live with a complete, production-ready feature set:

#### User Management & Security

- ✔️ **Complete Authentication Flow**: Registration, login, logout, and password management
- ✔️ **JWT Security**: Token-based authentication with automatic rotation
- ✔️ **Secure Password Handling**: Industry-standard bcrypt hashing

#### Series Discovery & Preferences

- ✔️ **TMDB Integration**: Access to thousands of TV series with official data
- ✔️ **Advanced Search**: Find series by title with rich metadata
- ✔️ **Two-Tier Favorites**: Express preferences with "like" and "love" levels
- ✔️ **Flexible Management**: Add, remove, and update series preferences anytime
- ✔️ **Ignore Lists**: Block unwanted series from all recommendations
- ✔️ **Comprehensive Views**: Browse your favorites and ignored series

#### Collaborative Features

- ✔️ **Instant Room Creation**: Generate unique, shareable watch rooms
- ✔️ **Persistent Invitations**: Room links that never expire
- ✔️ **Seamless Joining**: One-click entry via invitation links
- ✔️ **Participant Visibility**: See who's in your room

#### AI Recommendation Engine

- ✔️ **Multi-Model AI**: Powered by OpenRouter.ai with access to leading AI models
- ✔️ **Asynchronous Processing**: Background generation with status tracking
- ✔️ **Smart Matching**: 5-10 curated recommendations per request
- ✔️ **Contextual Justifications**: Detailed explanations for each recommendation
- ✔️ **Preference Weighting**: "Love" > "Like" for accurate prioritization
- ✔️ **Intelligent Filtering**: Automatic exclusion of ignored series
- ✔️ **Iterative Refinement**: Regenerate recommendations excluding newly ignored series

#### Quality & Feedback

- ✔️ **User Feedback System**: Thumbs up/down rating for recommendations
- ✔️ **Per-Request Ratings**: Independent feedback for each session
- ✔️ **Continuous Improvement**: AI learns from aggregate user feedback

### 🎯 What This Means

- **For Users**: All core features are available and stable—start using ShowSync today
- **For Developers**: Production-ready codebase with comprehensive testing and CI/CD
- **For Contributors**: Well-documented architecture ready for feature additions

### 🔮 Next Steps

The development team is actively working on:

- 📊 **Analytics & Insights**: Recommendation quality metrics and usage patterns
- 🎨 **UI/UX Enhancements**: Based on user feedback and usability testing
- ⚡ **Performance Optimization**: Faster recommendation generation and response times
- 🧪 **AI Model Testing**: Evaluating different models for improved recommendation quality

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
