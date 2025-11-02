# Kompletny Schemat Bazy Danych dla 10x Series Matcher

## Tabele

### Tabela `users`

Przechowuje dane uwierzytelniające i podstawowe informacje o użytkownikach.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator użytkownika (UUIDv7)
- `email` VARCHAR(255) UNIQUE NOT NULL  — Adres e-mail użytkownika, używany do logowania
- `name` VARCHAR(255) NOT NULL CHECK — Imię
- `password` TEXT NOT NULL — Zahaszowane hasło użytkownika
- `createdAt` TIMESTAMP - data utworzenia konta

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `email` (UNIQUE)
- Automatyczny indeks na `username` (UNIQUE)

---

### Tabela `watchrooms`

Reprezentuje "pokoje oglądania" tworzone przez użytkowników.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator pokoju (UUIDv7)
- `name` VARCHAR(64) - nazwa pokoju np. wieczór z dziewczyną, oglądanie z kumplami
- `description` VARCHAR(256) - opis pokoju dla profilowania celu AI, np. miniserial trzymający w napięciu
- `owner_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator właściciela pokoju
- `public_link_id` VARCHAR(21) — Unikalny identyfikator używany w publicznych linkach zaproszeniowych (nanoid)

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `public_link_id` (UNIQUE)
- `CREATE INDEX idx_watchrooms_owner_id ON watchrooms(owner_id);` — Dla zapytań filtrujących pokoje po właścicielu

---

### Tabela `user_favorite_series`

Tabela łącząca, przechowująca ulubione seriale dla każdego użytkownika.

**Kolumny:**

- `id` UUID PRIMARY KEY — identyfikator
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator serialu z bazy danych TMDB
- `preference_level` VARCHAR(16) NOT NULL — Poziom preferencji ("like", "love")
- PRIMARY KEY (user_id, series_tmdb_id) — Złożony klucz główny zapewniający unikalność pary

**Indeksy:**

- Automatyczny indeks na `(user_id, series_tmdb_id)` (PRIMARY KEY)
- `CREATE INDEX idx_user_favorite_series_series_tmdb_id ON user_favorite_series(series_tmdb_id);` — Dla zapytań wyszukujących użytkowników danego serialu

---

### Tabela `user_ignored_series`

Tabela łącząca, przechowująca seriale ignorowane przez użytkownika. Seriale dodawane są do tej tabeli gdy użytkownik oznacza rekomendację jako "nie interesuje mnie".

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny identyfikator
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator serialu z bazy danych TMDB
- UNIQUE (user_id, series_tmdb_id) — Unikalność pary użytkownik-serial

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- Automatyczny indeks na `(user_id, series_tmdb_id)` (UNIQUE)
- `CREATE INDEX idx_user_ignored_series_user_id ON user_ignored_series(user_id);` — Dla zapytań pobierających listę ignorowanych seriali użytkownika

---

### Tabela `watchroom_participants`

Tabela łącząca, śledząca przynależność użytkowników do pokoi.

**Kolumny:**

- `id` UUID PRIMARY KEY — identyfikator
- `watchroom_id` UUID NOT NULL REFERENCES watchrooms(id) ON DELETE CASCADE — Identyfikator pokoju
- `user_id` UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE — Identyfikator użytkownika (uczestnika)
- PRIMARY KEY (watchroom_id, user_id) — Złożony klucz główny zapewniający unikalność pary

**Indeksy:**

- Automatyczny indeks na `(watchroom_id, user_id)` (PRIMARY KEY)
- `CREATE INDEX idx_watchroom_participants_user_id ON watchroom_participants(user_id);` — Dla zapytań wyszukujących pokoje danego użytkownika

---

### Tabela `recommendations`

Przechowuje rekomendacje seriali wygenerowane przez AI dla każdego pokoju.

**Kolumny:**

- `id` UUID PRIMARY KEY — Unikalny, sortowalny identyfikator rekomendacji (UUIDv7)
- `watchroom_id` UUID NOT NULL REFERENCES watchrooms(id) ON DELETE CASCADE — Identyfikator pokoju, dla którego jest ta rekomendacja
- `series_tmdb_id` INTEGER NOT NULL — Identyfikator polecanego serialu z bazy danych TMDB
- `justification` TEXT NOT NULL — Uzasadnienie rekomendacji wygenerowane przez AI

**Indeksy:**

- Automatyczny indeks na `id` (PRIMARY KEY)
- `CREATE INDEX idx_recommendations_watchroom_id ON recommendations(watchroom_id);` — Dla zapytań pobierających rekomendacje dla danego pokoju
- `CREATE INDEX idx_recommendations_series_tmdb_id ON recommendations(series_tmdb_id);` — Dla zapytań wyszukujących rekomendacje danego serialu

---

## Relacje między tabelami

- **`users` ↔ `watchrooms` (Jeden-do-wielu)**
  - Jeden użytkownik (`users`) może być właścicielem wielu pokoi (`watchrooms`).
  - Każdy pokój ma dokładnie jednego właściciela.
  - Relacja zrealizowana przez klucz obcy `watchrooms.owner_id`.

- **`users` ↔ `user_favorite_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ulubionych seriali.
  - Jeden serial może być ulubionym dla wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `user_favorite_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory).

- **`users` ↔ `user_ignored_series` ↔ `series` (Wiele-do-wielu)**
  - Jeden użytkownik może mieć wiele ignorowanych seriali.
  - Jeden serial może być ignorowany przez wielu użytkowników.
  - Relacja zrealizowana przez tabelę łączącą `user_ignored_series`. (Uwaga: dane seriali nie są przechowywane w naszej bazie, tylko ich identyfikatory).

- **`watchrooms` ↔ `watchroom_participants` ↔ `users` (Wiele-do-wielu)**
  - Jeden pokój może mieć wielu uczestników.
  - Jeden użytkownik może być uczestnikiem wielu pokoi.
  - Relacja zrealizowana przez tabelę łączącą `watchroom_participants`.

- **`watchrooms` ↔ `recommendations` (Jeden-do-wielu)**
  - Jeden pokój (`watchrooms`) może mieć wiele rekomendacji (`recommendations`).
  - Każda rekomendacja należy do dokładnie jednego pokoju.
  - Relacja zrealizowana przez klucz obcy `recommendations.watchroom_id`.

---

## Zasady Kontroli Dostępu (Application-Level Authorization)

Projekt świadomie rezygnuje z Row-Level Security na rzecz kontroli dostępu na poziomie aplikacji ze względu na implementacji serwera backendowego, które wykonuje autoryzację.

### Pokoje (`watchrooms`)

**Właściciel pokoju** (`owner_id`):

- Może przeglądać wszystkie dane pokoju
- Może edytować nazwę i opis pokoju
- Może usunąć pokój (CASCADE usuwa również `watchroom_participants` i `recommendations`)
- Może zarządzać uczestnikami (dodawać/usuwać)
- Może generować nowe linki zaproszeniowe (zmiana `public_link_id`)

**Uczestnicy pokoju** (wpis w `watchroom_participants`):

- Mogą przeglądać dane pokoju
- Mogą przeglądać rekomendacje pokoju
- Mogą opuścić pokój (usunięcie własnego wpisu z `watchroom_participants`)
- NIE mogą edytować pokoju ani zarządzać innymi uczestnikami

**Użytkownicy spoza pokoju**:

- Mogą dołączyć przez publiczny link (`public_link_id`) - automatycznie stają się uczestnikami
- NIE mogą przeglądać danych pokoju bez dołączenia

### Rekomendacje (`recommendations`)

**Właściciel pokoju**:

- Może przeglądać wszystkie rekomendacje dla swojego pokoju
- Może wygenerować nowe rekomendacje (wywołanie AI)
- Może usunąć rekomendacje

**Uczestnicy pokoju**:

- Mogą przeglądać wszystkie rekomendacje dla pokoju
- NIE mogą modyfikować ani usuwać rekomendacji

**System AI**:

- Ma wyłączność na tworzenie wpisów w tabeli `recommendations`
- Użytkownicy nie mogą bezpośrednio dodawać/edytować rekomendacji

### Ulubione seriale (`user_favorite_series`)

**Właściciel danych** (`user_id`):

- Może przeglądać tylko **własne** ulubione seriale
- Może dodawać nowe ulubione seriale
- Może usuwać swoje ulubione seriale

**Inni użytkownicy**:

- NIE mogą przeglądać ulubionych innych użytkowników
- NIE mogą modyfikować cudzych ulubionych

**Wyjątek - System AI**:

- Podczas generowania rekomendacji dla pokoju, system agreguje ulubione wszystkich uczestników
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
