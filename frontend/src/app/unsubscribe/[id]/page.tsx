import React from "react";
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import UnsubscribeClient from "@/components/subscriptions/UnsubscribeClient";
import { prisma } from "@/lib/prisma";

interface UnsubscribePageProps {
  params: Promise<{ id: string }>;
}

export default async function UnsubscribePage({ params }: UnsubscribePageProps) {
  const { id } = await params;

  // 1. Enforce session check server-side.
  // Redirect back to this exact page after successful login.
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/subscriptions/${id}/unsubscribe`);
  }

  // 2. Load the subscription preferences from DB and verify ownership
  let topic = "";
  let deliveryEmail = "";
  
  try {
    const sub = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!sub || sub.userId !== session.user.id) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-base-100 p-4">
          <div className="card w-full max-w-md bg-base-200 border border-base-300 shadow-xl overflow-hidden p-8 text-center">
            <h2 className="text-xl font-bold text-error">Subscription Not Found</h2>
            <p className="text-sm text-base-content/75 mt-4 leading-relaxed">
              The subscription you are trying to modify does not exist or you do not have permission to access it.
            </p>
            <div className="mt-6 border-t border-base-300 pt-5">
              <a href="/dashboard" className="btn btn-primary btn-sm">
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    topic = sub.topic;
    deliveryEmail = sub.deliveryEmail;
  } catch (error) {
    console.error("Unsubscribe server fetch error:", error);
  }

  // 3. Render client component with data pre-filled
  return (
    <UnsubscribeClient
      subscriptionId={id}
      initialTopic={topic}
      initialEmail={deliveryEmail}
    />
  );
}
