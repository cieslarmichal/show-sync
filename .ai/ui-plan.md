# Architektura UI dla ShowSync

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla ShowSync została zaprojektowana z myślą o prostocie, intuicyjności i prowadzeniu użytkownika przez kluczowe funkcje aplikacji. Celem jest zapewnienie płynnego doświadczenia, od rejestracji i budowania profilu preferencji, aż po dołączenie do pokoju i otrzymanie rekomendacji seriali.

Struktura opiera się na kilku głównych widokach, które odpowiadają za poszczególne etapy interakcji użytkownika z aplikacją. Architektura jest zorientowana na zadania i w pełni zgodna z dostarczonym planem API. Wykorzystuje podejście "mobile-first", zapewniając responsywność i dostępność na różnych urządzeniach. Globalny stan autentykacji jest zarządzany centralnie, a nawigacja jest logiczna i przewidywalna, ułatwiając użytkownikom osiąganie ich celów.

## 2. Lista widoków

### 1. Strona powitalna / Dashboard

- **Nazwa widoku**: HomePage
- **Ścieżka widoku**: `/`
- **Główny cel**:
  - **Niezalogowany użytkownik**: Służy jako strona docelowa (landing page), która przedstawia wartość aplikacji i kieruje do rejestracji lub logowania.
  - **Zalogowany użytkownik**: Pełni rolę dashboardu, oferując szybki dostęp do głównych funkcji: tworzenia pokoju oraz przeglądania istniejących pokoi.
- **Kluczowe informacje do wyświetlenia**:
  - **Niezalogowany**: Hasło marketingowe, krótki opis działania, przyciski CTA ("Call to Action") do logowania i rejestracji.
  - **Zalogowany**: Lista pokoi, do których należy użytkownik, oraz wyraźnie widoczny przycisk do utworzenia nowego pokoju.
- **Kluczowe komponenty widoku**: `Header`, `Footer`, `WatchRoomList`, `CreateWatchRoomButton`.
- **UX, dostępność i względy bezpieczeństwa**: Widok jest publicznie dostępny. Logika komponentów dynamicznie renderuje treść w zależności od statusu autentykacji użytkownika. Stan pusty (brak pokoi) powinien zachęcać do stworzenia pierwszego.

### 2. Strona logowania / Rejestracji

- **Nazwa widoku**: LoginPage
- **Ścieżka widoku**: `/login`
- **Główny cel**: Umożliwienie użytkownikom uwierzytelnienia się lub założenia nowego konta.
- **Kluczowe informacje do wyświetlenia**: Formularz logowania i formularz rejestracji, przełączane za pomocą zakładek. Komunikaty o błędach walidacji lub logowania.
- **Kluczowe komponenty widoku**: `LoginForm`, `RegisterForm`, `Tabs`.
- **UX, dostępność i względy bezpieczeństwa**: Strona obsługuje przekierowania (np. po kliknięciu linku zapraszającego). Należy zaimplementować walidację po stronie klienta i serwera. Pola haseł muszą być maskowane.

### 3. Strona zarządzania ocenionymi serialami

- **Nazwa widoku**: SeriesPage
- **Ścieżka widoku**: `/series`
- **Główny cel**: Umożliwienie użytkownikowi zbudowania swojego profilu preferencji poprzez wyszukiwanie i dodawanie seriali do listy ocenionych oraz zarządzanie listą obserwowanych.
- **Kluczowe informacje do wyświetlenia**: Wyszukiwarka seriali, wyniki wyszukiwania, galeria plakatów ocenionych seriali, lista obserwowanych seriali.
- **Kluczowe komponenty widoku**: `SearchSeries`, `SeriesRatingList`, `SeriesWatchlistList`.
- **UX, dostępność i względy bezpieczeństwa**: Dostęp chroniony, tylko dla zalogowanych użytkowników. Wyszukiwarka powinna wykorzystywać mechanizm "debounce" do optymalizacji zapytań API. Lista ocenionych seriali powinna obsługiwać paginację (np. "infinite scroll").

### 4. Strona zarządzania pokojami

