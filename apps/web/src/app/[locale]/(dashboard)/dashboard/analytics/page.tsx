import { PlaceholderPage } from "@/components/ui";
import { t } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

export default function Page() {
	const { i18n } = useLingui();

	return (
		<PlaceholderPage
			title={t`Analytics`}
			icon="chart-bar"
			description={t`Resolution rates CSAT trends response times and tier breakdowns.`}
		/>
	);
}
