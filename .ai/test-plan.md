# Plan Testów dla ShowSync

## 1. Wprowadzenie i cele testowania

**Cel główny:** Zapewnienie, że aplikacja spełnia wymagania funkcjonalne oraz niefunkcjonalne, działa stabilnie i bezpiecznie.

**Cele szczegółowe:**

- Weryfikacja modułów zarządzania użytkownikami, profilu, tworzenia pokojów i generowania rekomendacji.
- Sprawdzenie integracji między frontendem a backendem, w tym komunikacji z API TMDB i OpenRouter.
- Ujednolicenie narzędzi testowych:
  - **Backend:** Vitest + Supertest dla testów jednostkowych i API
  - **Frontend:** Vitest dla testów jednostkowych komponentów, Playwright dla testów E2E
- Testowanie wydajności zarówno backendu, jak i frontendu, z naciskiem na optymalizację czasu ładowania interfejsu użytkownika oraz responsywności aplikacji.

## 2. Zakres testów

### Frontend

- Widoki rejestracji, logowania, profilu użytkownika oraz pokoju.
- Komponenty UI, walidacja formularzy (React Hook Form z Zod) oraz interakcje użytkownika.
- Nawigacja z wykorzystaniem React Router oraz zachowanie interfejsu w stanach ładowania, błędu i sukcesu.

### Backend/API

- Logika biznesowa oparta na Fastify z walidacją danych przy użyciu TypeBox.
- Obsługa autoryzacji (JWT), sesji użytkowników i komunikacja z bazą PostgreSQL poprzez Drizzle ORM.
- Integracja z zewnętrznymi serwisami (TMDB, OpenRouter) oraz obsługa błędów.

### Integracja systemu

- Weryfikacja poprawności przepływu danych między aplikacją frontendową a API backendu.

### Bezpieczeństwo

- Testy mechanizmów uwierzytelnienia, autoryzacji oraz walidacji danych.
- Ochrona przed atakami XSS, CSRF oraz innymi zagrożeniami.

## 3. Typy testów do przeprowadzenia

### Testy jednostkowe (Unit Tests)

**Backend:**

- Framework: **Vitest**
- Zakres: Logika biznesowa, serwisy, helpery, walidacja
- Mockowanie: Zewnętrzne zależności (databaseClient, external APIs, services)
- Wykorzystanie: `createTestContext()`, `Generator` class, `vi.mock()`

**Frontend:**

- Framework: **Vitest + Testing Library**
- Zakres: Komponenty React, hooks, utils, walidacja formularzy (Zod)
- Mockowanie: API calls, React Router, context providers
- Environment: jsdom dla symulacji DOM

### Testy integracyjne (Integration Tests)

**Backend API:**

- Framework: **Vitest + Supertest**
- Zakres: Testowanie endpointów Fastify z rzeczywistą bazą danych (test environment)
- Proces:
  1. Setup: Migracje bazy danych (globalSetup)
  2. Test: Wywołanie endpointu przez Supertest
  3. Verify: Sprawdzenie response + stan bazy danych
  4. Cleanup: `truncateTables()` między testami
- Mockowanie: Zewnętrzne API (TMDB, OpenRouter)

**Frontend-Backend:**

- Weryfikacja kontraktów API między frontendem a backendem
- Testowanie przepływu danych end-to-end

### Testy end-to-end (E2E)

**Framework:** Playwright
**Konfiguracja:** Chromium/Desktop Chrome (zgodnie ze standardami projektu)

**Strategie:**

- **Page Object Model (POM):** Organizacja kodu testowego dla maintainability
- **Browser Context Isolation:** Każdy test w oddzielnej sesji przeglądarki
- **Visual Regression:** `expect(page).toHaveScreenshot()` dla kluczowych widoków
- **Trace Viewer:** Włączony dla debugowania błędów w CI/CD
- **Parallel Execution:** Przyspieszenie wykonania testów

**Scenariusze do pokrycia:**

1. **Pełny flow użytkownika:**
   - Rejestracja → Logowanie → Dodanie ulubionych seriali → Utworzenie pokoju → Generowanie rekomendacji
2. **Multi-user scenarios:**
   - Użytkownik A tworzy pokój
   - Użytkownik B dołącza przez link
   - Weryfikacja widoczności obu profili
   - Generowanie rekomendacji dla grupy
3. **Error handling:**
   - Próba dostępu do chronionej strony bez logowania
   - Próba dołączenia do nieistniejącego pokoju
   - Obsługa utraty połączenia podczas operacji
4. **Form validation:**
   - Walidacja pól rejestracji i logowania
   - Walidacja wyszukiwania seriali
   - Walidacja tworzenia pokoju

### Testy wydajnościowe (Performance Tests)

**Backend API:**

