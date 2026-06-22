import React from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface ViewInBrowserPageProps {
  params: Promise<{ runId: string }>;
}

export default async function ViewInBrowserPage({ params }: ViewInBrowserPageProps) {
  const { runId } = await params;

  const run = await prisma.newsletterRun.findUnique({
    where: { id: runId },
  });

  if (!run || !run.htmlContent) {
    notFound();
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-white">
      <iframe
        srcDoc={run.htmlContent}
        className="w-full h-full border-0"
        title={run.subjectLine || "Newsletter Run"}
      />
    </div>
  );
}
