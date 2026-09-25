"use client";
import { useRouter } from "next/navigation";

export function DeleteProjectButton({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button
      className="link-btn small"
      onClick={async () => {
        if (!confirm("Удалить проект? Это действие нельзя отменить.")) return;
        await fetch(`/api/projects/${id}`, { method: "DELETE" });
        router.refresh();
      }}
    >
      Удалить
    </button>
  );
}