- Narzędzie: **k6** lub **Artillery**
- Typy testów:
  - Baseline test (10 VU, 1 min)
  - Load test (ramp-up 0→100 VU, plateau 5 min)
  - Stress test (znajdowanie breaking point do 500 VU)
  - Spike test (nagły skok 10→200 VU)
- Krytyczne endpointy:
  - `/api/watchrooms/:id/recommendations` (najcięższy)
  - `/api/users/login` (rate limiting)
  - `/api/series/search` (integracja TMDB)

**Frontend:**

- Narzędzia: **Lighthouse CLI**, **Chrome DevTools**, **WebPageTest**
- Metryki: TTFB, FCP, LCP, TTI, CLS
- Warunki testowe:
  - Desktop (Fast 4G)
  - Mobile (3G throttling)
  - Różne rozmiary ekranu

### Testy bezpieczeństwa (Security Tests)

- Mechanizmy uwierzytelnienia i autoryzacji (JWT)
- Walidacja danych wejściowych (TypeBox, Zod)
- Ochrona przed atakami: XSS, CSRF, SQL Injection
- Rate limiting na krytycznych endpointach
- Proper cookie handling (HTTP-only, Secure, SameSite)
- Dependency vulnerability scanning

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Moduł User - Testy API (Vitest + Supertest)

#### POST /api/users/register

**Testy pozytywne:**

- ✓ Rejestracja z poprawnymi danymi (unikalny email, silne hasło)
- ✓ Weryfikacja hashowania hasła (bcrypt, minimum 12 rounds)
- ✓ Zwrócenie danych użytkownika bez hasła w response

**Testy negatywne:**

- ✗ Rejestracja z istniejącym emailem → `ResourceAlreadyExistsError` (409)
- ✗ Nieprawidłowy format email → `InputNotValidError` (400)
- ✗ Hasło za słabe (< wymagane znaki) → `InputNotValidError` (400)
- ✗ Brakujące wymagane pola → `InputNotValidError` (400)

**Walidacja:**

- TypeBox schema validation
- Sanitizacja danych wejściowych

#### POST /api/users/login

**Testy pozytywne:**

- ✓ Poprawne logowanie zwraca access token w body
- ✓ Refresh token zapisany w HTTP-only cookie
- ✓ Cookie ma flagi: Secure, SameSite=strict
- ✓ Token zawiera poprawne claims (userId, email)

**Testy negatywne:**

- ✗ Błędny email → `UnauthorizedAccessError` (401)
- ✗ Błędne hasło → `UnauthorizedAccessError` (401)
- ✗ Nieistniejący użytkownik → `UnauthorizedAccessError` (401)
- ✗ Brakujące pola → `InputNotValidError` (400)

**Security:**

- Rate limiting (max 5 prób/min z IP)
- Generyczne komunikaty błędów (nie ujawniać czy email istnieje)

#### POST /api/users/refresh

**Testy pozytywne:**

- ✓ Odświeżenie tokenu z ważnym refresh token
- ✓ Nowy access token w response
- ✓ Rotacja refresh tokenów (nowy refresh token w cookie)

**Testy negatywne:**

- ✗ Brak refresh token → `UnauthorizedAccessError` (401)
- ✗ Nieprawidłowy refresh token → `UnauthorizedAccessError` (401)
- ✗ Wygasły refresh token → `UnauthorizedAccessError` (401)
- ✗ Manipulowany token (invalid signature) → `UnauthorizedAccessError` (401)

#### GET /api/users/profile

**Testy pozytywne:**

- ✓ Zwraca profil zalogowanego użytkownika
- ✓ Zawiera listę ulubionych seriali
- ✓ Poprawny format danych (zgodnie z TypeBox schema)

**Testy negatywne:**

- ✗ Brak authorization header → `UnauthorizedAccessError` (401)
- ✗ Nieprawidłowy access token → `UnauthorizedAccessError` (401)
- ✗ Wygasły access token → `UnauthorizedAccessError` (401)

#### PUT /api/users/profile/series

**Testy pozytywne:**

- ✓ Dodanie ulubionych seriali do profilu
- ✓ Aktualizacja istniejącej listy seriali
- ✓ Weryfikacja zapisu w bazie danych
- ✓ Transakcja bazodanowa (ACID)

**Testy negatywne:**

- ✗ Brak autoryzacji → `UnauthorizedAccessError` (401)
- ✗ Nieprawidłowa struktura danych → `InputNotValidError` (400)
- ✗ Błąd bazy danych → rollback transakcji

**Testy transakcji:**

- Rollback przy częściowym błędzie
- Weryfikacja stanu bazy przed i po operacji

### 4.2. Moduł WatchRoom - Testy API (Vitest + Supertest)

#### POST /api/watchrooms

**Testy pozytywne:**

