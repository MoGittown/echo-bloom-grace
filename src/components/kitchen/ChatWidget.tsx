import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Trash2, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useKitchenChat } from '@/hooks/useKitchenChat';
import { cn } from '@/lib/utils';

const QUICK_QUESTIONS = [
  'Welche Arbeitsplatte ist am besten?',
  'Was kostet eine Küche ungefähr?',
  'Moderne vs. klassische Küche?',
  'Tipps für kleine Küchen?',
];

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, suggestedQuestions, isLoading, sendMessage, clearChat } = useKitchenChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const assistantStartRef = useRef<HTMLDivElement>(null);
  const lastRoleRef = useRef<'user' | 'assistant' | null>(null);

  // Scroll behavior:
  // - When a new assistant answer starts streaming: scroll to the TOP of that answer (so the beginning is readable)
  // - When the user sends a message / on open: scroll to the end
  useEffect(() => {
    if (!isOpen) return;
    const last = messages[messages.length - 1];
    if (!last) return;

    if (last.role === 'assistant') {
      if (lastRoleRef.current !== 'assistant') {
        assistantStartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    lastRoleRef.current = last.role;
  }, [messages, isOpen]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-12 right-0 bg-card border rounded-lg px-3 py-1.5 shadow-md whitespace-nowrap text-sm"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Fragen zur Küche?
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-primary/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Küchen-Assistent</h3>
                  <p className="text-xs text-muted-foreground">KI-gestützte Beratung</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={clearChat}
                    title="Chat löschen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {messages.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <h4 className="font-medium mb-1">Hallo! 👋</h4>
                    <p className="text-sm text-muted-foreground">
                      Ich bin dein KI-Assistent für alle Fragen rund um die Küchenplanung.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground text-center">Schnellfragen:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {QUICK_QUESTIONS.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-1.5 px-2.5"
                          onClick={() => handleQuickQuestion(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, i) => {
                    const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1;
                    const showSuggestions = isLastAssistant && suggestedQuestions.length > 0 && !isLoading;
                    
                    return (
                      <div key={i} className="space-y-2">
                        <motion.div
                          ref={isLastAssistant ? assistantStartRef : undefined}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'flex gap-2',
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Bot className="w-3.5 h-3.5 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              'rounded-2xl px-3.5 py-2 max-w-[85%] text-sm',
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-md'
                                : 'bg-muted rounded-bl-md'
                            )}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.role === 'user' && (
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                              <User className="w-3.5 h-3.5 text-secondary-foreground" />
                            </div>
                          )}
                        </motion.div>
                        
                        {/* Suggested questions under the last assistant message */}
                        {showSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="ml-8 flex flex-wrap gap-1.5"
                          >
                            {suggestedQuestions.map((q, qi) => (
                              <Button
                                key={qi}
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-1 px-2 bg-background/80 hover:bg-primary/10 border-primary/20"
                                onClick={() => sendMessage(q)}
                              >
                                {q}
                              </Button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  {isLoading && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-2"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            <form onSubmit={handleSubmit} className="p-3 border-t bg-background/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Stell mir eine Frage..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className="flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Ihr Küchenberater
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
