# Kompletny Schemat Bazy Danych dla ShowSync

## Tabele

### Tabela `users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator użytkownika (UUIDv7)
- `email` VARCHAR(255) UNIQUE NOT NULL  — Adres e-mail użytkownika, używany do logowania
- `name` VARCHAR(255) NOT NULL CHECK — Imię użytkownika
- `password` TEXT NOT NULL — Zahaszowane hasło użytkownika
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia konta

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `email` (UNIQUE)

---

### Tabela `user_sessions`

Przechowuje sesje użytkowników wraz z tokenami odświeżania dla mechanizmu rotacji tokenów.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator sesji (UUIDv7)
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `current_refresh_hash` TEXT NOT NULL UNIQUE — Hash aktualnego tokenu odświeżania
- `prev_refresh_hash` TEXT — Hash poprzedniego tokenu odświeżania (dla okna rotacji)
- `prev_usable_until` TIMESTAMP — Data wygaśnięcia poprzedniego tokenu
- `last_rotated_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data ostatniej rotacji tokenów
- `status` VARCHAR(16) NOT NULL DEFAULT 'active' — Status sesji ('active' | 'revoked')
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia sesji
- `updated_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data ostatniej aktualizacji

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `current_refresh_hash` (UNIQUE)
- `CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);` — Dla zapytań wyszukujących sesje użytkownika

---

### Tabela `watchrooms`

Reprezentuje "pokoje oglądania" tworzone przez użytkowników.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator pokoju (UUIDv7)
- `name` VARCHAR(64) NOT NULL — Nazwa pokoju np. "wieczór z dziewczyną", "oglądanie z kumplami"
- `description` VARCHAR(256) — Opis pokoju dla profilowania celu AI, np. "miniserial trzymający w napięciu"
- `owner_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator właściciela pokoju
- `public_link_id` VARCHAR(21) NOT NULL UNIQUE — Unikalny identyfikator używany w publicznych linkach zaproszeniowych (nanoid)
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia pokoju

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `public_link_id` (UNIQUE)
- `CREATE INDEX idx_watchrooms_owner_id ON watchrooms(owner_id);` — Dla zapytań filtrujących pokoje po właścicielu

---

### Tabela `user_favorite_series`

Tabela łącząca, przechowująca ulubione seriale dla każdego użytkownika.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator serialu z bazy danych TMDB
- `preference_level` VARCHAR(16) NOT NULL — Poziom preferencji ("like", "love")

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_user_favorite_series_user_id ON user_favorite_series(user_id);` — Dla zapytań pobierających ulubione seriale użytkownika
- `CREATE INDEX idx_user_favorite_series_user_series_tmdb_id ON user_favorite_series(user_id, series_tmdb_id);` — Dla szybkiego sprawdzania czy serial jest w ulubionych
- `CREATE INDEX idx_user_favorite_series_preference_level ON user_favorite_series(user_id, preference_level);` — Dla filtrowania po poziomie preferencji
- `CREATE UNIQUE INDEX uq_user_favorite_series_user_series ON user_favorite_series(user_id, series_tmdb_id);` — Zapewnia unikalność pary użytkownik-serial

---

### Tabela `user_ignored_series`