- **Nazwa widoku**: WatchRoomsPage
- **Ścieżka widoku**: `/watchrooms`
- **Główny cel**: Centralne miejsce do tworzenia nowych pokoi oraz przeglądania listy wszystkich pokoi, w których użytkownik jest uczestnikiem.
- **Kluczowe informacje do wyświetlenia**: Formularz do tworzenia nowego pokoju, paginowana lista istniejących pokoi (z informacją o nazwie, liczbie uczestników).
- **Kluczowe komponenty widoku**: `CreateWatchRoomModal`, `WatchRoomList`.
- **UX, dostępność i względy bezpieczeństwa**: Dostęp chroniony. Formularz tworzenia pokoju może być zrealizowany jako modal, aby nie przeładowywać strony. Lista pokoi powinna być paginowana w celu zapewnienia wydajności.

### 5. Strona szczegółów pokoju

- **Nazwa widoku**: RoomPage
- **Ścieżka widoku**: `/watchrooms/:watchroomId`
- **Główny cel**: Główny ekran interakcji grupowej. Wyświetla uczestników, pozwala na generowanie rekomendacji i prezentuje wyniki.
- **Kluczowe informacje do wyświetlenia**: Nazwa i opis pokoju, lista uczestników, link zaproszeniowy, sekcja z rekomendacjami (obsługująca stany: pusty, ładowania, z wynikami).
- **Kluczowe komponenty widoku**: `ParticipantList`, `InviteLinkButton`, `RecommendationSection`.
- **UX, dostępność i względy bezpieczeństwa**: Dostęp chroniony, tylko dla uczestników pokoju. UI musi dynamicznie ukrywać/deaktywować akcje w zależności od roli użytkownika (właściciel vs. uczestnik). Generowanie rekomendacji jest asynchroniczne i UI powinno informować o tym procesie (np. przez polling i aktualizację statusu). Usunięcie uczestnika (przez właściciela) musi być potwierdzone modalem.

### 6. Publiczna strona dołączenia do pokoju

- **Nazwa widoku**: JoinRoomPage
- **Ścieżka widoku**: `/join/:publicLinkId`
- **Główny cel**: Poinformowanie niezalogowanego lub niebędącego członkiem użytkownika o pokoju, do którego został zaproszony, i ułatwienie mu dołączenia.
- **Kluczowe informacje do wyświetlenia**: Nazwa pokoju, nazwa założyciela, liczba uczestników, przycisk CTA "Dołącz".
- **Kluczowe komponenty widoku**: `RoomInfoCard`, `JoinButton`.
- **UX, dostępność i względy bezpieczeństwa**: Strona publiczna. Po kliknięciu "Dołącz", użytkownik jest kierowany do logowania/rejestracji z odpowiednim przekierowaniem zwrotnym do pokoju po pomyślnym uwierzytelnieniu.

### 7. Strona profilu użytkownika

- **Nazwa widoku**: ProfilePage
- **Ścieżka widoku**: `/profile`
- **Główny cel**: Umożliwienie użytkownikowi zarządzania podstawowymi danymi swojego konta, takimi jak zmiana hasła czy usunięcie konta.
- **Kluczowe informacje do wyświetlenia**: Dane użytkownika (nazwa, email), formularz zmiany hasła, przycisk do usunięcia konta.
- **Kluczowe komponenty widoku**: `ChangePasswordForm`, `DeleteAccountButton`.
- **UX, dostępność i względy bezpieczeństwa**: Dostęp chroniony. Operacja usunięcia konta jest operacją destrukcyjną i musi być zabezpieczona modalem z prośbą o potwierdzenie.

## 3. Mapa podróży użytkownika

Główny przepływ użytkownika obejmuje stworzenie konta, zdefiniowanie swoich preferencji, utworzenie pokoju, zaproszenie znajomych i wygenerowanie rekomendacji.

1. **Rejestracja i budowanie profilu**:
    - Użytkownik trafia na `HomePage (/)`, klika "Zarejestruj się", co przenosi go na `LoginPage (/login)`.
    - Po pomyślnej rejestracji jest przekierowywany na `HomePage (/)`, która teraz działa jako dashboard.
    - Z nawigacji przechodzi do `SeriesPage (/series)`, gdzie wyszukuje i dodaje seriale do swojej listy ocenionych.
