import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "ar" | "fr" | "en";

const STORAGE_KEY = "hba-lang";

const dict = {
  siteName: {
    ar: "حسن بن أحمد",
    fr: "Hassen Ben Ahmed",
    en: "Hassen Ben Ahmed",
  },
  tagline: {
    ar: "صحفي — فنون، ثقافة و رياضة",
    fr: "Journaliste — arts, culture et sport",
    en: "Journalist — arts, culture and sport",
  },
  navHome: { ar: "الرئيسية", fr: "Accueil", en: "Home" },
  navBlog: { ar: "المدونة", fr: "Blog", en: "Blog" },
  navBio: { ar: "السيرة الذاتية", fr: "Biographie", en: "Biography" },
  navArchives: { ar: "الأرشيف", fr: "Archives", en: "Archives" },
  navNews: { ar: "الأخبار", fr: "Actualités", en: "News" },
  navPress: { ar: "الصحافة", fr: "Presse", en: "Press" },
  navContact: { ar: "اتصل بي", fr: "Contact", en: "Contact" },
  pressTitle: { ar: "من أرشيف الصحافة", fr: "Archives de presse", en: "Press archives" },
  pressIntro: {
    ar: "مقالات وحوارات نُشرت في جريدة «البيان» التونسية.",
    fr: "Articles et entretiens parus dans le journal tunisien « Al Bayane ».",
    en: "Articles and interviews published in the Tunisian newspaper “Al Bayane”.",
  },
  articleLabel: { ar: "مقال", fr: "Article", en: "Article" },
  admin: { ar: "الإدارة", fr: "Administration", en: "Admin" },
  signIn: { ar: "تسجيل الدخول", fr: "Connexion", en: "Sign in" },
  signOut: { ar: "تسجيل الخروج", fr: "Déconnexion", en: "Sign out" },
  heroTitle: {
    ar: "أربعون سنة من الصحافة، الفن والرياضة",
    fr: "Quarante ans de journalisme, d'art et de sport",
    en: "Forty years of journalism, art and sport",
  },
  heroText: {
    ar: "من صفحات جريدة «البيان» إلى شاشة حنبعل، حوارات نادرة مع كبار الفنانين وتغطيات كبرى للترجي والمنتخب الوطني.",
    fr: "Des pages du journal « Al Bayane » à l'écran de Hannibal TV : entretiens rares avec les grandes stars et couvertures majeures de l'Espérance et de l'équipe nationale.",
    en: "From the pages of “Al Bayane” to Hannibal TV: rare interviews with great artists and major coverage of Espérance and the national team.",
  },
  readBio: { ar: "اقرأ السيرة", fr: "Lire la biographie", en: "Read the biography" },
  latestPosts: { ar: "آخر المقالات", fr: "Derniers articles", en: "Latest posts" },
  latestNews: { ar: "آخر الأخبار", fr: "Dernières actualités", en: "Latest news" },
  fromArchives: { ar: "من الأرشيف", fr: "Extraits des archives", en: "From the archives" },
  viewAll: { ar: "عرض الكل", fr: "Tout voir", en: "View all" },
  readMore: { ar: "اقرأ المزيد", fr: "Lire la suite", en: "Read more" },
  blogTitle: { ar: "المدونة", fr: "Le blog", en: "The blog" },
  blogIntro: {
    ar: "مقالات، مواقف وتدوينات",
    fr: "Articles, prises de position et chroniques",
    en: "Articles, opinions and columns",
  },
  bioTitle: { ar: "السيرة الذاتية", fr: "Biographie", en: "Biography" },
  archivesTitle: { ar: "الأرشيف", fr: "Archives", en: "Archives" },
  archivesIntro: {
    ar: "صور وفيديوهات من مسيرة صحفية طويلة، مع حكايات ترافقها",
    fr: "Photos et vidéos d'une longue carrière, accompagnées d'anecdotes",
    en: "Photos and videos from a long career, with the stories behind them",
  },
  newsTitle: { ar: "الأخبار", fr: "Actualités", en: "News" },
  newsIntro: {
    ar: "إعلانات ومستجدات",
    fr: "Annonces et nouveautés en cours",
    en: "Current announcements and updates",
  },
  contactTitle: { ar: "اتصل بي", fr: "Contact", en: "Contact" },
  contactIntro: {
    ar: "لأي استفسار أو تعاون، اترك رسالتك هنا",
    fr: "Pour toute question ou collaboration, laissez votre message ici",
    en: "For any question or collaboration, leave your message here",
  },
  formName: { ar: "الاسم", fr: "Nom", en: "Name" },
  formEmail: { ar: "البريد الإلكتروني", fr: "E-mail", en: "Email" },
  formSubject: { ar: "الموضوع", fr: "Sujet", en: "Subject" },
  formMessage: { ar: "الرسالة", fr: "Message", en: "Message" },
  formSend: { ar: "إرسال", fr: "Envoyer", en: "Send" },
  formSent: {
    ar: "شكراً، تم إرسال رسالتك بنجاح",
    fr: "Merci, votre message a bien été envoyé",
    en: "Thank you, your message has been sent",
  },
  formError: {
    ar: "تعذر إرسال الرسالة، حاول مجدداً",
    fr: "Impossible d'envoyer le message, réessayez",
    en: "Could not send the message, please try again",
  },
  noContent: {
    ar: "لا يوجد محتوى بعد",
    fr: "Aucun contenu pour le moment",
    en: "No content yet",
  },
  videoLabel: { ar: "فيديو", fr: "Vidéo", en: "Video" },
  photoLabel: { ar: "صورة", fr: "Photo", en: "Photo" },
  footerRights: {
    ar: "جميع الحقوق محفوظة",
    fr: "Tous droits réservés",
    en: "All rights reserved",
  },
  backToBlog: { ar: "العودة إلى المدونة", fr: "Retour au blog", en: "Back to blog" },
} as const;

export type DictKey = keyof typeof dict;

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: DictKey) => string;
  dir: "rtl" | "ltr";
};

const LanguageContext = createContext<Ctx>({
  lang: "ar",
  setLang: () => {},
  t: (key) => dict[key].ar,
  dir: "rtl",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (saved === "ar" || saved === "fr" || saved === "en") setLangState(saved);
  }, []);

  const dir: "rtl" | "ltr" = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (key: DictKey) => dict[key][lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Pick a localized field from a row with _ar/_fr/_en suffixed columns, with fallback. */
export function localized(
  row: Record<string, unknown>,
  field: string,
  lang: Lang,
): string {
  const order: Lang[] = lang === "ar" ? ["ar", "fr", "en"] : lang === "fr" ? ["fr", "ar", "en"] : ["en", "fr", "ar"];
  for (const l of order) {
    const v = row[`${field}_${l}`];
    if (typeof v === "string" && v.trim().length > 0) return v;
  }
  return "";
}

export function formatDate(iso: string | null, lang: Lang): string {
  if (!iso) return "";
  const locale = lang === "ar" ? "ar-TN" : lang === "fr" ? "fr-FR" : "en-GB";
  return new Date(iso).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
