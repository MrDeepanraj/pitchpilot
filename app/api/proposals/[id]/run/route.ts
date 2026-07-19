import { NextRequest } from "next/server";
import { getProposal } from "@/lib/db";
import { currentSeller } from "@/lib/session";
import { runProposalPipeline } from "@/lib/agents";
import type { AgentTraceEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await currentSeller();
  const { id } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      try {
        const existing = getProposal(id);
        if (!seller || !existing || existing.seller_id !== seller.id) {
          send("error", { message: "Proposal not found" });
          controller.close();
          return;
        }
        if (existing.status === "in_review" || existing.status === "approved") {
          for (const t of existing.trace) send("trace", t);
          send("done", existing);
          controller.close();
          return;
        }
        const emit = (e: AgentTraceEntry) => send("trace", e);
        const final = await runProposalPipeline(id, emit);
        send("done", final);
      } catch (err) {
        send("error", { message: (err as Error).message ?? String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
