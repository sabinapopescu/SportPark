import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { saveLanguage } from "@/lib/store";
import type { Category, Lang } from "@/lib/types";

const dict = {
  ro: {
    siteTitle: "SportPark — Înregistrare la antrenamente",
    siteDescription:
      "Rezervă-ți locul la antrenamentele de grup SportPark: Fitness, CrossFit, Pilates, Tenis, Squash și Kids Park.",
    siteOgDescription: "Rezervă-ți locul la antrenamentele de grup SportPark din Chișinău.",
    meta: {
      title: "Program antrenamente — SportPark",
      description: "Vezi programul antrenamentelor de grup și rezervă-ți locul.",
    },
    header: { callAria: (phone: string) => `Sună ${phone}`, categories: "Categorii" },
    notFound: {
      title: "404",
      subtitle: "Pagină negăsită",
      body: "Linkul nu există sau a fost mutat.",
      home: "Acasă",
    },
    error: {
      title: "Ceva nu a mers",
      body: "Încearcă din nou sau revino la pagina principală.",
      retry: "Reîncearcă",
      home: "Acasă",
    },
    home: {
      titleBase: "Antrenamente",
      titleHighlight: "de grup",
      subtitle:
        "Rezervă-ți locul la următoarele sesiuni. Fără cont, doar numele și, opțional, telefonul.",
      statSessions: (n: number) => `${n} sesiuni azi`,
      statSeatsAvailable: (avail: number, total: number) => `${avail}/${total} locuri libere azi`,
      statCategories: (n: number) => `${n} categorii`,
      tabToday: "Azi",
      tabTomorrow: "Mâine",
      tabWeek: "Săptămâna aceasta",
      empty: "Nu sunt antrenamente programate pentru acest interval.",
      card: {
        closed: "Închis",
        full: "Locuri epuizate",
        closesIn: (s: string) => `Se închide în ${s}`,
        seatsOccupied: (r: number, m: number) => `${r}/${m} locuri ocupate`,
        regClosed: "Înregistrare închisă",
        regOpen: "Înregistrare deschisă →",
      },
    },
    event: {
      back: "← Înapoi la program",
      notFoundTitle: "Antrenament negăsit",
      notFoundBack: "Înapoi la program",
      headingConfirm: "Confirmare",
      headingRegister: "Înregistrare",
      confirmedTitle: "Ești înregistrat!",
      confirmedBody: (title: string, date: string, time: string) =>
        `Te așteptăm la ${title} pe ${date}, ora ${time}.`,
      cancelRegistration: "Anulează înregistrarea",
      backHome: "Program",
      closedMsg: "Înregistrările pentru acest antrenament s-au închis.",
      fullMsg: "Din păcate, locurile s-au epuizat.",
      nameLabel: "Nume *",
      namePlaceholder: "Prenume și nume",
      phoneLabel: "Telefon (opțional)",
      phonePlaceholder: "+373 …",
      errNameInvalid: "Introdu un nume valid.",
      errNameTooLong: "Numele este prea lung.",
      errPhoneTooLong: "Telefon prea lung.",
      errGeneric: "A apărut o eroare.",
      sending: "Se trimite...",
      submit: "Confirmă înregistrarea",
      registrantsHeading: "Persoane înregistrate",
      registrantsEmpty: "Fii primul care se înregistrează.",
      you: "(tu)",
      seatsOccupied: (r: number, m: number) => `${r}/${m} locuri ocupate`,
      regClosed: "Înregistrare închisă",
      full: "Locuri epuizate",
      closesIn: (s: string) => `Se închide în ${s}`,
      coachLabel: (name: string) => `Coach: ${name}`,
    },
    cancel: {
      invalidTitle: "Link invalid",
      invalidBody: "Această înregistrare nu există sau linkul este greșit.",
      back: "Înapoi la program",
      heading: "Anulare înregistrare",
      defaultEventName: "Antrenament",
      nameLabel: "Nume",
      doneTitle: "Ai anulat înregistrarea.",
      doneBody: "Locul tău a fost eliberat.",
      confirm: "Confirmă anularea",
      cancel: "Renunță",
    },
    categoriesPage: {
      eyebrow: "Antrenamente",
      heading: "Categoriile noastre",
      subtitle: "Descoperă tipurile de antrenamente disponibile la SportPark.",
      empty: "Nu sunt categorii disponibile momentan.",
    },
    admin: {
      nav: {
        events: "Evenimente",
        categories: "Categorii",
        viewSite: "Vezi site",
        logout: "Ieșire",
      },
      login: {
        heading: "Autentificare admin",
        email: "Email",
        password: "Parolă",
        errDefault: "Email sau parolă incorectă.",
        submitting: "Se verifică...",
        submit: "Intră",
      },
      dashboard: {
        eyebrow: "Admin",
        heading: "Evenimente",
        newEvent: "+ Eveniment nou",
        empty: "Niciun eveniment. Creează primul.",
        colTitle: "Titlu",
        colDate: "Data",
        colCategory: "Categorie",
        colSeats: "Locuri",
        colStatus: "Status",
        colActions: "Acțiuni",
        statusPast: "Trecut",
        statusFull: "Full",
        statusOpen: "Deschis",
        share: "Share",
        copied: "Copiat",
        registrants: "Înregistrați",
        edit: "Editează",
        delete: "Șterge",
        deleteConfirmTitle: "Șterge evenimentul?",
        deleteConfirmBody:
          "Această acțiune va ascunde evenimentul din listă (înregistrările rămân salvate).",
        cancel: "Renunță",
      },
      form: {
        back: "← Înapoi",
        headingNew: "Eveniment nou",
        headingEdit: "Editează eveniment",
        title: "Titlu *",
        titleRu: "Titlu (RU)",
        category: "Categorie",
        location: "Locație",
        description: "Descriere",
        descriptionRu: "Descriere (RU)",
        date: "Data",
        start: "Start",
        end: "Final",
        coach: "Coach (opțional)",
        maxSeats: "Locuri maxime *",
        deadline: "Deadline înregistrare (opțional, ISO)",
        banner: "Banner (imagine)",
        uploading: "Se încarcă...",
        titleRequired: "Titlul este obligatoriu.",
        reduceCapacityConfirm: (n: number) =>
          `Sunt deja ${n} înregistrări. Ești sigur că vrei să reduci sub această valoare?`,
        saveError: "Eroare la salvare.",
        uploadError: "Eroare la încărcarea imaginii.",
        saving: "Se salvează...",
        save: "Salvează",
        cancel: "Renunță",
        noCategories: "Nicio categorie disponibilă. Creează mai întâi o categorie.",
      },
      registrants: {
        back: "← Înapoi",
        activeOf: (n: number, m: number) => `${n} / ${m}`,
        activeSuffix: "activi",
        cancelledSuffix: (n: number) => `${n} anulați`,
        empty: "Nicio înregistrare încă.",
        colName: "Nume",
        colPhone: "Telefon",
        colRegisteredAt: "Înregistrat la",
        colStatus: "Status",
        colActions: "Acțiuni",
        cancelled: "Anulat",
        activeStatus: "Activ",
        cancelAction: "Anulează",
        cancelConfirm: (name: string) => `Anulezi înregistrarea pentru ${name}?`,
      },
      categoriesDashboard: {
        eyebrow: "Admin",
        heading: "Categorii",
        newCategory: "+ Categorie nouă",
        empty: "Nicio categorie. Creează prima.",
        colPhoto: "Foto",
        colTitleRo: "Titlu (RO)",
        colTitleRu: "Titlu (RU)",
        colActions: "Acțiuni",
        edit: "Editează",
        delete: "Șterge",
        deleteConfirmTitle: "Șterge categoria?",
        deleteConfirmBody:
          "Această acțiune va ascunde categoria din listă. Evenimentele existente rămân neschimbate.",
        cancel: "Renunță",
      },
      categoryForm: {
        back: "← Înapoi",
        headingNew: "Categorie nouă",
        headingEdit: "Editează categoria",
        titleRo: "Titlu (RO) *",
        titleRu: "Titlu (RU) *",
        descriptionRo: "Descriere (RO)",
        descriptionRu: "Descriere (RU)",
        photo: "Fotografie",
        uploading: "Se încarcă...",
        titleRoRequired: "Titlul (RO) este obligatoriu.",
        titleRuRequired: "Titlul (RU) este obligatoriu.",
        saveError: "Eroare la salvare.",
        uploadError: "Eroare la încărcarea imaginii.",
        saving: "Se salvează...",
        save: "Salvează",
        cancel: "Renunță",
      },
    },
  },
  ru: {
    siteTitle: "SportPark — Регистрация на тренировки",
    siteDescription:
      "Забронируйте место на групповые тренировки SportPark: Fitness, CrossFit, Pilates, Tenis, Squash и Kids Park.",
    siteOgDescription: "Забронируйте место на групповые тренировки SportPark в Кишинёве.",
    meta: {
      title: "Расписание тренировок — SportPark",
      description: "Смотрите расписание групповых тренировок и забронируйте место.",
    },
    header: { callAria: (phone: string) => `Позвонить ${phone}`, categories: "Категории" },
    notFound: {
      title: "404",
      subtitle: "Страница не найдена",
      body: "Ссылка не существует или была перемещена.",
      home: "Главная",
    },
    error: {
      title: "Что-то пошло не так",
      body: "Попробуйте снова или вернитесь на главную страницу.",
      retry: "Повторить",
      home: "Главная",
    },
    home: {
      titleBase: "Групповые",
      titleHighlight: "тренировки",
      subtitle:
        "Забронируйте место на ближайшие занятия. Без регистрации — только имя и, при желании, телефон.",
      statSessions: (n: number) => `${n} занятий сегодня`,
      statSeatsAvailable: (avail: number, total: number) =>
        `${avail}/${total} свободных мест сегодня`,
      statCategories: (n: number) => `${n} категорий`,
      tabToday: "Сегодня",
      tabTomorrow: "Завтра",
      tabWeek: "Эта неделя",
      empty: "На этот период тренировки не запланированы.",
      card: {
        closed: "Закрыто",
        full: "Мест нет",
        closesIn: (s: string) => `Закрывается через ${s}`,
        seatsOccupied: (r: number, m: number) => `${r}/${m} занято мест`,
        regClosed: "Регистрация закрыта",
        regOpen: "Регистрация открыта →",
      },
    },
    event: {
      back: "← Назад к расписанию",
      notFoundTitle: "Тренировка не найдена",
      notFoundBack: "Назад к расписанию",
      headingConfirm: "Подтверждение",
      headingRegister: "Регистрация",
      confirmedTitle: "Вы зарегистрированы!",
      confirmedBody: (title: string, date: string, time: string) =>
        `Ждём вас на «${title}» ${date} в ${time}.`,
      cancelRegistration: "Отменить регистрацию",
      backHome: "Расписание",
      closedMsg: "Регистрация на эту тренировку закрыта.",
      fullMsg: "К сожалению, свободных мест не осталось.",
      nameLabel: "Имя *",
      namePlaceholder: "Имя и фамилия",
      phoneLabel: "Телефон (необязательно)",
      phonePlaceholder: "+373 …",
      errNameInvalid: "Введите корректное имя.",
      errNameTooLong: "Имя слишком длинное.",
      errPhoneTooLong: "Номер телефона слишком длинный.",
      errGeneric: "Произошла ошибка.",
      sending: "Отправка...",
      submit: "Подтвердить регистрацию",
      registrantsHeading: "Зарегистрированные участники",
      registrantsEmpty: "Станьте первым, кто зарегистрируется.",
      you: "(вы)",
      seatsOccupied: (r: number, m: number) => `${r}/${m} занято мест`,
      regClosed: "Регистрация закрыта",
      full: "Мест нет",
      closesIn: (s: string) => `Закрывается через ${s}`,
      coachLabel: (name: string) => `Тренер: ${name}`,
    },
    cancel: {
      invalidTitle: "Недействительная ссылка",
      invalidBody: "Эта регистрация не существует, или ссылка неверна.",
      back: "Назад к расписанию",
      heading: "Отмена регистрации",
      defaultEventName: "Тренировка",
      nameLabel: "Имя",
      doneTitle: "Регистрация отменена.",
      doneBody: "Ваше место освобождено.",
      confirm: "Подтвердить отмену",
      cancel: "Назад",
    },
    categoriesPage: {
      eyebrow: "Тренировки",
      heading: "Наши категории",
      subtitle: "Узнайте о видах тренировок, доступных в SportPark.",
      empty: "На данный момент категории недоступны.",
    },
    admin: {
      nav: {
        events: "Тренировки",
        categories: "Категории",
        viewSite: "Открыть сайт",
        logout: "Выход",
      },
      login: {
        heading: "Вход администратора",
        email: "Email",
        password: "Пароль",
        errDefault: "Неверный email или пароль.",
        submitting: "Проверка...",
        submit: "Войти",
      },
      dashboard: {
        eyebrow: "Админ",
        heading: "Тренировки",
        newEvent: "+ Новая тренировка",
        empty: "Нет тренировок. Создайте первую.",
        colTitle: "Название",
        colDate: "Дата",
        colCategory: "Категория",
        colSeats: "Места",
        colStatus: "Статус",
        colActions: "Действия",
        statusPast: "Прошло",
        statusFull: "Заполнено",
        statusOpen: "Открыто",
        share: "Поделиться",
        copied: "Скопировано",
        registrants: "Участники",
        edit: "Редактировать",
        delete: "Удалить",
        deleteConfirmTitle: "Удалить тренировку?",
        deleteConfirmBody: "Это действие скроет тренировку из списка (регистрации сохранятся).",
        cancel: "Отмена",
      },
      form: {
        back: "← Назад",
        headingNew: "Новая тренировка",
        headingEdit: "Редактировать тренировку",
        title: "Название *",
        titleRu: "Название (RU)",
        category: "Категория",
        location: "Место проведения",
        description: "Описание",
        descriptionRu: "Описание (RU)",
        date: "Дата",
        start: "Начало",
        end: "Конец",
        coach: "Тренер (необязательно)",
        maxSeats: "Максимум мест *",
        deadline: "Дедлайн регистрации (необязательно)",
        banner: "Баннер (изображение)",
        uploading: "Загрузка...",
        titleRequired: "Название обязательно.",
        reduceCapacityConfirm: (n: number) =>
          `Уже есть ${n} регистраций. Вы уверены, что хотите уменьшить лимит ниже этого значения?`,
        saveError: "Ошибка при сохранении.",
        uploadError: "Ошибка при загрузке изображения.",
        saving: "Сохранение...",
        save: "Сохранить",
        cancel: "Отмена",
        noCategories: "Нет доступных категорий. Сначала создайте категорию.",
      },
      registrants: {
        back: "← Назад",
        activeOf: (n: number, m: number) => `${n} / ${m}`,
        activeSuffix: "активных",
        cancelledSuffix: (n: number) => `${n} отменено`,
        empty: "Пока нет регистраций.",
        colName: "Имя",
        colPhone: "Телефон",
        colRegisteredAt: "Дата регистрации",
        colStatus: "Статус",
        colActions: "Действия",
        cancelled: "Отменено",
        activeStatus: "Активен",
        cancelAction: "Отменить",
        cancelConfirm: (name: string) => `Отменить регистрацию для ${name}?`,
      },
      categoriesDashboard: {
        eyebrow: "Админ",
        heading: "Категории",
        newCategory: "+ Новая категория",
        empty: "Нет категорий. Создайте первую.",
        colPhoto: "Фото",
        colTitleRo: "Название (RO)",
        colTitleRu: "Название (RU)",
        colActions: "Действия",
        edit: "Редактировать",
        delete: "Удалить",
        deleteConfirmTitle: "Удалить категорию?",
        deleteConfirmBody:
          "Это действие скроет категорию из списка. Существующие тренировки не изменятся.",
        cancel: "Отмена",
      },
      categoryForm: {
        back: "← Назад",
        headingNew: "Новая категория",
        headingEdit: "Редактировать категорию",
        titleRo: "Название (RO) *",
        titleRu: "Название (RU) *",
        descriptionRo: "Описание (RO)",
        descriptionRu: "Описание (RU)",
        photo: "Фотография",
        uploading: "Загрузка...",
        titleRoRequired: "Название (RO) обязательно.",
        titleRuRequired: "Название (RU) обязательно.",
        saveError: "Ошибка при сохранении.",
        uploadError: "Ошибка при загрузке изображения.",
        saving: "Сохранение...",
        save: "Сохранить",
        cancel: "Отмена",
      },
    },
  },
} satisfies Record<Lang, unknown>;

type Dict = (typeof dict)["ro"];

const LanguageContext = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const queryClient = useQueryClient();

  const setLang = useCallback(
    (l: Lang) => {
      setLangState(l);
      queryClient.setQueryData(["language"], l);
      saveLanguage(l).catch(() => {});
    },
    [queryClient],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export function useT(): Dict {
  const { lang } = useLanguage();
  return dict[lang];
}

export function getDict(lang: Lang): Dict {
  return dict[lang];
}

export function categoryLabel(category: Category, lang: Lang): string {
  return lang === "ru" ? category.titleRu : category.titleRo;
}

export function categoryDescription(category: Category, lang: Lang): string | undefined {
  return lang === "ru" ? category.descriptionRu : category.descriptionRo;
}