- ✓ Utworzenie pokoju przez zalogowanego użytkownika
- ✓ Generowanie unikalnego invite code (UUID v7)
- ✓ Użytkownik ustawiony jako owner pokoju
- ✓ Zwrócenie pełnych danych pokoju z invite link

**Testy negatywne:**

- ✗ Brak autoryzacji → `UnauthorizedAccessError` (401)
- ✗ Nieprawidłowe dane pokoju → `InputNotValidError` (400)
- ✗ Brakujące wymagane pola → `InputNotValidError` (400)

#### GET /api/watchrooms/:id

**Testy pozytywne:**

- ✓ Zwraca szczegóły pokoju z listą uczestników
- ✓ Zawiera ulubione seriale wszystkich uczestników
- ✓ Owner pokoju jest oznaczony

**Testy negatywne:**

- ✗ Nieistniejący pokój → `ResourceNotFoundError` (404)
- ✗ Użytkownik nie jest uczestnikiem → `ForbiddenAccessError` (403)
- ✗ Brak autoryzacji → `UnauthorizedAccessError` (401)

#### POST /api/watchrooms/:inviteCode/join

**Testy pozytywne:**

- ✓ Dołączenie do pokoju przez prawidłowy invite code
- ✓ Użytkownik dodany do listy uczestników
- ✓ Idempotentność (użytkownik już w pokoju → nie duplikuj)
- ✓ Transakcja bazodanowa

**Testy negatywne:**

- ✗ Nieprawidłowy invite code → `ResourceNotFoundError` (404)
- ✗ Wygasły invite code → `OperationNotValidError` (400)
- ✗ Brak autoryzacji → `UnauthorizedAccessError` (401)

**Testy transakcji:**

- Rollback przy błędzie dodawania uczestnika
- Concurrent joins (advisory locks)

#### POST /api/watchrooms/:id/recommendations

**Testy pozytywne:**

- ✓ Generowanie rekomendacji (minimum 2 użytkowników)
- ✓ Wysłanie zbiorczych danych do OpenRouter API
- ✓ Parsowanie i zapis rekomendacji do bazy
- ✓ Zwrócenie rekomendacji z uzasadnieniami

**Testy negatywne:**

- ✗ Za mało uczestników (< 2) → `OperationNotValidError` (400)
- ✗ Brak autoryzacji → `UnauthorizedAccessError` (401)
- ✗ Użytkownik nie jest uczestnikiem → `ForbiddenAccessError` (403)
- ✗ Timeout OpenRouter API → `ExternalServiceError` (503)
- ✗ Invalid response z OpenRouter → `ExternalServiceError` (502)

**Testy integracji z External API:**

- Mockowanie OpenRouter w testach automatycznych
- Contract testing (struktura request/response)
- Retry strategy z exponential backoff
- Circuit breaker pattern
- Timeout handling (30s)

**Performance:**

- Rate limiting (max 10 req/min na pokój)
- Caching wyników (10 min TTL)

### 4.3. Moduł Series - Testy API (Vitest + Supertest)

#### GET /api/series/search?query=

**Testy pozytywne:**

- ✓ Wyszukiwanie seriali przez TMDB API
- ✓ Zwrócenie listy wyników z podstawowymi danymi
- ✓ Paginacja wyników
- ✓ Caching popularnych zapytań

**Testy negatywne:**

- ✗ Pusty query → `InputNotValidError` (400)
- ✗ Query za krótki (< 2 znaki) → `InputNotValidError` (400)
- ✗ TMDB API timeout → `ExternalServiceError` (503)
- ✗ TMDB rate limit (429) → retry with backoff

**Testy integracji TMDB:**

- Mockowanie w testach automatycznych
- Contract testing
- Error handling (timeout, rate limit, invalid response)

### 4.4. Testy bezpieczeństwa (Security Tests)

#### Authentication & Authorization

**JWT Security:**

- ✓ Access token wygasa po określonym czasie (15 min)
- ✓ Refresh token wygasa po określonym czasie (7 dni)
- ✗ Manipulowany token (invalid signature) → odrzucony
- ✗ Token z przyszłą datą iat → odrzucony
- ✓ Token revocation (logout)

**CORS:**

- ✓ Tylko trusted origins mają dostęp
- ✗ Request z nieautoryzowanej domeny → odrzucony

**Rate Limiting:**

- ✓ Auth endpoints: 5 prób/min z IP
- ✓ API endpoints: 100 req/min na użytkownika
- ✗ Przekroczenie limitu → 429 Too Many Requests

**Input Validation:**

- SQL Injection: Próby injection w parametrach (Drizzle ORM chroni)
- XSS: Próby wstrzyknięcia skryptów w input fields
- Command Injection: Próby wykonania poleceń systemowych

**Cookie Security:**

