# Dokument wymagań produktu (PRD) - ShowSync

## 1. Przegląd produktu

ShowSync to aplikacja webowa zaprojektowana w celu rozwiązywania problemu wyboru serialu do wspólnego oglądania przez grupy osób (przyjaciół, rodziny, pary). Aplikacja generuje spersonalizowane rekomendacje na podstawie indywidualnych preferencji każdego z członków grupy.

Użytkownicy tworzą swoje profile, dodając do nich ulubione seriale. Następnie, jedna osoba tworzy "pokój oglądania" i udostępnia pozostałym unikalny link. Po dołączeniu wszystkich uczestników, system, wykorzystując API OpenAI, analizuje zbiorcze dane o gustach i prezentuje 3 do 5 najlepiej dopasowanych propozycji seriali. Każda rekomendacja jest wzbogacona o pisemne uzasadnienie, dlaczego dany tytuł powinien spodobać się całej grupie. Dane dotyczące seriali, takie jak opisy i plakaty, są pobierane z zewnętrznego API TMDB.

Głównym celem produktu jest uproszczenie i przyspieszenie procesu decyzyjnego, eliminując frustrację i konflikty, a także pomagając grupom odkrywać nowe seriale, które zadowolą wszystkich.

## 2. Problem użytkownika

Grupy osób często napotykają trudności przy wspólnej decyzji, co obejrzeć. Ten problem wynika z kilku kluczowych czynników:

- Różnice w gustach: Każdy członek grupy ma inne preferencje, co utrudnia znalezienie tytułu, który zadowoli wszystkich.
- Paraliż decyzyjny: Ogromna liczba dostępnych seriali na różnych platformach streamingowych prowadzi do przeciążenia informacyjnego i trudności w podjęciu decyzji.
- Czasochłonność: Proces poszukiwania i negocjacji jest czasochłonny i często kończy się frustracją lub rezygnacją ze wspólnego oglądania.
- Konflikty: Różnice zdań mogą prowadzić do niepotrzebnych sporów i psuć atmosferę spotkania.

ShowSync ma na celu rozwiązanie tych problemów, dostarczając obiektywne, oparte na danych rekomendacje, które oszczędzają czas i ułatwiają podjęcie wspólnej, satysfakcjonującej decyzji.

## 3. Wymagania funkcjonalne

- FR-01: Zarządzanie użytkownikami
  - Możliwość rejestracji nowego konta za pomocą adresu e-mail i hasła.
  - Logowanie i wylogowywanie użytkownika.
  - Podstawowy profil użytkownika, na którym widoczna jest lista jego ulubionych seriali.
- FR-02: Budowanie profilu preferencji
  - Funkcjonalność wyszukiwania seriali w oparciu o integrację z API TMDB.
  - Możliwość dodawania i usuwania seriali z listy ocenionych z oceną "dislike" (nie lubię), "like" (lubię) lub "love" (uwielbiam).
  - Możliwość zmiany oceny serialu między dowolnymi wartościami: "dislike", "like" i "love".
  - Możliwość dodawania seriali do listy obserwowanych z typem "notInterested" (nie interesuje mnie) lub "wantToWatch" (chcę obejrzeć) - seriale na tej liście nie będą pojawiać się w przyszłych rekomendacjach.
- FR-03: Zarządzanie sesjami ("pokojami")
  - Możliwość utworzenia nowego "pokoju oglądania" przez zalogowanego użytkownika.
  - Automatyczne generowanie unikalnego, publicznego linku do pokoju.
- FR-04: System zaproszeń
  - Możliwość dołączenia do istniejącego pokoju za pomocą udostępnionego linku.
- FR-05: Silnik rekomendacji
  - Integracja z API OpenAI w celu analizy ocen seriali wszystkich uczestników sesji.
  - System priorytetyzuje seriale ocenione jako "love" (uwielbiam) najwyżej, "like" (lubię) średnio, a "dislike" (nie lubię) pomaga filtrować niechciane treści podczas generowania rekomendacji.
  - Generowanie rekomendacji odbywa się asynchronicznie - użytkownik otrzymuje natychmiastowe potwierdzenie rozpoczęcia procesu.
  - Możliwość sprawdzenia statusu generowania (oczekujące/ukończone/nieudane).
  - System przesyła do API połączone dane o ocenach, a w odpowiedzi otrzymuje listę rekomendacji wraz z uzasadnieniem.
