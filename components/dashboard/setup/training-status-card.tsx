"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrainingStatusCardProps {
  state: "training" | "ready";
  onRetrain?: () => void;
}

export function TrainingStatusCard({
  state,
  onRetrain,
}: TrainingStatusCardProps) {
  const isTraining = state === "training";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
      <Card hover={false} className="text-center py-16">
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F2F0EB]">
            {isTraining ? (
              <Loader2 size={32} strokeWidth={1.5} className="text-[#2D3A31] animate-spin" />
            ) : (
              <CheckCircle2 size={32} strokeWidth={1.5} className="text-[#2D3A31]" />
            )}
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#2D3A31] mb-2">
              {isTraining ? "Training your chatbot…" : "Your chatbot is ready!"}
            </h2>
            <p className="font-sans text-[#8C9A84] text-base max-w-sm mx-auto">
              {isTraining
                ? "We're processing your content and building the knowledge base. This usually takes a minute or two."
                : "Training is ready. You can now customize your chatbot's appearance and embed it on your website."}
            </p>
          </div>

          {!isTraining && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard/chatbot/customize">
                <Button variant="primary" size="md">
                  Customize
                  <ChevronRight size={16} strokeWidth={1.5} className="ml-1" />
                </Button>
              </Link>
              <Link href="/dashboard/chatbot/embed">
                <Button variant="secondary" size="md">
                  Get embed code
                </Button>
              </Link>
              <Button variant="secondary" size="md" onClick={onRetrain}>
                <RefreshCw size={14} strokeWidth={1.5} className="mr-1.5" />
                Re-train
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