- ✓ HTTP-only flag (nie dostępne przez JavaScript)
- ✓ Secure flag (tylko HTTPS)
- ✓ SameSite=strict (ochrona CSRF)

### 4.5. Testy transakcji bazodanowych

**Scenariusze:**

1. **Multi-step write operations:**
   - Utworzenie pokoju + dodanie owner jako uczestnika
   - Rollback przy częściowym błędzie

2. **Concurrency handling:**
   - Jednoczesne dołączanie do pokoju (advisory locks)
   - Jednoczesne generowanie rekomendacji

3. **Isolation levels:**
   - Serializable dla critical flows
   - Read committed dla read-heavy operations

**Weryfikacja:**

- Stan bazy przed transakcją
- Stan bazy po udanej transakcji
- Stan bazy po rollback (bez zmian)
- Brak orphaned records

### 4.6. Frontend - Testy E2E (Playwright)

#### Scenariusz 1: Pełny flow użytkownika (Happy Path)

**Kroki:**

1. Przejście na stronę rejestracji
2. Wypełnienie formularza rejestracji
3. Automatyczne przekierowanie na dashboard
4. Wyszukanie i dodanie 3 ulubionych seriali
5. Utworzenie pokoju oglądania
6. Weryfikacja wygenerowanego invite link
7. Otwarcie pokoju w nowej karcie jako drugi użytkownik
8. Dołączenie drugiego użytkownika przez invite link
9. Weryfikacja widoczności obu profili w pokoju
10. Kliknięcie "Generuj rekomendacje"
11. Oczekiwanie na wyniki (loading state)
12. Weryfikacja wyświetlenia rekomendacji z uzasadnieniem

**Assercje:**

- URL changes correctly
- Success messages displayed
- Data persisted across navigation
- Loading states shown appropriately
- Error handling graceful

#### Scenariusz 2: Rejestracja i logowanie

**Test 1: Poprawna rejestracja**

- Wypełnienie formularza z poprawnymi danymi
- Weryfikacja success message
- Przekierowanie na dashboard

**Test 2: Walidacja formularza rejestracji**

- Pusty email → error message
- Nieprawidłowy format email → error message
- Hasło za krótkie → error message
- Niezgodne hasła → error message

**Test 3: Email już istnieje**

- Próba rejestracji z istniejącym emailem
- Wyświetlenie odpowiedniego błędu

**Test 4: Poprawne logowanie**

- Wypełnienie formularza logowania
- Przekierowanie na dashboard
- Weryfikacja zalogowanego stanu (header)

**Test 5: Błędne credentials**

- Błędny email/hasło → error message
- Brak przekierowania
- Pozostanie na stronie logowania

#### Scenariusz 3: Zarządzanie ulubionymi serialami

**Test 1: Wyszukiwanie seriali**

- Wpisanie zapytania w search box
- Debounce (300ms)
- Wyświetlenie wyników z TMDB
- Loading state podczas wyszukiwania

**Test 2: Dodawanie serialu do ulubionych**

- Kliknięcie na serial z wyników
- Serial pojawia się na liście ulubionych
- Persistence po refresh strony

**Test 3: Usuwanie serialu**

- Kliknięcie "Usuń" na serialu
- Serial znika z listy
- Persistence po refresh strony

**Test 4: Pusta lista**

- Wyświetlenie komunikatu "Brak ulubionych seriali"
- Prompt do dodania seriali

#### Scenariusz 4: Tworzenie i zarządzanie pokojami

**Test 1: Utworzenie pokoju**

- Kliknięcie "Utwórz pokój"
- Wypełnienie nazwy pokoju
- Weryfikacja utworzenia
- Weryfikacja invite link

**Test 2: Kopiowanie invite link**

- Kliknięcie "Kopiuj link"
- Feedback message "Skopiowano"

**Test 3: Pusta lista pokojów**

- Wyświetlenie komunikatu
- CTA do utworzenia pierwszego pokoju

#### Scenariusz 5: Dołączanie do pokoju

**Test 1: Dołączenie przez invite link**

- Otwarcie invite link
- Automatyczne dołączenie (jeśli zalogowany)
- Wyświetlenie pokoju

**Test 2: Dołączenie jako niezalogowany**

- Otwarcie invite link
- Przekierowanie na logowanie
- Po logowaniu → automatyczne dołączenie

**Test 3: Nieprawidłowy invite code**

- Próba otwarcia nieistniejącego linku
- Wyświetlenie błędu 404
- Link do strony głównej

#### Scenariusz 6: Generowanie rekomendacji

**Test 1: Niewystarczająca liczba uczestników**

- Tylko 1 uczestnik w pokoju
- Przycisk "Generuj" disabled
- Tooltip z informacją "Minimum 2 uczestników"

**Test 2: Udane generowanie**