Tabela łącząca, przechowująca seriale ignorowane przez użytkownika. Seriale dodawane są do tej tabeli gdy użytkownik oznacza rekomendację jako "nie interesuje mnie".

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator serialu z bazy danych TMDB

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_user_ignored_series_user_id ON user_ignored_series(user_id);` — Dla zapytań pobierających listę ignorowanych seriali użytkownika
- `CREATE INDEX idx_user_ignored_series_user_series_tmdb_id ON user_ignored_series(user_id, series_tmdb_id);` — Dla szybkiego sprawdzania czy serial jest ignorowany
- `CREATE UNIQUE INDEX uq_user_ignored_series_user_series ON user_ignored_series(user_id, series_tmdb_id);` — Zapewnia unikalność pary użytkownik-serial

---

### Tabela `watchroom_participants`

Tabela łącząca, śledząca przynależność użytkowników do pokoi.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator
- `watchroom_id` UUID NOT NULL REFERENCES watchrooms(id) ON DELETE CASCADE — Identyfikator pokoju
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika (uczestnika)

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_watchroom_participants_watchroom_id ON watchroom_participants(watchroom_id);` — Dla zapytań pobierających uczestników pokoju
- `CREATE INDEX idx_watchroom_participants_user_id ON watchroom_participants(user_id);` — Dla zapytań wyszukujących pokoje użytkownika
- `CREATE INDEX idx_watchroom_participants_watchroom_user ON watchroom_participants(watchroom_id, user_id);` — Dla szybkiego sprawdzania uczestnictwa
- `CREATE UNIQUE INDEX uq_watchroom_participants ON watchroom_participants(watchroom_id, user_id);` — Zapewnia unikalność pary pokój-użytkownik

---

### Tabela `recommendation_requests`

Przechowuje żądania generowania rekomendacji dla pokojów. Każde żądanie może być w jednym z trzech stanów: oczekujące, ukończone lub nieudane.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator żądania (UUIDv7)
- `watchroom_id` UUID NOT NULL REFERENCES watchrooms(id) ON DELETE CASCADE — Identyfikator pokoju, dla którego generowane są rekomendacje
- `status` VARCHAR(16) NOT NULL — Status żądania ('pending' | 'completed' | 'failed')
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia żądania

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_recommendation_requests_watchroom_id ON recommendation_requests(watchroom_id);` — Dla zapytań pobierających żądania dla pokoju
- `CREATE INDEX idx_recommendation_requests_status ON recommendation_requests(status);` — Dla filtrowania po statusie

---

### Tabela `recommendations`

Przechowuje rekomendacje seriali wygenerowane przez AI dla konkretnego żądania rekomendacji.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator rekomendacji (UUIDv7)
- `recommendation_request_id` UUID NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE — Identyfikator żądania rekomendacji, do którego należy ta rekomendacja
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator polecanego serialu z bazy danych TMDB
- `justification` TEXT NOT NULL — Uzasadnienie rekomendacji wygenerowane przez AI
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia rekomendacji

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_recommendations_recommendation_request_id ON recommendations(recommendation_request_id);` — Dla zapytań pobierających rekomendacje dla danego żądania
- `CREATE INDEX idx_recommendations_series_tmdb_id ON recommendations(series_tmdb_id);` — Dla zapytań wyszukujących rekomendacje danego serialu

---

### Tabela `recommendation_feedback`

