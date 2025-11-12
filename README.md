# ShowSync

A web application that helps groups of friends, families, or couples decide what TV series to watch together by generating AI-powered recommendations based on everyone's preferences.

## Table of Contents

- [Project Description](#project-description)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

ShowSync solves the common problem of choosing what to watch together. Instead of endless scrolling and debates, the application analyzes individual preferences from all group members and generates personalized recommendations that satisfy everyone.

Users create profiles with their favorite series (marked as "like" or "love"), then join or create "watch rooms" via shareable links. The system uses AI to analyze combined preferences and presents 5-10 well-matched series recommendations with detailed justifications. Series data including descriptions and posters are fetched from TMDB API.

## How It Works

1. **Create Your Profile**: Register and add your favorite TV series with preference levels (like/love)
2. **Build Preference Lists**: Search series via TMDB integration and curate your favorites or ignored lists
3. **Create or Join a Watch Room**: One person creates a room and shares the unique link with friends
4. **Get AI-Powered Recommendations**: The system analyzes everyone's preferences and generates 5-10 personalized series recommendations
5. **Review & Decide**: Browse recommendations with justifications, ignore unwanted series, and regenerate if needed
6. **Provide Feedback**: Rate recommendation quality to help improve future suggestions

## Tech Stack

### Frontend

- **Framework**: [React](https://react.dev/) 19.2
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.9 (strict mode)
- **Router**: [React Router](https://reactrouter.com/) 7.9
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.1
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) 7.66 with [Zod](https://zod.dev/) 4.1 validation
- **Build Tool**: [Vite](https://vitejs.dev/) 7.1

### Backend

- **Runtime**: [Node.js](https://nodejs.org/) 24.9
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.9 (strict mode)
- **Framework**: [Fastify](https://fastify.dev/) 5.6
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/) 0.44
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Validation**: [TypeBox](https://github.com/sinclairzx81/typebox) 0.34
- **Authentication**: [JWT](https://jwt.io/) with token rotation
- **Logging**: [Pino](https://getpino.io/) 10.1
- **Testing**: [Vitest](https://vitest.dev/) 3.2

### External APIs

- **AI Recommendations**: [OpenRouter.ai](https://openrouter.ai/) (access to OpenAI, Anthropic, Google, and other models)
- **Series Data**: [TMDB API](https://www.themoviedb.org/documentation/api)

### Infrastructure

- **Monorepo**: [Turborepo](https://turbo.build/) 2.5 with npm workspaces
- **CI/CD**: GitHub Actions
- **Hosting**: [Fly.io](https://fly.io/) with Docker
- **Testing**: [Vitest](https://vitest.dev/) for unit/integration, [Playwright](https://playwright.dev/) 1.56 for E2E

## Getting Started Locally

To run the project on your local machine, please follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) v24.11.1 or later (managed via [Volta](https://volta.sh/))
- [npm](https://www.npmjs.com/) v11.6.1 or later
- [PostgreSQL](https://www.postgresql.org/) 15 or later
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

## Available Scripts

You can run the following scripts from the project root:

### Development

- `npm run build` - Builds all apps for production
- `npm run build:dev` - Builds all apps in development mode
- `npm run test` - Runs all tests (unit, integration, E2E) in CI mode
- `npm run lint` - Lints all workspaces
- `npm run lint:fix` - Lints and automatically fixes issues

### Backend Scripts

Run from root with `--workspace=@apps/backend` or from `apps/backend`:

- `npm run dev` - Starts the backend development server with auto-reload
- `npm run build` - Builds backend for production
- `npm run start` - Starts the production backend server
- `npm run test` - Runs backend tests in watch mode
- `npm run test:ci` - Runs backend tests once (for CI)
- `npm run db:generate` - Generates Drizzle database migrations
- `npm run db:migrate` - Applies database migrations

### Frontend Scripts

Run from root with `--workspace=@apps/frontend` or from `apps/frontend`:

- `npm run dev` - Starts the frontend development server
- `npm run build` - Builds frontend for production
- `npm run test` - Runs frontend unit tests in watch mode
- `npm run test:unit` - Runs frontend unit tests once
- `npm run test:e2e` - Runs Playwright E2E tests
- `npm run test:e2e:ui` - Runs E2E tests with Playwright UI
- `npm run playwright:install` - Installs Playwright browsers

## Project Scope

This section outlines the features included in the Minimum Viable Product (MVP) and what is planned for future versions.

### In Scope (MVP)

- ✅ Web application accessible via browser
- ✅ TV series recommendations only
- ✅ Free access for all users
- ✅ Persistent watch room links that don't expire
- ✅ Asynchronous recommendation generation with status tracking
- ✅ User accounts required for participation
- ✅ JWT-based authentication with token rotation
- ✅ Preference levels (like/love) for series
- ✅ Global ignored series lists per user
- ✅ Feedback system for recommendation quality

### Out of Scope (Future Versions)

- ❌ Native mobile applications (iOS, Android)
- ❌ Movie recommendations
- ❌ Subscription models or monetization
- ❌ Historical session and recommendation browsing
- ❌ Advanced result filtering (by genre, streaming platform, etc.)

## Project Status

The project is currently **in active development** with core features implemented.

### ✅ Completed Features

#### User Management

- User registration with email and password
- User login and logout
- JWT authentication with token rotation
- Password change functionality

#### Series Preferences

- TMDB API integration for series search
- Add/remove series from favorites with preference levels (like/love)
- View and manage favorite series list
- Change preference levels for existing favorites
- Add/remove series from ignored list
- View ignored series list

#### Watch Rooms

- Create new watch rooms
- Generate unique shareable room links
- Join rooms via invitation links
- View room participants

#### AI Recommendations

- Asynchronous recommendation generation via OpenRouter.ai
- Status tracking for recommendation requests
- Display 5-10 AI-powered series recommendations with justifications
- Filter out ignored series from recommendations
- Regenerate recommendations excluding previously ignored series
- Preference prioritization (love > like)

#### Feedback System

- Submit feedback on recommendation quality
- One feedback per user per recommendation request
- Thumbs up/down rating system

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