- FR-06: Wyświetlanie wyników
  - Interfejs prezentujący listę 5-10 polecanych seriali z najnowszego ukończonego żądania rekomendacji.
  - Każda propozycja zawiera tytuł, plakat, krótki opis (z TMDB) oraz wygenerowane przez AI uzasadnienie dopasowania do gustu grupy.
  - Możliwość dodania dowolnego serialu do osobistej listy obserwowanych (nie tylko z rekomendacji).
- FR-07: System opinii
  - Po przeglądnięciu rekomendacji, uczestnicy mogą zostawić opinię na temat jakości rekomendacji.
  - Opinia zawiera: ocenę w skali 1-5, informację czy znaleziono coś do obejrzenia, oraz opcjonalny komentarz.
  - Każdy uczestnik może zostawić tylko jedną opinię na dane żądanie rekomendacji.
- FR-08: Filtrowanie rekomendacji
  - Seriale dodane do listy obserwowanych przez któregokolwiek uczestnika pokoju nie będą uwzględniane w przyszłych rekomendacjach dla tego pokoju.
  - Każdy użytkownik buduje własną globalną listę obserwowanych seriali, która jest używana we wszystkich pokojach, w których uczestniczy.
- FR-09: Zarządzanie hasłem
  - Zalogowany użytkownik może zmienić swoje hasło, podając aktualne hasło i nowe hasło.

## 4. Granice produktu

### W zakresie (MVP)

- Aplikacja będzie dostępna wyłącznie jako aplikacja webowa.
- Rekomendacje będą dotyczyć tylko i wyłącznie seriali.
- Dostęp do aplikacji będzie w pełni darmowy.
- Podstawowy cykl życia "pokoju": link jest trwały i nie wygasa. Rekomendacje są generowane asynchronicznie na żądanie przez założyciela pokoju.
- Użytkownik dołączający do sesji musi założyć konto, aby dodać swoje preferencje.
- System sesji używa tokenów JWT z mechanizmem rotacji dla zwiększonego bezpieczeństwa.

### Poza zakresem (MVP)

- Natywne aplikacje mobilne (iOS, Android).
- Rekomendacje dla filmów.
- Systemy subskrypcji lub inne formy monetyzacji.
- Historia poprzednich sesji i rekomendacji (tylko najnowsze rekomendacje są widoczne).
- Przeglądanie zebranych opinii przez właściciela pokoju (dane są zbierane, ale nie ma interfejsu do ich przeglądania).
- Możliwość filtrowania wyników rekomendacji (np. po gatunku, platformie streamingowej).
- Edycja lub usuwanie złożonej opinii.

## 5. Historyjki użytkowników

### Zarządzanie kontem i profilem

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby móc korzystać z aplikacji.
- Kryteria akceptacji:
  - Formularz rejestracji zawiera pola na imię, adres e-mail, hasło i potwierdzenie hasła.
  - Walidacja formularza sprawdza, czy e-mail jest w poprawnym formacie.
  - Walidacja sprawdza, czy hasła w obu polach są identyczne.
  - System sprawdza, czy adres e-mail nie jest już zarejestrowany w bazie.
  - Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto, aby uzyskać dostęp do moich preferencji i tworzyć sesje.
- Kryteria akceptacji:
  - Formularz logowania zawiera pola na adres e-mail i hasło.
  - Po podaniu poprawnych danych użytkownik zostaje zalogowany i przekierowany na stronę główną.
  - W przypadku podania błędnych danych, użytkownik otrzymuje czytelny komunikat o błędzie.

- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zakończyć swoją sesję.
- Kryteria akceptacji:
  - W interfejsie aplikacji znajduje się przycisk "Wyloguj".
  - Po kliknięciu przycisku sesja użytkownika zostaje zakończona i jest on przekierowywany na stronę logowania.

- ID: US-004
- Tytuł: Wyszukiwanie seriali do dodania
- Opis: Jako zalogowany użytkownik, chcę móc wyszukać seriale po tytule, aby dodać je do mojej listy ocenionych.
- Kryteria akceptacji:
  - Na stronie profilu znajduje się pole wyszukiwania.
  - Wpisywanie tekstu w pole wyszukiwania na bieżąco zwraca listę pasujących seriali z API TMDB.
  - Wyniki wyszukiwania zawierają co najmniej tytuł i plakat serialu.

