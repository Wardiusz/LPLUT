// Tłumaczenia interfejsu (PL/EN). Język ustawia App przez I.lang przed każdym renderem.
export const I = { lang: 'pl' };

export const DAYS_BY = {
  pl: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
export const dayList = () => DAYS_BY[I.lang];
export const dn = (i) => DAYS_BY[I.lang][i];

const pl = {
  appTitle: "Plan zajęć", noPlan: "Brak planu", blocks: "{n} bloków zajęć", planBtn: "Plan", datesBtn: "Terminy zjazdów", weeksBtn: "Tygodnie semestru",
  theme: "Motyw", lang: "Język", auto: "Auto", light: "Jasny", dark: "Ciemny",
  tabSession: "Zjazd", tabTerm: "Tydzień zajęć", tabDay: "Dzień", tabWeek: "Tydzień", tabMonth: "Miesiąc",
  today: "Dziś", back: "Wstecz", next: "Dalej", date: "Data", labSession: "zjazd", labTerm: "tydz.", wk: "tyg.", asDay: "jak {d}",
  noClassesDay: "Brak zajęć w tym dniu.", nextClasses: "Najbliższe zajęcia: ", fullWeek: "cały tydzień", noClassesWeek: "W tym tygodniu nie ma zajęć.",
  hintTerm: "Daty tygodni są domyślne (od poniedziałku bieżącego tygodnia). Ustaw prawdziwe w „Tygodnie semestru”, żeby widoki pokazywały właściwe zajęcia.",
  hintSession: "Daty zjazdów są domyślne (co 7 dni od najbliższej soboty). Ustaw prawdziwe w „Terminy zjazdów”, żeby widoki dnia, tygodnia i miesiąca pokazywały właściwe zajęcia.",
  emptyTitle: "Plan czeka na wczytanie", emptyText: "Prześlij zrzut ekranu lub zdjęcie planu zajęć. Pokażę go w widokach: zjazd, dzień, tydzień i miesiąc.",
  pickImage: "Wybierz obraz planu", addManual: "Dodaj ręcznie", moreOpts: "Więcej opcji",
  scanning: "Odczytuję plan z obrazu… zwykle 20–60 s.", loaded: "Wczytano {n} bloków zajęć. Porównaj z oryginałem, zanim zaczniesz na nim polegać.", imported: "Zaimportowano {n} bloków zajęć.",
  pdTitle: "Plan zajęć", scanImg: "Skanuj plan z obrazu", addBlock: "Dodaj blok ręcznie", expImp: "Eksport i import (JSON)",
  expImpHelp: "Przenieś plan między urządzeniami albo wklej gotowy. Import zastępuje bieżący plan.", exportBtn: "Wyeksportuj", importBtn: "Importuj z pola",
  scanSettings: "Skanowanie obrazu (poza Claude)", mode: "Tryb", modeDirect: "Bezpośrednio, z własnym kluczem API", modeWorker: "Przez własną usługę (Worker)",
  provider: "Dostawca AI", provAuto: "Auto (według kluczy w usłudze)", apiKey: "Klucz API", modelOpt: "Model (opcjonalnie)",
  fallbackModel: "Model zapasowy na wypadek przeciążenia (opcjonalnie)",
  keyNote: "Klucz zapisuje się tylko w tej przeglądarce: nie trafia do repozytorium ani na inne urządzenia. Użyj klucza z niskim limitem.",
  accessCode: "Kod dostępu", save: "Zapisz", saved: "Zapisano.", close: "Zamknij", cancel: "Anuluj",
  needSetup: "Najpierw ustaw klucz API lub usługę skanowania i kliknij Zapisz albo dodaj zajęcia ręcznie.",
  copied: "Skopiowano do schowka.", copyManual: "Zaznacz tekst i skopiuj go (Ctrl/Cmd+C).", badJson: "To nie jest poprawny JSON.", noBlocks: "Nie znalazłem w tekście żadnych bloków zajęć.",
  urlHttps: "Adres usługi musi zaczynać się od https://.",
  urlProvider: "To adres strony dostawcy, a nie usługi skanowania. Wybierz tryb „Bezpośrednio” i wklej tylko klucz API.", pasteKey: "Wklej klucz API.",
  geminiKeyWarn: "Zapisano. Uwaga: klucze Gemini zwykle zaczynają się od „AIza”. Skopiuj go z aistudio.google.com/apikey.",
  editBlock: "Edytuj blok zajęć", newBlock: "Nowy blok zajęć", fTitle: "Przedmiot", fDay: "Dzień", fStart: "Początek", fEnd: "Koniec", fType: "Typ (np. Wykład)",
  fWeeks: "Tygodnie (puste = wszystkie)", fRoom: "Sala", fTeacher: "Prowadzący", fGroup: "Grupa", fNote: "Uwagi",
  timeErr: "Podaj godzinę rozpoczęcia i późniejszą godzinę zakończenia.", delBlock: "Usuń blok", defType: "Wykład", classDef: "Zajęcia",
  datesTitle: "Terminy zjazdów", weeksTitle: "Tygodnie semestru", datesHelpS: "Data pierwszego dnia każdego zjazdu (sobota). Dopasuj do harmonogramu uczelni.",
  datesHelpW: "Data poniedziałku każdego tygodnia semestru.", every: "Co", daysFrom: "dni od 1. terminu", fillBtn: "Wypełnij", delPlan: "Usuń plan", sure: "Na pewno? Kliknij ponownie",
  eNotGranted: "Odczyt wymaga zgody na użycie Claude — zezwól i spróbuj ponownie.", eRate: "Za dużo zapytań. Spróbuj za chwilę.",
  eImage: "Nie mogę przetworzyć tego pliku. Użyj PNG, JPG lub WebP.", eJson: "Odpowiedź była niepełna. Spróbuj jeszcze raz.",
  eNoUrl: "Nie ustawiono usługi skanowania.", eNoKey: "Nie ustawiono klucza API.",
  eBadKey: "Dostawca odrzucił klucz API. Sprawdź klucz oraz ewentualne ograniczenia domeny.", e403: "Zły kod dostępu do usługi skanowania.",
  e429: "Za dużo zapytań do usługi skanowania.",
  e503: "Model dostawcy jest chwilowo przeciążony (503). Spróbuj za kilka minut albo ustaw model zapasowy w Plan → Skanowanie obrazu.",
  eProvider: "Wybrany dostawca nie ma klucza w usłudze skanowania. Zmień dostawcę lub dodaj klucz.", eHttp: "Usługa skanowania zwróciła błąd ({c}{d}).",
  eNet: "Brak połączenia z usługą skanowania. Sprawdź internet, adres usługi i ustawienia CORS.", eGeneric: "Nie udało się odczytać planu. Spróbuj ostrzejszego zrzutu całej tabeli.",
  retrying: "Dostawca jest przeciążony. Ponawiam ({a}/3)…", fallbackSw: "Przełączam na model zapasowy…",
};

const en = {
  appTitle: "Timetable", noPlan: "No timetable", blocks: "{n} class blocks", planBtn: "Timetable", datesBtn: "Session dates", weeksBtn: "Semester weeks",
  theme: "Theme", lang: "Language", auto: "Auto", light: "Light", dark: "Dark",
  tabSession: "Session", tabTerm: "Teaching week", tabDay: "Day", tabWeek: "Week", tabMonth: "Month",
  today: "Today", back: "Back", next: "Next", date: "Date", labSession: "session", labTerm: "wk", wk: "wk", asDay: "as {d}",
  noClassesDay: "No classes on this day.", nextClasses: "Next classes: ", fullWeek: "full week", noClassesWeek: "No classes this week.",
  hintTerm: "Week dates are defaults (from this week's Monday). Set the real ones in “Semester weeks” so the views show the right classes.",
  hintSession: "Session dates are defaults (every 7 days from the nearest Saturday). Set the real ones in “Session dates” so the day, week and month views show the right classes.",
  emptyTitle: "Your timetable is waiting", emptyText: "Upload a screenshot or photo of your timetable and it will be shown in session, day, week and month views.",
  pickImage: "Choose timetable image", addManual: "Add manually", moreOpts: "More options",
  scanning: "Reading the timetable from the image… usually 20–60 s.", loaded: "Loaded {n} class blocks. Compare with the original before relying on it.", imported: "Imported {n} class blocks.",
  pdTitle: "Timetable", scanImg: "Scan timetable from image", addBlock: "Add a block manually", expImp: "Export and import (JSON)",
  expImpHelp: "Move the timetable between devices or paste a ready one. Import replaces the current timetable.", exportBtn: "Export", importBtn: "Import from field",
  scanSettings: "Image scanning (outside Claude)", mode: "Mode", modeDirect: "Direct, with your own API key", modeWorker: "Via your own service (Worker)",
  provider: "AI provider", provAuto: "Auto (by keys in the service)", apiKey: "API key", modelOpt: "Model (optional)",
  fallbackModel: "Fallback model in case of overload (optional)",
  keyNote: "The key is stored only in this browser: it does not go to the repository or to other devices. Use a key with a low quota.",
  accessCode: "Access code", save: "Save", saved: "Saved.", close: "Close", cancel: "Cancel",
  needSetup: "First set an API key or scanning service and click Save, or add classes manually.",
  copied: "Copied to clipboard.", copyManual: "Select the text and copy it (Ctrl/Cmd+C).", badJson: "This is not valid JSON.", noBlocks: "No class blocks found in the text.",
  urlHttps: "The service address must start with https://.",
  urlProvider: "This is the provider's website, not a scanning service. Choose the “Direct” mode and paste only the API key.", pasteKey: "Paste the API key.",
  geminiKeyWarn: "Saved. Note: Gemini keys usually start with “AIza”. Copy it from aistudio.google.com/apikey.",
  editBlock: "Edit class block", newBlock: "New class block", fTitle: "Subject", fDay: "Day", fStart: "Start", fEnd: "End", fType: "Type (e.g. Lecture)",
  fWeeks: "Weeks (empty = all)", fRoom: "Room", fTeacher: "Instructor", fGroup: "Group", fNote: "Notes",
  timeErr: "Enter a start time and a later end time.", delBlock: "Delete block", defType: "Lecture", classDef: "Class",
  datesTitle: "Session dates", weeksTitle: "Semester weeks", datesHelpS: "First day of each session (Saturday). Match your university's schedule.",
  datesHelpW: "Monday of each semester week.", every: "Every", daysFrom: "days from the 1st date", fillBtn: "Fill", delPlan: "Delete timetable", sure: "Sure? Click again",
  eNotGranted: "Reading requires permission to use Claude — allow it and try again.", eRate: "Too many requests. Try again shortly.",
  eImage: "I can't process this file. Use PNG, JPG or WebP.", eJson: "The response was incomplete. Try again.",
  eNoUrl: "No scanning service is set.", eNoKey: "No API key is set.",
  eBadKey: "The provider rejected the API key. Check the key and any domain restrictions.", e403: "Wrong access code for the scanning service.",
  e429: "Too many requests to the scanning service.",
  e503: "The provider's model is temporarily overloaded (503). Try again in a few minutes or set a fallback model in Timetable → Image scanning.",
  eProvider: "The selected provider has no key in the scanning service. Change the provider or add a key.", eHttp: "The scanning service returned an error ({c}{d}).",
  eNet: "Could not reach the scanning service. Check your connection, the service address and CORS settings.", eGeneric: "Could not read the timetable. Try a sharper screenshot of the whole table.",
  retrying: "The provider is overloaded. Retrying ({a}/3)…", fallbackSw: "Switching to the fallback model…",
};

const DICT = { pl, en };
export const tr = (k, v) => {
  const s = DICT[I.lang][k] ?? DICT.pl[k] ?? k;
  return v ? s.replace(/\{(\w+)\}/g, (_, x) => v[x]) : s;
};
