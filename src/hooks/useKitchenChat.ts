import { useState, useCallback, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { trackFunnel, trackError } from '@/lib/analytics';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kitchen-chat`;
const QUESTIONS_SEPARATOR = '---FRAGEN---';

// Parse response to extract main content and suggested questions
const parseResponse = (content: string): { text: string; questions: string[] } => {
  const parts = content.split(QUESTIONS_SEPARATOR);
  const text = parts[0].trim();
  
  if (parts.length > 1) {
    const questionsText = parts[1].trim();
    const questions = questionsText
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && q.endsWith('?'));
    return { text, questions };
  }
  
  return { text, questions: [] };
};

const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

export const useKitchenChat = () => {
  const { slug: studioSlug } = useParams<{ slug?: string }>();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const hasTrackedChatUse = useRef(false);

  // Extract suggested questions from the last assistant message
  const suggestedQuestions = useMemo(() => {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistant) return [];
    const { questions } = parseResponse(lastAssistant.content);
    return questions.slice(0, 3); // Max 3 questions
  }, [messages]);

  // Get display messages (with questions stripped from content)
  const displayMessages = useMemo(() => {
    return messages.map(msg => {
      if (msg.role === 'assistant') {
        const { text } = parseResponse(msg.content);
        return { ...msg, content: text };
      }
      return msg;
    });
  }, [messages]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      toast.error('Bitte warten Sie einen Moment vor der nächsten Frage.');
      return;
    }
    setLastRequestTime(now);

    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    if (!hasTrackedChatUse.current) {
      hasTrackedChatUse.current = true;
      trackFunnel('chat_used', studioSlug);
    }

    let assistantContent = '';

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => 
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      // Send only the text part of messages (without suggested questions)
      const allMessages = [...messages, userMsg].map(msg => {
        if (msg.role === 'assistant') {
          const { text } = parseResponse(msg.content);
          return { ...msg, content: text };
        }
        return msg;
      });
      
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || 'Verbindungsfehler');
      }

      if (!resp.body) {
        throw new Error('Keine Antwort vom Server');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch {
            // Incomplete JSON, put back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) updateAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      trackError('kitchen_chat', error instanceof Error ? error.message : String(error), studioSlug);
      toast.error(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
      // Remove the user message if we failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, lastRequestTime, studioSlug]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages: displayMessages,
    suggestedQuestions,
    isLoading,
    sendMessage,
    clearChat,
  };
};