- ID: US-005
- Tytuł: Dodawanie serialu do listy ocenionych
- Opis: Jako zalogowany użytkownik, chcę móc dodać wyszukany serial do mojej listy ocenionych z oceną, aby system lepiej poznał mój gust.
- Kryteria akceptacji:
  - Przy każdym wyniku wyszukiwania znajduje się przycisk "Dodaj ocenę".
  - Po kliknięciu przycisku użytkownik może wybrać ocenę: "dislike" (nie lubię), "like" (lubię) lub "love" (uwielbiam).
  - Serial zostaje dodany do listy ocenionych z wybraną oceną.
  - Dodany serial natychmiast pojawia się na liście ocenionych na stronie profilu z odpowiednią oznaczeniem (np. ❤️ dla "love", 👍 dla "like", 👎 dla "dislike").

- ID: US-006
- Tytuł: Przeglądanie listy ocenionych seriali
- Opis: Jako zalogowany użytkownik, chcę widzieć listę moich ocenionych seriali z ocenami, aby zarządzać swoimi gustami.
- Kryteria akceptacji:
  - Na stronie profilu wyświetlana jest galeria plakatów wszystkich seriali ocenionych przez użytkownika.
  - Seriale są pogrupowane lub oznaczone według oceny ("dislike", "like" i "love").
  - Lista jest widoczna i czytelna.

- ID: US-006a
- Tytuł: Zmiana oceny serialu
- Opis: Jako zalogowany użytkownik, chcę móc zmienić ocenę serialu w mojej liście ocenionych, jeśli zmienią się moje odczucia.
- Kryteria akceptacji:
  - Przy każdym serialu na liście ocenionych znajduje się opcja zmiany oceny.
  - Mogę zmienić ocenę między dowolnymi wartościami: "dislike", "like" i "love".
  - Zmiana jest natychmiast widoczna na liście.

- ID: US-007
- Tytuł: Usuwanie serialu z listy ocenionych
- Opis: Jako zalogowany użytkownik, chcę móc usunąć serial z mojej listy ocenionych, jeśli zmienię zdanie.
- Kryteria akceptacji:
  - Przy każdym serialu na liście ocenionych znajduje się przycisk "Usuń".
  - Po kliknięciu przycisku serial znika z listy.

- ID: US-007a
- Tytuł: Przeglądanie listy obserwowanych seriali
- Opis: Jako zalogowany użytkownik, chcę móc zobaczyć listę seriali na mojej liście obserwowanych, aby w razie potrzeby móc zmienić zdanie.
- Kryteria akceptacji:
  - Na stronie profilu znajduje się sekcja "Lista obserwowanych".
  - Lista wyświetla wszystkie seriale, które użytkownik dodał do listy obserwowanych z ich typami.
  - Przy każdym serialu znajduje się przycisk "Usuń z listy".

- ID: US-007b
- Tytuł: Dodawanie serialu do listy obserwowanych
- Opis: Jako zalogowany użytkownik, chcę móc oznaczyć dowolny serial jako "nie interesuje mnie" lub "chcę obejrzeć", aby kontrolować przyszłe rekomendacje.
- Kryteria akceptacji:
  - Mogę dodać serial do listy obserwowanych z dowolnego miejsca w aplikacji (nie tylko z rekomendacji).
  - Serial dodany do listy nie będzie już pojawiać się w rekomendacjach dla żadnego pokoju, w którym uczestniczę.
  - Wyświetlany jest komunikat potwierdzający dodanie do listy.

- ID: US-007c
- Tytuł: Zmiana hasła
- Opis: Jako zalogowany użytkownik, chcę móc zmienić swoje hasło, aby zachować bezpieczeństwo konta.
- Kryteria akceptacji:
  - W ustawieniach profilu znajduje się opcja "Zmień hasło".
  - Formularz wymaga podania aktualnego hasła i dwukrotnego wpisania nowego hasła.
  - System weryfikuje poprawność aktualnego hasła przed zapisaniem zmian.
  - Po pomyślnej zmianie hasła wyświetlany jest komunikat potwierdzający.

### Sesje i rekomendacje

- ID: US-008
- Tytuł: Tworzenie nowego pokoju
- Opis: Jako zalogowany użytkownik, chcę móc stworzyć nowy "pokój oglądania", aby rozpocząć proces szukania rekomendacji ze znajomymi.
- Kryteria akceptacji:
  - Na stronie głównej znajduje się przycisk "Stwórz pokój".
  - Po kliknięciu przycisku zostaje utworzona nowa sesja, a ja jako założyciel jestem automatycznie do niej dodany.
  - Zostaję przekierowany na stronę pokoju.