- Minimum 2 uczestników
- Kliknięcie "Generuj rekomendacje"
- Loading state (spinner)
- Wyświetlenie wyników
- Każda rekomendacja ma tytuł, opis, uzasadnienie

**Test 3: Error handling**

- Symulacja błędu API (network offline)
- Wyświetlenie error message
- Możliwość retry

#### Scenariusz 7: Obsługa błędów i edge cases

**Test 1: Utrata połączenia**

- Symulacja offline mode
- Próba akcji wymagającej API
- Wyświetlenie error message
- Retry po przywróceniu połączenia

**Test 2: Session expiration**

- Wygaśnięcie access token
- Próba akcji chronionej
- Silent token refresh lub redirect na login

**Test 3: Unauthorized access**

- Próba dostępu do /profile bez logowania
- Redirect na /login
- Preservation of intended URL (redirect back after login)

#### Scenariusz 8: Visual Regression Testing

**Screenshot tests dla kluczowych widoków:**

- Login page
- Registration page
- Dashboard (empty state)
- Dashboard (with favorite series)
- Watch room details (empty)
- Watch room details (with participants)
- Recommendations results
- Mobile responsive views

**Assercje:**

- `expect(page).toHaveScreenshot()`
- Porównanie z baseline
- Flagowanie zmian wizualnych

#### Scenariusz 9: Responsive Design

**Test na różnych viewport:**

- Desktop (1920x1080)
- Tablet (768x1024)
- Mobile (375x667)

**Weryfikacja:**

- Menu navigation (mobile hamburger)
- Form layouts adaptują się
- Tabele/listy są scrollable
- Przyciski są clickable (touch targets min 44x44px)

## 5. Środowisko testowe

### 5.1. Lokalne środowisko deweloperskie

**Wymagania:**

- System: Linux
- Runtime: Node.js (latest LTS)
- Database: PostgreSQL 15+ (local instance)
- Package manager: npm (workspaces)

**Konfiguracja:**

- Dedykowana test database (osobna od development)
- Environment variables w `.env.test`
- Test data seeding przez `Generator` class
- Database migrations w `globalSetup.ts`

**Struktura:**

```
apps/backend/tests/
  ├── generator.ts          # Test data creation
  ├── globalSetup.ts        # DB migrations
  ├── unit/                 # Unit tests
  ├── integration/          # API tests (Supertest)
  └── helpers/              # Test utilities

apps/frontend/e2e/
  ├── fixtures/             # Playwright fixtures
  ├── pages/                # Page Object Models
  ├── tests/                # E2E test scenarios
  └── playwright.config.ts  # Playwright configuration
```

### 5.2. Środowisko CI/CD (GitHub Actions)

**Pipeline stages:**

1. **Install & Cache:**
   - npm ci (with dependency caching)
   - Playwright browsers installation

2. **Lint & Type Check:**
   - ESLint
   - TypeScript type checking

3. **Unit Tests (Backend):**
   - Run: `npm run test:unit --workspace=@apps/backend`

4. **Integration Tests (Backend API):**
   - Spin up test PostgreSQL (Docker service)
   - Run migrations
   - Run: `npm run test:integration --workspace=@apps/backend`
   - Cleanup: `truncateTables()`

5. **Unit Tests (Frontend):**
   - Run: `npm run test:unit --workspace=@apps/frontend`

6. **E2E Tests (Frontend):**
   - Build backend & frontend
   - Start services (Docker Compose)
   - Run: `npm run test:e2e --workspace=@apps/frontend`
   - Artifacts: Playwright traces, screenshots, videos

7. **Performance Tests (Optional - scheduled):**
   - k6 load tests
   - Lighthouse CI

**Test isolation:**

- Each test suite runs in isolated environment
- Parallel execution where possible
- No shared state between tests
- Clean database state for each integration test

**Artifact storage:**

- Playwright traces (on failure)
- Performance reports (Lighthouse)
- Test execution logs

### 5.3. Mockowanie usług zewnętrznych

**TMDB API:**

```typescript
// Mockowanie w testach jednostkowych
vi.mock('@/services/tmdbService', () => ({
  searchSeries: vi.fn().mockResolvedValue([
    { id: 1, name: 'Breaking Bad', ... },
    { id: 2, name: 'Better Call Saul', ... }
  ])
}));

// Contract testing - weryfikacja struktury
expect(response).toMatchObject({
  results: expect.arrayContaining([
    expect.objectContaining({
      id: expect.any(Number),
      name: expect.any(String),
      overview: expect.any(String)
    })
  ])
});
```

**OpenRouter API:**

```typescript
// Mockowanie w testach integracyjnych
vi.mock('@/services/openRouterService', () => ({
  generateRecommendations: vi.fn().mockResolvedValue({
    recommendations: [
      {
        seriesId: 123,
        title: 'The Wire',
        reasoning: 'Complex storytelling similar to Breaking Bad'
      }
    ]
  })
}));

// Error scenarios
mockService.mockRejectedValueOnce(
  new ExternalServiceError('OpenRouter timeout')
);
```

