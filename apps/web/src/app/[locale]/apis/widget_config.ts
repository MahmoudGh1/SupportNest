import { api } from "@/lib/api";

export interface WidgetConfig {
  title: string;
  greetingMessage: string;
  accentColor: string;
  placeholder: string;
}

export async function updateWidgetConfig(config: WidgetConfig): Promise<void> {
  await api.updateWidgetConfig(config);
}
