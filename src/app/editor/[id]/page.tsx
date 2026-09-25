import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { getUser } from "@/lib/auth";
import { getProject } from "@/lib/shop";

export const metadata = { title: "Редактор" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  const project = user && getProject((await params).id, user.id);
  if (!project) notFound();
  return <Editor initial={project} signedIn={!!user.email} />;
}
