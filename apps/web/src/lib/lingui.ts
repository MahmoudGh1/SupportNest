import { setupI18n } from "@lingui/core";
import { en, ar } from "make-plural/plurals";

const localeMap = { en, ar };

export function getI18nInstance(locale: string, messages: any) {
	const i18n = setupI18n();
	i18n.loadAndActivate({
		locale,
		messages: messages,
	});
	return i18n;
}
