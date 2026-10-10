import { useState } from "react";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/** Compact newsletter sign-up for the article sidebar. */
export default function NewsletterCard() {
  const [email, setEmail] = useState("");
  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setEmail("");
      toast.success("You are on the list");
    },
  });

  return (
    <aside aria-label="Newsletter" className="rounded-2xl bg-[#172039] p-6 text-white">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c7f76d] text-[#172039]">
          <Mail size={18} />
        </span>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#c7f76d]">The builder dispatch</p>
          <h3 className="mt-1.5 font-display text-lg font-semibold tracking-[-.04em]">One useful note, no inbox noise.</h3>
        </div>
      </div>
      <form
        className="mt-4"
        onSubmit={event => {
          event.preventDefault();
          subscribe.mutate({ email, source: "article-sidebar" });
        }}
      >
        <label htmlFor="sidebar-newsletter-email" className="sr-only">Email address</label>
        <input
          id="sidebar-newsletter-email"
          required
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm outline-none transition placeholder:text-white/40 focus:border-[#c7f76d]"
        />
        <button
          type="submit"
          disabled={subscribe.isPending}
          className="btn mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#c7f76d] px-5 py-2.5 text-sm font-semibold text-[#172039] transition hover:bg-white disabled:opacity-60"
        >
          {subscribe.isPending ? "Subscribing…" : "Subscribe"}
          {subscribe.isSuccess ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
        </button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-white/50">Unsubscribe whenever you want. We never sell your address.</p>
    </aside>
  );
}