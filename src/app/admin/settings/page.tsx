import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/content-store";

export const metadata = { title: "Настройки" };

export default function AdminSettings() {
  return <SettingsForm initial={getSettings()} />;
}
