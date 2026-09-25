import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/Editor";
import { getUser } from "@/lib/auth";
import { getProduct } from "@/lib/content-store";
import { getProject } from "@/lib/shop";

export const metadata = { title: "Редактор" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  const project = user && getProject((await params).id, user.id);
  const product = project && getProduct(project.product);
  if (!project || !product) notFound();
  return <Editor initial={project} product={product} signedIn={!!user.email} />;
}
