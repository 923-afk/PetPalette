import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { authManager } from "@/lib/auth";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
};

export function Chatbot() {
  const { isAuthenticated, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: "welcome",
        role: "assistant",
        text:
          "Hi! I'm your PetCare assistant. Ask me about appointments, vaccines, clinic hours, medical records, and more.",
      },
    ];
  });

  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const placeholder = useMemo(() => {
    if (user?.userType === "clinic") return "Ask about schedule, patients, or analytics";
    return "Ask about booking, vaccines, or pet care";
  }, [user?.userType]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: trimmed };
    setMessages((prev: ChatMessage[]) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authManager.getAuthHeader(),
        },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Failed to send" }));
        throw new Error(err.message || "Failed to send");
      }
      const data = (await res.json()) as { reply: string };
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.reply,
      };
      setMessages((prev: ChatMessage[]) => [...prev, botMsg]);
    } catch (e: any) {
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: e?.message || "Sorry, something went wrong.",
      };
      setMessages((prev: ChatMessage[]) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!open ? (
        <Button onClick={() => setOpen(true)} className="rounded-full h-12 w-12 p-0 shadow-lg" aria-label="Open chatbot">
          <Sparkles className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="w-[360px] max-h-[520px] flex flex-col shadow-2xl">
          <CardHeader className="py-3 px-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                PetCare Assistant
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close chatbot">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col">
            <div className="p-3 space-y-2 overflow-auto" style={{ maxHeight: 380 }}>
              {messages.map((m: ChatMessage) => (
                <div key={m.id} className={m.role === "assistant" ? "flex" : "flex justify-end"}>
                  <div
                    className={
                      "rounded-2xl px-3 py-2 max-w-[80%] text-sm " +
                      (m.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground")
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="border-t p-2 flex items-center gap-2">
              <Input
                placeholder={placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={loading}
              />
              <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon" aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

