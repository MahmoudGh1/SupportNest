import { useLocale } from "@/context/local-context";
import { useLingui } from "@lingui/react/macro";
import { usePathname, useRouter } from "next/navigation";

const LanguageSwitcher = () => {
	const { locale, setLocale } = useLocale(); // your context hook

return (
  <button onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}>
    {locale === 'en' ? 'العربية' : 'English'}
  </button>
);
};

export default LanguageSwitcher;