**Strategy:**

- **Unit tests:** Pełne mockowanie (vi.mock())
- **Integration tests:** Mockowanie external APIs, real database
- **E2E tests:** MSW (Mock Service Worker) dla API intercepting
- **Staging:** Periodic smoke tests z real APIs (cost monitoring)
- **Contract tests:** Weryfikacja agreement między consumer/provider

## 6. Narzędzia do testowania

### 6.1. Backend Testing Stack

**Vitest** - Test Runner

- Framework do testów jednostkowych i integracyjnych
- Konfiguracja: `vitest.config.js` w `apps/backend/`
- Features: Fast execution, ESM support, TypeScript support

**Supertest** - HTTP Testing Library

- Testowanie endpointów Fastify bez uruchamiania serwera
- Fluent API dla HTTP assertions
- Integracja z Vitest

```typescript
import request from 'supertest';
import { app } from '@/app';

test('POST /api/users/login', async () => {
  const response = await request(app.server)
    .post('/api/users/login')
    .send({ email: 'test@example.com', password: 'password123' })
    .expect(200);
    
  expect(response.body).toHaveProperty('accessToken');
});
```

**Test Utilities:**

- `createTestContext()` - Setup test environment with mocked dependencies
- `Generator` class - Create test data (users, rooms, series)
- `truncateTables()` - Clean database between tests
- `vi.mock()` - Mock external dependencies

### 6.2. Frontend Testing Stack

**Vitest + Testing Library** - Unit/Component Testing

- Testing React components
- User-centric queries (getByRole, getByLabelText)
- Environment: jsdom

```typescript
import { render, screen } from '@testing-library/react';
import { LoginForm } from './LoginForm';

test('shows validation error for invalid email', async () => {
  render(<LoginForm />);
  
  const emailInput = screen.getByLabelText('Email');
  await userEvent.type(emailInput, 'invalid-email');
  
  expect(screen.getByText('Invalid email format')).toBeInTheDocument();
});
```

**Playwright** - E2E Testing

- Browser automation (Chromium)
- Page Object Model support
- Visual regression testing
- Trace viewer for debugging

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password123');
  
  await expect(page).toHaveURL('/dashboard');
});
```

**MSW (Mock Service Worker)** - API Mocking

- Intercept network requests in E2E tests
- Consistent API mocking across tests
- Support for REST and GraphQL

### 6.3. Performance Testing Tools

**k6** - Backend Load Testing

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp-up
    { duration: '5m', target: 100 }, // Plateau
    { duration: '2m', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    http_req_failed: ['rate<0.01'],   // < 1% errors
  },
};

export default function () {
  const res = http.post('http://localhost:3000/api/users/login', {
    email: 'test@example.com',
    password: 'password123',
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has access token': (r) => r.json('accessToken') !== undefined,
  });
  
  sleep(1);
}
```

**Lighthouse CI** - Frontend Performance

```bash
# Run Lighthouse audit
lighthouse http://localhost:5173 \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-report.json

# CI Integration
npx @lhci/cli autorun
```

**Chrome DevTools** - Manual Performance Analysis

- Network throttling (Fast 3G, Slow 4G)
- Performance profiling

### 6.4. Security Testing Tools

**npm audit** - Dependency Vulnerability Scanning

```bash
npm audit --audit-level=moderate
```

**OWASP ZAP** - Security Testing

- Automated security scanning
- API security testing
- Penetration testing basics

### 6.5. CI/CD Tools

**GitHub Actions** - Automation Pipeline

- Workflow: `.github/workflows/test.yml`
- Parallel test execution
- Artifact storage
- Status checks for PRs

**Docker** - Test Environment

- PostgreSQL service container
- Application containers for E2E
- Consistent environment across CI/local

## 7. Harmonogram testów

### Faza 1: Przygotowanie i Setup (2-3 dni)

**Dzień 1: Konfiguracja środowiska testowego**

- ✅ Setup Vitest dla backendu (`vitest.config.js`)
- ✅ Setup Vitest dla frontendu z Testing Library
- ✅ Konfiguracja test database (PostgreSQL)
- ✅ Implementacja `globalSetup.ts` (migrations)
- ✅ Utworzenie `Generator` class dla test data

**Dzień 2: Setup Playwright**

- ✅ Instalacja Playwright (`npm i -D @playwright/test`)
- ✅ Inicjalizacja konfiguracji (Chromium only)
- ✅ Utworzenie struktury Page Object Model
- ✅ Setup fixtures i helpers
- ✅ Konfiguracja trace viewer

**Dzień 3: CI/CD Setup**

