"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Bot, User, Languages, Cloud, BarChartHorizontal, ImageUp, ArrowUpRight, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { collection, addDoc, serverTimestamp, query, orderBy, Timestamp } from "firebase/firestore";
import { getAiAdvice, getAiDiagnosisForCrop, getAiAdviceFromVoice } from "../actions";
import type { ChatAssistantOutput } from "@/ai/flows/chat-assistant-flow";
import type { DiagnoseCropDiseaseOutput } from "@/ai/flows/diagnose-crop-disease-flow";

type MessageContent =
  | string
  | { advice: string; weather?: string; market?: string; language?: string; }
  | { disease: string; recommendation: string }
  | { image: string }
  | { audio: string };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: MessageContent;
  timestamp?: Timestamp;
};

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
  { value: "ta", label: "Tamil" },
];

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const advisoriesRef = useMemoFirebase(
    () => (firestore && user ? collection(firestore, `farmers/${user.uid}/advisories`) : null),
    [firestore, user]
  );

  const advisoriesQuery = useMemoFirebase(
    () => (advisoriesRef ? query(advisoriesRef, orderBy("timestamp", "asc")) : null),
    [advisoriesRef]
  );
  
  const { data: messages, isLoading: isHistoryLoading } = useCollection<Message>(advisoriesQuery);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  const addMessageToDb = async (role: 'user' | 'assistant', content: MessageContent) => {
    if (!advisoriesRef || !user) return;
    try {
      await addDoc(advisoriesRef, {
        role,
        content,
        timestamp: serverTimestamp(),
        language,
        farmerId: user.uid,
      });
    } catch (error) {
      console.error("Database error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // 1. Save user message to history
      await addMessageToDb("user", userInput);
      
      // 2. Call AI Server Action
      const response = await getAiAdvice(userInput, language, user.uid);
      
      // 3. Save assistant response to history
      await addMessageToDb("assistant", response);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Assistant Error", description: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;
      setIsLoading(true);
      try {
        await addMessageToDb("user", { image: base64Image });
        const response = await getAiDiagnosisForCrop(base64Image, language);
        await addMessageToDb("assistant", response);
      } catch (e: any) {
        toast({ variant: "destructive", title: "Diagnosis Error", description: e.message });
      } finally {
        setIsLoading(false);
      }
    };
    event.target.value = '';
  };

  const handleStartRecording = async () => {
    if (!user) return;
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          setIsLoading(true);
          try {
            await addMessageToDb("user", { audio: base64Audio });
            const response = await getAiAdviceFromVoice(base64Audio, language, user.uid);
            await addMessageToDb("assistant", response);
          } catch (e: any) {
            toast({ variant: "destructive", title: "Voice Error", description: e.message });
          } finally {
            setIsLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      toast({ variant: "destructive", title: "Mic Error", description: "Access denied." });
    }
  };

  const renderAdviceText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s"'<>`]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <Button asChild variant="link" className="p-0 h-auto font-semibold inline-flex" key={i}>
            <Link href={part} target="_blank" rel="noopener noreferrer">
              Apply <ArrowUpRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderContent = (content: MessageContent) => {
    if (typeof content === "string") return <p className="whitespace-pre-wrap">{content}</p>;
    if ("image" in content) return <Image src={content.image} alt="Crop" width={300} height={300} className="rounded-lg shadow-sm" />;
    if ("audio" in content) return <p className="italic opacity-70">Voice message sent...</p>;
    if ("advice" in content) {
      return (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap">{renderAdviceText(content.advice)}</div>
          {(content.weather || content.market) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-muted-foreground/20">
              {content.weather && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Cloud className="w-4 h-4 shrink-0" /> <span>{content.weather}</span>
                </div>
              )}
              {content.market && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BarChartHorizontal className="w-4 h-4 shrink-0" /> <span>{content.market}</span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    if ("disease" in content) {
      return (
        <div className="space-y-2">
          <h4 className="font-bold text-primary">Diagnosis: {content.disease}</h4>
          <p className="text-sm opacity-90">{content.recommendation}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl shadow-xl overflow-hidden border">
      <div className="flex items-center justify-between p-4 bg-primary/5 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-headline font-bold">Field Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-muted-foreground" />
          <Select value={language} onValueChange={setLanguage} disabled={!user}>
            <SelectTrigger className="w-[110px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languages.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        {!user ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground">
            <User className="w-12 h-12 mb-4" />
            <p>Please log in to chat with your agent.</p>
          </div>
        ) : isHistoryLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-6">
            {messages.map(m => (
              <div key={m.id} className={cn("flex items-start gap-3", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <Avatar className="w-8 h-8 border shadow-sm">
                  <AvatarFallback className={m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                    {m.role === "user" ? (user?.email?.[0].toUpperCase() || "U") : <Bot className="w-4 h-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3 shadow-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary/40 border")}>
                  {renderContent(m.content)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 border shadow-sm"><AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback></Avatar>
                <div className="bg-secondary/40 border rounded-2xl px-4 py-3 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-12 text-muted-foreground">
            <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold">Namaste!</h3>
            <p className="text-sm">Ask me about crops, pests, weather, or government schemes.</p>
          </div>
        )}
      </ScrollArea>

      <div className="p-4 bg-background border-t space-y-4">
        <div className="flex items-center gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={user ? "Ask anything..." : "Login to start"}
            className="flex-grow min-h-[44px] h-[44px] max-h-[120px] resize-none py-2"
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={!user || isLoading}
          />
          <div className="flex items-center gap-2">
            <Button size="icon" onClick={handleSendMessage} disabled={!input.trim() || isLoading} className="rounded-full shadow-md">
              <Send className="w-4 h-4" />
            </Button>
            <Button size="icon" variant={isRecording ? "destructive" : "outline"} onClick={handleStartRecording} disabled={isLoading} className="rounded-full">
              <Mic className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="rounded-full">
              <ImageUp className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
      </div>
    </div>
  );
}
