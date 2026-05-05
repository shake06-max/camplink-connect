import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Share2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Survey = { id: string; slug: string; title: string; prompt: string | null };
type Resp = { id: string; rating: number; comment: string | null; created_at: string };

const Anon = () => {
  const [params, setParams] = useSearchParams();
  const slug = params.get("s");
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<Resp[]>([]);
  const [rating, setRating] = useState(7);
  const [comment, setComment] = useState("");
  const [title, setTitle] = useState("How was it? 🌶️");
  const [prompt, setPrompt] = useState("Rate the experience anonymously — your name is never shown.");

  useEffect(() => { document.title = "How Was It? — Anonymous"; }, []);

  const load = async () => {
    if (!slug) { setSurvey(null); return; }
    const { data: s } = await supabase.from("anon_surveys").select("*").eq("slug", slug).maybeSingle();
    if (!s) { toast.error("Survey not found"); return; }
    setSurvey(s as Survey);
    const { data: r } = await supabase.from("anon_responses").select("*").eq("survey_id", s.id).order("created_at", { ascending: false });
    setResponses((r ?? []) as Resp[]);
  };
  useEffect(() => { load(); }, [slug]);

  const create = async () => {
    const { data, error } = await supabase.from("anon_surveys").insert({ title: title.trim() || "How was it?", prompt: prompt.trim() || null }).select().single();
    if (error) { toast.error(error.message); return; }
    setParams({ s: data.slug });
  };

  const submit = async () => {
    if (!survey) return;
    const { error } = await supabase.from("anon_responses").insert({ survey_id: survey.id, rating, comment: comment.trim() || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks — totally anonymous 🤫");
    setComment(""); setRating(7); load();
  };

  const shareUrl = survey ? `${window.location.origin}/anon?s=${survey.slug}` : "";
  const share = async () => {
    if (!shareUrl) return;
    if (navigator.share) { try { await navigator.share({ title: survey?.title, url: shareUrl }); return; } catch {} }
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-md space-y-4 py-6">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold flex items-center justify-center gap-2"><Sparkles className="h-6 w-6 text-accent" /> How Was It?</h1>
          <p className="text-xs text-muted-foreground mt-1">100% anonymous · share with anyone</p>
        </div>

        {!survey ? (
          <Card className="p-4 gradient-card space-y-3">
            <p className="text-sm font-semibold">Create a new anonymous rating link</p>
            <div><Label className="text-xs">Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs">Prompt</Label><Textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} /></div>
            <Button className="w-full gradient-accent" onClick={create}>Generate shareable link</Button>
          </Card>
        ) : (
          <>
            <Card className="p-4 gradient-card space-y-3">
              <h2 className="font-bold text-lg">{survey.title}</h2>
              {survey.prompt && <p className="text-xs text-muted-foreground">{survey.prompt}</p>}
              <div className="flex items-center gap-1 flex-wrap">
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setRating(n)} className={`h-9 w-9 rounded-full text-sm font-bold border ${n === rating ? "gradient-accent text-primary-foreground border-transparent" : "border-border text-muted-foreground"}`}>{n}</button>
                ))}
              </div>
              <Textarea placeholder="Optional: leave a comment…" value={comment} onChange={e => setComment(e.target.value)} rows={2} maxLength={500} />
              <Button className="w-full gradient-accent" onClick={submit}>Submit anonymously</Button>
              <div className="flex gap-2 pt-2 border-t border-border">
                <Button variant="outline" className="flex-1" onClick={share}><Share2 className="h-4 w-4 mr-1" />Share</Button>
                <Button variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success("Copied"); }}><Copy className="h-4 w-4 mr-1" />Copy</Button>
              </div>
              <p className="text-[10px] text-muted-foreground break-all">{shareUrl}</p>
            </Card>

            <Card className="p-4 gradient-card">
              <p className="text-sm font-semibold mb-2">Responses ({responses.length})</p>
              {responses.length === 0 ? <p className="text-xs text-muted-foreground">No responses yet.</p> : (
                <div className="space-y-2">
                  {responses.map(r => (
                    <div key={r.id} className="rounded-md border border-border p-2">
                      <div className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" /><span className="text-xs font-bold">{r.rating}/10</span><span className="text-[10px] text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString()}</span></div>
                      {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Button variant="ghost" className="w-full" onClick={() => setParams({})}>Create another</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Anon;
