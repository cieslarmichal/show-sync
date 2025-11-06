# ShowSync

## Project Description

ShowSync helps groups pick a TV series to watch together. It uses everyone's favorite series to recommend a perfect match, ending the endless scrolling and debates.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

### How It Works

1. **Create Profiles**: Users add their favorite TV series.
2. **Start a Room**: One user creates a "watching room" and shares an invitation link.
3. **Get Recommendations**: The app analyzes the group's tastes and suggests 3-5 series with AI-powered justifications.

## Tech Stack

- **Framework**: [Astro](https://astro.build/) 5.0
- **UI Library**: [React](https://react.dev/) 19
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 4.0
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/)
- **External APIs**:
  - [OpenAI API](https://openai.com/docs/api-reference) for generating recommendations.
  - [TMDB API](https://www.themoviedb.org/documentation/api) for TV series data and images.

## Getting Started Locally

To run the project on your local machine, please follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository:**

    ```sh
    git clone https://github.com/cieslarmichal/showsync.git
    cd showsync
    ```

2. **Install dependencies:**

    ```sh
    npm install
    ```

3. **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file:

    ```sh
    cp .env.example .env
    ```

    You will need to add your API keys to the `.env` file:

    ```sh
    # Get your API key from https://platform.openai.com/
    OPENAI_API_KEY="your-openai-api-key"

    # Get your API key from https://www.themoviedb.org/
    TMDB_API_KEY="your-tmdb-api-key"
    ```

4. **Run the development server:**

    ```sh
    npm run dev
    ```

    The application will be available at `http://localhost:4321`.

## Available Scripts

You can run the following scripts from the project root:

- `npm run dev`: Starts the development server.
- `npm run start`: An alias for `npm run dev`.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run lint`: Lints the codebase for errors.
- `npm run lint:fix`: Lints the codebase and automatically fixes issues.

## Project Scope

This section outlines the features included in the Minimum Viable Product (MVP) and what is planned for future versions.

### In Scope (MVP)

- ✅ A fully functional web application.
- ✅ Recommendations for TV series only.
- ✅ Free access for all users.
- ✅ Persistent "watching room" links that do not expire.
- ✅ Users must create an account to add their preferences.

### Out of Scope (Future)

- ❌ Native mobile applications (iOS, Android).
- ❌ Recommendations for movies.
- ❌ Subscription models or other forms of monetization.
- ❌ History of past sessions and recommendations.
- ❌ A feedback system to rate recommendation accuracy.
- ❌ Advanced filtering for results (e.g., by genre, streaming platform).

## Project Status

The project is currently **in active development**.

### Implemented Features

- User registration and login (US-001, US-002)
- User logout (US-003)
- Search for series via TMDB API (US-004)
- Add/Remove series from a user's favorite list (US-005, US-007)
- View favorite series list (US-006)

### Upcoming Features

- Creating and managing "watching rooms" (US-008)
- Invitation system via shareable link (US-009)
- Joining a room (US-010)
- Recommendation generation via OpenAI API (US-011)
- Displaying group recommendations (US-012)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