- ✅ GitHub Actions workflow (`.github/workflows/test.yml`)
- ✅ PostgreSQL service container
- ✅ Playwright browsers caching
- ✅ Test artifacts storage

### Faza 2: Testy Jednostkowe (Ciągły proces - równolegle z developmentem)

**Backend (Vitest):**

- Unit tests dla wszystkich serwisów i helperów
- Testy pisane przed/w trakcie implementacji (TDD approach)

**Frontend (Vitest + Testing Library):**

- Unit tests dla komponentów UI
- Tests dla custom hooks
- Tests dla utility functions

**Timeline:** Ongoing (każda nowa feature = nowe testy)

### Faza 3: Testy Integracyjne API (3-4 dni intensywnych testów)

**Tydzień 1: Moduł User (2 dni)**

- POST /api/users/register (pozytywne + negatywne)
- POST /api/users/login (auth flow)
- POST /api/users/refresh (token refresh)
- GET /api/users/profile (authorized access)
- PUT /api/users/profile/series (update profile)
- Security tests (JWT, rate limiting, validation)

**Tydzień 2: Moduł WatchRoom (2 dni)**

- POST /api/watchrooms (create room)
- GET /api/watchrooms/:id (room details)
- POST /api/watchrooms/:inviteCode/join (join flow)
- POST /api/watchrooms/:id/recommendations (generation)
- Transaction tests (rollback scenarios)
- Authorization tests (owner/participant permissions)

**Tydzień 3: Moduł Series + External APIs (1 dzień)**

- GET /api/series/search (TMDB integration)
- Mockowanie TMDB responses
- Error handling (timeout, rate limit)
- Contract testing

**Tydzień 4: Cross-Module Integration (1 dzień)**

- Complete user journeys through API
- Data consistency checks
- Performance baseline measurement

### Faza 4: Testy E2E Frontend (3-4 dni)

**Dzień 1: Basic Flows**

- Page Object Models implementation
- Registration flow
- Login flow
- Logout flow
- Navigation tests

**Dzień 2: Core User Journeys**

- Add favorite series flow
- Create watch room flow
- Join watch room flow (invite link)
- Profile management

**Dzień 3: Critical Path**

- Complete user journey: Register → Add Series → Create Room → Invite → Generate Recommendations
- Multi-user scenarios (2 browser contexts)
- Error handling and edge cases

**Dzień 4: Visual Regression + Responsive**

- Screenshot tests dla kluczowych widoków
- Responsive design tests (Desktop/Tablet/Mobile)
- Polish i cleanup

### Faza 5: Testy Wydajnościowe (2-3 dni - przed release)

**Dzień 1: Backend Performance**

- Setup k6 test scripts
- Baseline test (10 VU)
- Load test (100 VU, 5 min)
- Identify bottlenecks
- Database query optimization

**Dzień 2: Frontend Performance**

- Lighthouse audits (Desktop + Mobile)
- Network throttling tests
- Bundle size analysis
- Core Web Vitals measurement

**Dzień 3: Optimization & Re-test**

- Apply optimizations based on findings
- Re-run performance tests
- Document performance benchmarks
- Set performance budgets

### Faza 6: Security Testing (2 dni - przed production)

**Dzień 1: Automated Security Scanning**

- npm audit (dependency vulnerabilities)
- OWASP ZAP automated scan
- Authentication/Authorization tests
- Input validation tests

**Dzień 2: Manual Security Review**

- OWASP Top 10 verification
- Rate limiting verification
- Cookie security (HTTP-only, Secure, SameSite)
- CORS configuration review
- Sensitive data exposure check

### Faza 7: Testy Regresyjne (Ciągły proces w CI/CD)

**Automatyczne wykonanie przy każdym:**

- Pull Request (Unit + Integration)
- Merge do main branch (Unit + Integration + E2E)
- Pre-deployment (Full test suite + Performance)
- Scheduled nightly builds (Full suite + Security scan)

**Monitoring:**

- Test execution time trends
- Flaky test identification (<1% acceptance)
- Performance regression detection

### Summary Timeline

| Faza | Czas | Status |
|------|------|--------|
| Setup i Konfiguracja | 2-3 dni | ⏳ |
| Testy Jednostkowe | Ongoing | 🔄 |
| Testy Integracyjne API | 3-4 dni | ⏳ |
| Testy E2E Frontend | 3-4 dni | ⏳ |
| Testy Wydajnościowe | 2-3 dni | ⏳ |
| Security Testing | 2 dni | ⏳ |
| CI/CD Integration | 1 dzień | ⏳ |
| **Total Initial Setup** | **~2 tygodnie** | |

**Note:** Testy jednostkowe są pisane równolegle z developmentem (TDD approach). Timeline zakłada dedykowany czas na setup infrastruktury testowej oraz intensive testing sessions dla integration/E2E tests.

