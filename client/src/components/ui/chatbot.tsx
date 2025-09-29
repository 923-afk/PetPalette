import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { authManager } from "@/lib/auth";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Hi! I’m your PetCare assistant. Ask me about bookings, pet records, or clinic info.",
        timestamp: Date.now(),
      },
    ];
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isOpen]);

  const headers = useMemo(() => {
    const base: HeadersInit = { "Content-Type": "application/json" };
    const auth = authManager.getAuthHeader();
    return { ...base, ...auth } as HeadersInit;
  }, []);

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setInput("");

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const replyText = data?.reply ?? "Sorry, I didn’t catch that.";
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: replyText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "There was an error contacting the assistant. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSending(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <div className={cn("transition-all", isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none")}> 
          <div className="mb-3 w-[320px] h-[440px] rounded-xl border bg-card shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                Assistant
              </div>
              <button className="p-1 hover:opacity-80" onClick={() => setIsOpen(false)} aria-label="Close chat">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div ref={scrollRef} className="h-[330px] overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}> 
                  <div className={cn(
                    "max-w-[75%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground border"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <div className="flex items-end gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={isSending ? "Sending…" : "Ask about bookings, records, hours…"}
                  className="min-h-[44px] max-h-[96px]"
                  disabled={isSending}
                />
                <Button onClick={() => void sendMessage()} disabled={isSending || !input.trim()}>
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Button size="icon" className="h-12 w-12 rounded-full shadow-lg" onClick={() => setIsOpen((v) => !v)} aria-label="Open chat">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </div>
    </>
  );
}

export default Chatbot;