2. **Tworzenie pokoju i zapraszanie**:
    - Użytkownik przechodzi do `WatchRoomsPage (/watchrooms)` lub klika "Stwórz pokój" na dashboardzie.
    - Wypełnia formularz i tworzy nowy pokój, po czym zostaje przekierowany na `RoomPage (/watchrooms/:watchroomId)`.
    - Na stronie pokoju kopiuje link zaproszeniowy i wysyła go znajomym.
3. **Dołączanie do pokoju**:
    - Zaproszony użytkownik otwiera link, lądując na `JoinRoomPage (/join/:publicLinkId)`.
    - Widzi informacje o pokoju i klika "Dołącz". Zostaje przekierowany na `LoginPage (/login)`, aby się zalogować/zarejestrować.
    - Po uwierzytelnieniu jest automatycznie dodawany do pokoju i przekierowywany na `RoomPage (/watchrooms/:watchroomId)`.
4. **Generowanie i przeglądanie rekomendacji**:
    - Właściciel pokoju, będąc na `RoomPage (/watchrooms/:watchroomId)`, widzi zaktualizowaną listę uczestników.
    - Klika przycisk "Generuj rekomendacje". UI informuje o rozpoczęciu procesu.
    - Po zakończeniu generowania (wykrytym przez polling), w sekcji rekomendacji pojawia się lista 3-5 polecanych seriali wraz z uzasadnieniem.

## 4. Układ i struktura nawigacji

Aplikacja będzie posiadać spójny, globalny układ składający się z nagłówka (`Header`), głównej treści strony oraz stopki (`Footer`).

- **Nagłówek (`Header`)**: Będzie zawierał logo aplikacji oraz główną nawigację.
  - **Dla niezalogowanych użytkowników**: Linki do "Logowanie" i "Rejestracja".
  - **Dla zalogowanych użytkowników**: Linki do "Dashboard" (`/`), "Moje Seriale" (`/series`), "Pokoje" (`/watchrooms`), "Profil" (`/profile`) oraz przycisk "Wyloguj".
- **Nawigacja**: Nawigacja jest scentralizowana w komponencie `Header`, zapewniając łatwy dostęp do wszystkich kluczowych widoków z dowolnego miejsca w aplikacji.
- **Struktura chroniona**: Dostęp do stron `/series`, `/watchrooms`, `/watchrooms/:watchroomId` i `/profile` będzie chroniony. Użytkownicy bez aktywnej sesji zostaną automatycznie przekierowani na stronę `/login`.

## 5. Kluczowe komponenty

Poniżej znajduje się lista kluczowych, reużywalnych komponentów, które będą stanowić podstawę interfejsu użytkownika.

- **`Header`**: Globalny komponent nawigacyjny, dynamicznie dostosowujący swoje menu w zależności od stanu zalogowania użytkownika.
- **`LoginForm` / `RegisterForm`**: Komponenty formularzy z logiką walidacji (przy użyciu `react-hook-form` i `zod`) do obsługi uwierzytelniania.
- **`SearchSeries`**: Komponent zawierający pole do wyszukiwania seriali, logikę "debounce" oraz wyświetlanie wyników z TMDB API.
- **`SeriesRatingList`**: Komponent wyświetlający listę ocenionych seriali użytkownika w formie galerii plakatów z opcją zmiany oceny lub usunięcia.
- **`SeriesWatchlistList`**: Komponent wyświetlający listę obserwowanych seriali użytkownika z opcją usunięcia z listy.
- **`WatchRoomList`**: Komponent wyświetlający listę pokoi, do których należy użytkownik, z podstawowymi informacjami i linkiem do szczegółów.
- **`CreateWatchRoomModal`**: Modal z formularzem do tworzenia nowego pokoju.
- **`ParticipantList`**: Komponent wyświetlający listę uczestników w danym pokoju, wizualnie odróżniający właściciela i umożliwiający mu usuwanie innych członków.
- **`RecommendationSection`**: Kluczowy komponent na stronie pokoju, który zarządza stanami (pusty, ładowanie, wyniki) i wyświetla wygenerowane przez AI rekomendacje.
- **`Toast`**: Globalny komponent do wyświetlania powiadomień (np. o błędach API, sukcesie operacji).
- **`ConfirmationModal`**: Reużywalny modal do potwierdzania operacji destrukcyjnych (np. usunięcie konta, usunięcie uczestnika z pokoju).
