"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send, Bot, User, Languages, AlertCircle, Cloud, Wheat, BarChartHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAiAdvice, getAiAdviceFromVoice } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string | { advice: string; weather?: string; market?: string };
  timestamp: string;
};

const languages = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
  { value: "ta", label: "Tamil" },
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("en");
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if(scrollAreaRef.current){
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight });
    }
  }, [messages]);

  const handleStartRecording = async () => {
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
          setIsLoading(true);
          setMessages((prev) => [
            ...prev,
            { id: Date.now(), role: "user", content: "🎤 Voice message", timestamp: new Date().toLocaleTimeString() },
          ]);

          try {
            const result = await getAiAdviceFromVoice(base64Audio, language);
            setMessages((prev) => [
              ...prev,
              { id: Date.now() + 1, role: "assistant", content: result, timestamp: new Date().toLocaleTimeString() },
            ]);
          } catch (error) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to process voice input. Please try again.",
            });
            setMessages(prev => prev.slice(0, -1)); // Remove user message placeholder
          } finally {
            setIsLoading(false);
          }
        };
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
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
    const userInput = input;
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", content: userInput, timestamp: new Date().toLocaleTimeString() },
    ]);
    
    try {
      const result = await getAiAdvice(userInput, language);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: result, timestamp: new Date().toLocaleTimeString() },
      ]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get advice. Please try again.",
      });
      setMessages(prev => prev.slice(0, -1)); // Remove user message
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageContent = (content: Message["content"]) => {
    if (typeof content === "string") {
      return <p>{content}</p>;
    }

    return (
        <div className="space-y-4">
            <p>{content.advice}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.weather && (
                    <Card className="bg-background/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Weather</CardTitle>
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
                            <CardTitle className="text-sm font-medium">Market Info</CardTitle>
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
  };

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
        <div className="space-y-6">
          {messages.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <Bot className="w-16 h-16 mb-4" />
                <h3 className="text-lg font-semibold">Welcome to AgriAdvisor AI</h3>
                <p className="max-w-md">You can ask me about crop diseases, weather, market prices, and more. Use the text box below or press the microphone to ask with your voice.</p>
            </div>
          )}
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
                  "max-w-md rounded-lg px-4 py-3",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary"
                )}
              >
                {renderMessageContent(message.content)}
                <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
              </div>
              {message.role === 'user' && (
                <Avatar>
                  <AvatarFallback><User /></AvatarFallback>
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
      </ScrollArea>

      <div className="flex items-center gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question here..."
          className="flex-grow resize-none"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          disabled={isLoading}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          size="icon"
        >
          <Send className="w-5 h-5" />
        </Button>
        <Button onClick={handleStartRecording} disabled={isLoading} size="icon" variant={isRecording ? "destructive" : "outline"}>
          <Mic className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