Przechowuje opinie użytkowników na temat wygenerowanych rekomendacji dla danego żądania.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator opinii (UUIDv7)
- `recommendation_request_id` UUID NOT NULL REFERENCES recommendation_requests(id) ON DELETE CASCADE — Identyfikator żądania rekomendacji
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika składającego opinię
- `rating` INTEGER NOT NULL — Ocena (1-5)
- `found_something` BOOLEAN NOT NULL — Czy użytkownik znalazł coś do obejrzenia
- `comment` TEXT — Opcjonalny komentarz użytkownika
- `created_at` TIMESTAMP NOT NULL DEFAULT NOW() — Data utworzenia opinii

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_recommendation_feedback_recommendation_request_id ON recommendation_feedback(recommendation_request_id);` — Dla zapytań pobierających opinie dla żądania
- `CREATE INDEX idx_recommendation_feedback_user_id ON recommendation_feedback(user_id);` — Dla zapytań pobierających opinie użytkownika
- `CREATE UNIQUE INDEX uq_recommendation_feedback_request_user ON recommendation_feedback(recommendation_request_id, user_id);` — Zapewnia że użytkownik może zostawić tylko jedną opinię na żądanie

---

## Relacje między tabelami

- **`users` ↔ `user_sessions` (Jeden-do-wielu)**
  - Jeden użytkownik (`users`) może mieć wiele aktywnych sesji (`user_sessions`).
  - Każda sesja należy do dokładnie jednego użytkownika.
  - Relacja zrealizowana przez klucz obcy `user_sessions.user_id`.

- **`users` ↔ `watchrooms` (Jeden-do-wielu)**
  - Jeden użytkownik (`users`) może być właścicielem wielu pokoi (`watchrooms`).
  - Każdy pokój ma dokładnie jednego właściciela.
  - Relacja zrealizowana przez klucz obcy `watchrooms.owner_id`.

- **`users` ↔ `user_favorite_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ulubionych seriali z różnymi poziomami preferencji (like/love).
  - Jeden serial może być ulubionym dla wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `user_favorite_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory TMDB).

- **`users` ↔ `user_ignored_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ignorowanych seriali.
  - Jeden serial może być ignorowany przez wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `user_ignored_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory TMDB).

- **`watchrooms` ↔ `watchroom_participants` ↔ `users` (Wiele-do-wielu)**
  - Jeden pokój może mieć wielu uczestników.
  - Jeden użytkownik może być uczestnikiem wielu pokoi.
  - Relacja zrealizowana przez tabelę łączącą `watchroom_participants`.

- **`watchrooms` ↔ `recommendation_requests` (Jeden-do-wielu)**
  - Jeden pokój (`watchrooms`) może mieć wiele żądań rekomendacji (`recommendation_requests`).
  - Każde żądanie należy do dokładnie jednego pokoju.
  - Relacja zrealizowana przez klucz obcy `recommendation_requests.watchroom_id`.

- **`recommendation_requests` ↔ `recommendations` (Jeden-do-wielu)**
  - Jedno żądanie rekomendacji (`recommendation_requests`) może mieć wiele rekomendacji (`recommendations`).
  - Każda rekomendacja należy do dokładnie jednego żądania.
  - Relacja zrealizowana przez klucz obcy `recommendations.recommendation_request_id`.

- **`recommendation_requests` ↔ `recommendation_feedback` ↔ `users` (Wiele-do-wielu)**
  - Jedno żądanie rekomendacji może mieć wiele opinii od różnych użytkowników.
  - Jeden użytkownik może zostawić opinie dla wielu żądań rekomendacji.
  - Każdy użytkownik może zostawić tylko jedną opinię na dane żądanie.
  - Relacja zrealizowana przez tabelę łączącą `recommendation_feedback`.

---

## Zasady Kontroli Dostępu (Application-Level Authorization)

Projekt świadomie rezygnuje z Row-Level Security na rzecz kontroli dostępu na poziomie aplikacji ze względu na implementacji serwera backendowego, które wykonuje autoryzację.

### Pokoje (`watchrooms`)

**Właściciel pokoju** (`owner_id`):

- Może przeglądać wszystkie dane pokoju
- Może edytować nazwę i opis pokoju
- Może usunąć pokój (CASCADE usuwa również `watchroom_participants`, `recommendation_requests`, `recommendations` i `recommendation_feedback`)
- Może zarządzać uczestnikami (dodawać/usuwać)
- Może generować nowe żądania rekomendacji

**Uczestnicy pokoju** (wpis w `watchroom_participants`):

- Mogą przeglądać dane pokoju
- Mogą przeglądać rekomendacje pokoju
- Mogą opuścić pokój (usunięcie własnego wpisu z `watchroom_participants`)
- Mogą zostawiać opinie na temat rekomendacji
- NIE mogą edytować pokoju ani zarządzać innymi uczestnikami

**Użytkownicy spoza pokoju**:

- Mogą dołączyć przez publiczny link (`public_link_id`) - automatycznie stają się uczestnikami
- NIE mogą przeglądać danych pokoju bez dołączenia

### Sesje (`user_sessions`)

**Właściciel sesji** (`user_id`):

- Może odświeżać swoje tokeny dostępu przy użyciu tokenu odświeżania
- Może wylogować się (unieważnienie sesji poprzez zmianę statusu na 'revoked')
- System automatycznie rotuje tokeny odświeżania przy każdym odświeżeniu
- Poprzedni token jest ważny przez krótki okres (okno rotacji) dla obsługi problemów z siecią

**Inni użytkownicy**:

- NIE mogą przeglądać ani modyfikować cudzych sesji

### Żądania rekomendacji (`recommendation_requests`)

**Właściciel pokoju**:

- Może tworzyć nowe żądania rekomendacji dla swojego pokoju
- Może sprawdzać status żądania (pending/completed/failed)
- Proces generowania jest asynchroniczny - po utworzeniu żądania, generowanie działa w tle

**Uczestnicy pokoju**:

- Mogą sprawdzać status żądania rekomendacji
- Mogą przeglądać rekomendacje z ukończonych żądań
- NIE mogą tworzyć żądań (tylko właściciel)

### Rekomendacje (`recommendations`)

**Właściciel pokoju**:

- Może przeglądać wszystkie rekomendacje dla najnowszego żądania w swoim pokoju
- Może wygenerować nowe żądanie rekomendacji (automatycznie tworzy nowe rekomendacje)

**Uczestnicy pokoju**:

- Mogą przeglądać wszystkie rekomendacje dla najnowszego żądania w pokoju
- Mogą dodawać seriale z rekomendacji do swojej listy ignorowanych
- NIE mogą modyfikować ani usuwać rekomendacji

**System AI**:

- Ma wyłączność na tworzenie wpisów w tabeli `recommendations`
- Tworzy rekomendacje asynchronicznie po utworzeniu żądania
- Użytkownicy nie mogą bezpośrednio dodawać/edytować rekomendacji

### Opinie o rekomendacjach (`recommendation_feedback`)

**Uczestnicy pokoju**:

- Mogą zostawić jedną opinię (ocena 1-5, informacja czy znaleźli coś do obejrzenia, opcjonalny komentarz) na dane żądanie rekomendacji
- Mogą przeglądać tylko własne opinie
- NIE mogą modyfikować opinii po jej złożeniu
- NIE mogą zostawić więcej niż jednej opinii na to samo żądanie

**Właściciel pokoju**:

- Może przeglądać wszystkie opinie dla żądań w swoim pokoju (przyszła funkcjonalność)
- Może zostawić własną opinię jako uczestnik

### Ulubione seriale (`user_favorite_series`)

**Właściciel danych** (`user_id`):

- Może przeglądać tylko **własne** ulubione seriale
- Może dodawać nowe ulubione seriale z poziomem preferencji (like/love)
- Może zmieniać poziom preferencji dla swoich ulubionych seriali
- Może usuwać swoje ulubione seriale

**Inni użytkownicy**:

- NIE mogą przeglądać ulubionych innych użytkowników
- NIE mogą modyfikować cudzych ulubionych

**Wyjątek - System AI**:

- Podczas generowania rekomendacji dla pokoju, system agreguje ulubione wszystkich uczestników
- Seriale oznaczone jako "love" mają wyższy priorytet w algorytmie rekomendacji
- Dostęp tylko w kontekście generowania rekomendacji (read-only)

### Ignorowane seriale (`user_ignored_series`)

**Właściciel danych** (`user_id`):

- Może przeglądać tylko **własne** ignorowane seriale
- Może dodawać nowe ignorowane seriale (poprzez oznaczenie rekomendacji jako "nie interesuje mnie")
- Może usuwać swoje ignorowane seriale

**Inni użytkownicy**:

- NIE mogą przeglądać ignorowanych innych użytkowników
- NIE mogą modyfikować cudzych ignorowanych

**Wyjątek - System AI**:

- Podczas generowania rekomendacji dla pokoju, system agreguje ignorowane seriale wszystkich uczestników
- Jeśli którykolwiek uczestnik ma serial w ignorowanych, serial NIE zostanie zarekomendowany
- Dostęp tylko w kontekście generowania rekomendacji (read-only)
