import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";

type Conv = { id: string; user_a: string; user_b: string; last_message_at: string; other?: { id: string; display_name: string | null } };
type Msg = { id: string; conversation_id: string; sender_id: string; content: string; created_at: string };

const Chat = () => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const activeId = params.get("c");
  const [convos, setConvos] = useState<Conv[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Chat — Camplink"; }, []);

  const loadConvos = async () => {
    if (!user) return;
    const { data } = await supabase.from("conversations").select("*").or(`user_a.eq.${user.id},user_b.eq.${user.id}`).order("last_message_at", { ascending: false });
    const list = (data ?? []) as Conv[];
    const otherIds = list.map(c => (c.user_a === user.id ? c.user_b : c.user_a));
    if (otherIds.length) {
      const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", otherIds);
      const map = new Map(profs?.map(p => [p.id, p]));
      list.forEach(c => { const oid = c.user_a === user.id ? c.user_b : c.user_a; c.other = map.get(oid) as any ?? { id: oid, display_name: null }; });
    }
    setConvos(list);
  };

  const loadMessages = async () => {
    if (!activeId) { setMessages([]); return; }
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", activeId).order("created_at");
    setMessages((data ?? []) as Msg[]);
  };

  useEffect(() => { loadConvos(); }, [user]);
  useEffect(() => { loadMessages(); }, [activeId]);

  useEffect(() => {
    if (!activeId) return;
    const ch = supabase.channel(`msgs-${activeId}`).on("postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
      (p) => setMessages(m => [...m, p.new as Msg])
    ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || !user || !activeId) return;
    const content = input.trim().slice(0, 2000);
    setInput("");
    const { error } = await supabase.from("messages").insert({ conversation_id: activeId, sender_id: user.id, content });
    if (!error) await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeId);
  };

  if (activeId) {
    const conv = convos.find(c => c.id === activeId);
    return (
      <AppShell>
        <div className="flex items-center gap-3 mb-3">
          <Button size="icon" variant="ghost" onClick={() => setParams({})}><ArrowLeft className="h-5 w-5" /></Button>
          <Avatar><AvatarFallback className="bg-primary/20 text-primary">{(conv?.other?.display_name ?? "U").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
          <p className="font-semibold">{conv?.other?.display_name ?? "Chat"}</p>
        </div>
        <Card className="gradient-card h-[60vh] flex flex-col">
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user?.id ? "gradient-accent text-primary-foreground" : "bg-secondary"}`}>{m.content}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="p-2 border-t border-border flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message…" />
            <Button onClick={send} className="gradient-accent" size="icon"><Send className="h-4 w-4" /></Button>
          </div>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold mb-4">💬 Chats</h1>
      {convos.length === 0 ? (
        <Card className="p-8 text-center gradient-card text-muted-foreground">No conversations yet. Start one from a listing!</Card>
      ) : (
        <div className="space-y-2">
          {convos.map(c => (
            <Card key={c.id} className="p-3 gradient-card hover:shadow-glow transition-smooth cursor-pointer flex items-center gap-3" onClick={() => setParams({ c: c.id })}>
              <Avatar><AvatarFallback className="bg-primary/20 text-primary">{(c.other?.display_name ?? "U").slice(0,2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="flex-1">
                <p className="font-semibold text-sm">{c.other?.display_name ?? "User"}</p>
                <p className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Chat;
