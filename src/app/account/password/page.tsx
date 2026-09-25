import { PasswordForm } from "@/components/PasswordForm";

export const metadata = { title: "Смена пароля" };

export default function PasswordPage() {
  return (
    <div style={{ maxWidth: 440 }}>
      <PasswordForm />
    </div>
  );
}
