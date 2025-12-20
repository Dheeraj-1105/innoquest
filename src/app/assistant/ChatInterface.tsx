
"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Bot, User, Languages, Cloud, BarChartHorizontal, ImageUp, ArrowUpRight } from "lucide-react";
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
  processed?: boolean;
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

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
    if(scrollAreaRef.current){
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isHistoryLoading) {
      setIsLoading(true);
      return;
    }
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // The AI is "thinking" if the last message was from the user and hasn't been processed.
      const isAwaitingResponse = lastMessage.role === 'user' && lastMessage.processed === false;
      setIsLoading(isAwaitingResponse);
    } else {
      // No messages in history, not loading.
      setIsLoading(false);
    }
  }, [messages, isHistoryLoading]);

  const addMessageToDb = async (role: 'user' | 'assistant', content: MessageContent) => {
    if (!advisoriesRef) return;
    try {
        await addDoc(advisoriesRef, {
            role,
            content,
            timestamp: serverTimestamp(),
            language,
            farmerId: user?.uid,
            processed: role === 'user' ? false : true, // Mark user messages for backend processing
        });
    } catch (error) {
        console.error("Error adding message to Firestore:", error);
        toast({
            variant: "destructive",
            title: "Database Error",
            description: "Could not save message."
        });
    }
  };
  
  const handleStartRecording = async () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to use the voice assistant.' });
        return;
    }
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await addMessageToDb("user", { audio: base64Audio });
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Recording started...", description: "Click the mic again to stop." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to chat.' });
        return;
    }

    const userInput = input;
    setInput("");
    await addMessageToDb("user", userInput);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to upload an image.' });
        return;
    }
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result as string;
      await addMessageToDb("user", { image: base64Image });
    };
    event.target.value = '';
  };


  const renderAdvice = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s"'<>()]+(?:\.[^\s"'<>()]+)*)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part && part.match(urlRegex)) {
        return (
          <Button asChild variant="link" className="p-0 h-auto font-semibold -ml-1 inline-block align-baseline whitespace-normal break-words" key={index}>
            <Link href={part} target="_blank" rel="noopener noreferrer">
              Apply Here <ArrowUpRight className="w-4 h-4 ml-1 inline-block" />
            </Link>
          </Button>
        );
      }
      if(part) {
        return <span key={index}>{part.replace(/\\n/g, '\n')}</span>;
      }
      return null;
    });
  }


  const renderMessageContent = (content: MessageContent) => {
    if (typeof content === "string") {
      return <p>{content}</p>;
    }
    if (typeof content === 'object' && content && "image" in content) {
      return <Image src={content.image} alt="Uploaded crop" width={200} height={200} className="rounded-lg" />;
    }
    if (typeof content === 'object' && content && "audio" in content) {
        return <p><i>Voice message sent... (waiting for transcription)</i></p>
    }
    if (typeof content === 'object' && content && "advice" in content) {
      return (
          <div className="space-y-4">
              <div className="whitespace-pre-wrap">{renderAdvice(content.advice)}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.weather && (
                      <Card className="bg-background/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Weather Context</CardTitle>
                              <Cloud className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                              <p className="text-sm text-muted-foreground">{content.weather}</p>
                          </CardContent>
                      </Card>
                  )}
                  {content.market && (
                      <Card className="bg-background/50">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-sm font-medium">Market Context</CardTitle>
                              <BarChartHorizontal className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                               <p className="text-sm text-muted-foreground">{content.market}</p>
                          </CardContent>
                      </Card>
                  )}
              </div>
          </div>
      );
    }
    if (typeof content === 'object' && content && "disease" in content) {
        return (
            <div className="space-y-2">
                <h4 className="font-bold">Disease Identified: {content.disease}</h4>
                <p className="font-semibold">Recommendation:</p>
                <p>{content.recommendation}</p>
            </div>
        )
    }

    return null;
  };

  const DisplayMessages = () => {
    if (isHistoryLoading && (!messages || messages.length === 0)) {
      return (
         <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
           <Bot className="w-16 h-16 mb-4 animate-pulse" />
           <h3 className="text-lg font-semibold">Loading Chat History...</h3>
         </div>
      );
    }
    if (!messages || messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
           <Bot className="w-16 h-16 mb-4" />
           <h3 className="text-lg font-semibold">Welcome to AgriAdvisor AI</h3>
           <p className="max-w-md">{user ? "You can ask me about crop diseases, weather, market prices, and government schemes." : "Please log in to start a conversation."}</p>
       </div>
      )
    }
    return (
      <div className="space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {message.role === 'assistant' && (
              <Avatar>
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            )}
            <div
              className={cn(
                "max-w-2xl rounded-lg px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary"
              )}
            >
              {renderMessageContent(message.content)}
            </div>
            {message.role === 'user' && (
              <Avatar>
                <AvatarFallback>{user?.email?.[0].toUpperCase() || <User />}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
         {isLoading && (
          <div className="flex items-start gap-3 justify-start">
             <Avatar>
                <AvatarFallback><Bot /></AvatarFallback>
              </Avatar>
            <div className="bg-secondary rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card p-4 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4 border-b pb-4">
        <h2 className="text-2xl font-headline font-bold">AI Field Agent</h2>
        <div className="flex items-center gap-2">
          <Languages className="w-5 h-5 text-muted-foreground" />
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-grow mb-4 pr-4 -mr-4" ref={scrollAreaRef}>
        <DisplayMessages />
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={user ? "Type your question or upload an image..." : "Please log in to chat"}
          className="flex-grow resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={!user || isHistoryLoading || isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || !user || isLoading || isHistoryLoading}
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
        <Button onClick={handleStartRecording} disabled={!user || isLoading || isHistoryLoading} size="icon" variant={isRecording ? "destructive" : "outline"}>
          <Mic className="w-5 h-5" />
        </Button>
        <Button onClick={() => fileInputRef.current?.click()} disabled={!user || isLoading || isHistoryLoading} size="icon" variant="outline">
          <ImageUp className="w-5 h-5" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
}