- ID: US-009
- Tytuł: Zapraszanie znajomych do pokoju
- Opis: Jako założyciel pokoju, chcę otrzymać unikalny link, który mogę skopiować i wysłać znajomym, aby dołączyli do mojej sesji.
- Kryteria akceptacji:
  - Na stronie pokoju wyświetlany jest unikalny link do tej sesji.
  - Obok linku znajduje się przycisk "Kopiuj link", który kopiuje go do schowka.

- ID: US-010
- Tytuł: Dołączanie do pokoju przez link
- Opis: Jako zaproszona osoba, chcę móc dołączyć do pokoju oglądania po kliknięciu w otrzymany link.
- Kryteria akceptacji:
  - Otworzenie linku w przeglądarce przenosi mnie na stronę docelowego pokoju.
  - Jeśli nie jestem zalogowany, zostaję poproszony o zalogowanie się lub zarejestrowanie, aby moje preferencje mogły zostać uwzględnione.
  - Po zalogowaniu/rejestracji jestem automatycznie dodawany do sesji w pokoju.
  - Moja nazwa użytkownika pojawia się na liście uczestników w pokoju.

- ID: US-011
- Tytuł: Generowanie rekomendacji dla grupy
- Opis: Jako założyciel pokoju, gdy wszyscy uczestnicy już dołączyli, chcę móc uruchomić proces generowania rekomendacji.
- Kryteria akceptacji:
  - Na stronie pokoju znajduje się przycisk "Generuj rekomendacje".
  - Przycisk jest aktywny tylko wtedy, gdy w pokoju są co najmniej dwie osoby.
  - Po kliknięciu przycisku system wysyła listy ocenionych seriali wszystkich uczestników do API OpenAI.
  - W trakcie przetwarzania zapytania interfejs wyświetla informację o ładowaniu.

- ID: US-012
- Tytuł: Wyświetlanie rekomendacji
- Opis: Jako członek grupy, chcę zobaczyć listę polecanych seriali wraz z uzasadnieniem, abyśmy mogli podjąć decyzję.
- Kryteria akceptacji:
  - Po zakończeniu generowania, na stronie pokoju wyświetla się 3-5 rekomendacji.
  - Każda rekomendacja zawiera plakat, tytuł, krótki opis oraz wygenerowane przez AI uzasadnienie.
  - Uzasadnienie wyjaśnia, dlaczego dany serial jest dobrym wyborem dla obecnej grupy.

- ID: US-013
- Tytuł: Dodawanie rekomendacji do listy obserwowanych
- Opis: Jako uczestnik pokoju, chcę móc dodać rekomendację do mojej listy obserwowanych, aby kontrolować przyszłe rekomendacje.
- Kryteria akceptacji:
  - Przy każdej rekomendacji znajduje się przycisk "Dodaj do listy".
  - Po kliknięciu przycisku serial zostaje dodany do mojej osobistej listy obserwowanych.
  - Wyświetlany jest komunikat: "Dzięki! Nie pokażemy Ci tego serialu w przyszłych rekomendacjach".
  - Serial pozostaje widoczny dla innych uczestników (którzy mogą go rozważyć).

- ID: US-014
- Tytuł: Regenerowanie rekomendacji z uwzględnieniem listy obserwowanych
- Opis: Jako założyciel pokoju, chcę móc wygenerować nowe rekomendacje, które wykluczają seriale z list obserwowanych uczestników.
- Kryteria akceptacji:
  - Gdy wszyscy uczestnicy dodadzą wszystkie aktualne rekomendacje do listy obserwowanych, wyświetla się komunikat: "Odrzuciliście wszystkie propozycje. Chcecie spróbować ponownie?".
  - Przycisk "Generuj ponownie" uruchamia proces generowania nowych rekomendacji.
  - System wysyła do API OpenAI listy ocenionych oraz listy obserwowanych seriali wszystkich uczestników.
  - Nowe rekomendacje nie zawierają żadnych seriali, które są na listach obserwowanych uczestników.

## 6. Metryki sukcesu

- MS-01: Trafność rekomendacji
  - Metryka: Procent "trafnych sugestii".
  - Definicja i sposób pomiaru: Ze względu na ograniczenia MVP, metryka ta będzie początkowo mierzona jakościowo za pomocą ankiet i wywiadów z użytkownikami. W kolejnych wersjach produktu planowane jest wdrożenie mechanizmu feedbacku (np. przycisk "Trafna propozycja"), co pozwoli na zbieranie danych ilościowych.