## 8. Kryteria akceptacji testów

### 8.1. Funkcjonalność

**Wymagania obowiązkowe:**

- ✅ Wszystkie krytyczne user journeys działają zgodnie z wymaganiami PRD
- ✅ Rejestracja i logowanie użytkowników działa poprawnie
- ✅ Zarządzanie ulubionymi serialami (add/remove) działa bez błędów
- ✅ Tworzenie i dołączanie do pokojów działa dla wszystkich scenariuszy
- ✅ Generowanie rekomendacji zwraca poprawne wyniki dla ≥2 uczestników
- ✅ Wszystkie formularze walidują dane wejściowe
- ✅ Error handling wyświetla odpowiednie komunikaty użytkownikowi

**Testy muszą przechodzić:**

- 100% critical path tests (E2E)
- 100% API integration tests

### 8.2. Stabilność

**System Reliability:**

- ✅ Brak critical bugs blokujących core functionality
- ✅ High priority bugs ≤ 2 przed release
- ✅ Medium/Low priority bugs documented i priorytetyzowane do next sprint

**Test Flakiness:**

- ✅ Flaky tests rate < 1%
- ✅ Wszystkie testy powtarzalne i deterministyczne
- ✅ Proper test isolation (no shared state)

**Database Integrity:**

- ✅ Transakcje bazodanowe działają poprawnie (ACID)
- ✅ Rollback scenarios działają jako expected
- ✅ Brak orphaned records po błędach
- ✅ Foreign key constraints respektowane

### 8.3. Wydajność

**Backend API:**

| Endpoint | p50 | p95 | p99 | Status |
|----------|-----|-----|-----|--------|
| POST /api/users/login | <100ms | <200ms | <500ms | ⏳ |
| GET /api/users/profile | <50ms | <100ms | <200ms | ⏳ |
| POST /api/watchrooms | <100ms | <200ms | <500ms | ⏳ |
| POST /api/watchrooms/:id/recommendations | <3s | <5s | <10s | ⏳ |
| GET /api/series/search | <200ms | <500ms | <1s | ⏳ |

**Load Testing Criteria:**

- ✅ System handles 100 concurrent users without degradation
- ✅ Error rate < 1% under normal load
- ✅ Database connection pool doesn't exhaust
- ✅ Graceful degradation under stress (500+ users)

**Frontend Performance:**

| Metric | Desktop | Mobile | Status |
|--------|---------|--------|--------|
| First Contentful Paint (FCP) | <1.8s | <3.0s | ⏳ |
| Largest Contentful Paint (LCP) | <2.5s | <4.0s | ⏳ |
| Time to Interactive (TTI) | <3.8s | <7.3s | ⏳ |
| Total Blocking Time (TBT) | <200ms | <600ms | ⏳ |
| Cumulative Layout Shift (CLS) | <0.1 | <0.1 | ⏳ |

**Lighthouse Score Targets:**

- Performance: ≥ 90 (Desktop), ≥ 80 (Mobile)
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

**Bundle Size:**

- Initial JS bundle: < 200KB (gzipped)
- Total page weight: < 1MB
- Images optimized (WebP, lazy loading)

### 8.4. Bezpieczeństwo

**Authentication & Authorization:**

- ✅ JWT tokens properly signed and verified
- ✅ Access token expires after 15 minutes
- ✅ Refresh token expires after 7 days
- ✅ Refresh token rotation implemented
- ✅ Token revocation on logout works
- ✅ Protected routes require valid access token
- ✅ Authorization checks prevent unauthorized access

**Input Validation:**

- ✅ All user inputs validated with TypeBox/Zod schemas
- ✅ SQL Injection attempts blocked (Drizzle ORM parametrized queries)
- ✅ XSS attempts sanitized
- ✅ No command injection vulnerabilities

**Security Headers:**

- ✅ CORS configured with trusted origins only
- ✅ Helmet.js security headers applied
- ✅ Content-Security-Policy configured
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff

**Cookie Security:**

- ✅ Refresh token in HTTP-only cookie
- ✅ Secure flag enabled (HTTPS only)
- ✅ SameSite=strict (CSRF protection)

**Rate Limiting:**

- ✅ Auth endpoints: 5 requests/min per IP
- ✅ API endpoints: 100 requests/min per user
- ✅ Proper 429 responses with Retry-After header

**Dependency Security:**

- ✅ npm audit shows no high/critical vulnerabilities
- ✅ Dependencies regularly updated
- ✅ Automated security scanning in CI/CD

**Sensitive Data:**

- ✅ Passwords hashed with bcrypt (≥12 rounds)
- ✅ No passwords in logs or error messages
- ✅ No PII in logs
- ✅ Tokens not exposed in URLs or logs
