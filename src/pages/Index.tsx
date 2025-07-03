import { useState, useRef } from 'react';
import { Copy, Sparkles, Info, RotateCcw, Check, SlidersHorizontal, Timer, Zap, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import TrustIndicator from '@/components/TrustIndicator';

const Index = () => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const [feedbackState, setFeedbackState] = useState<{ [promptId: string]: 'liked' | 'disliked' | null }>({});

  const categories = [
    'General',
    'Creative Writing', 
    'Research',
    'Problem Solving',
    'Image Gen'
  ];

  const exampleCards = [
    {
      before: "Write about dogs",
      after: "Write a 500-word informative article about dog breeds, focusing on temperament differences, care requirements, and suitability for different family types. Include specific examples and practical advice for potential dog owners."
    },
    {
      before: "Help me with my business",
      after: "Act as a business consultant and provide a comprehensive analysis of my small e-commerce startup. Include actionable strategies for customer acquisition, revenue optimization, and competitive positioning in the online retail space."
    },
    {
      before: "Make an image of a sunset",
      after: "Create a photorealistic image of a golden hour sunset over a calm ocean, with warm orange and pink hues reflecting on the water, silhouetted palm trees in the foreground, and dramatic clouds in the sky. Shot with a wide-angle lens, high resolution, professional photography style."
    }
  ];

  const handleSubmit = async () => {
    if (!inputPrompt.trim()) {
      toast({
        title: "Please enter a prompt",
        description: "We need something to work with!",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setShowResult(false);

    try {
      const response = await fetch('/improve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputPrompt,
          category: selectedCategory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to improve prompt');
      }

      const data = await response.json();
      setImprovedPrompt(data.improvedPrompt);
      setShowResult(true);
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);

    } catch (error) {
      console.error('Error improving prompt:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(improvedPrompt);
      setCopied(true);
      toast({
        title: "Copied to clipboard!",
        description: "Your improved prompt is ready to use."
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please select and copy manually.",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    handleSubmit();
  };

  const promptId = improvedPrompt ? btoa(unescape(encodeURIComponent(improvedPrompt))).slice(0, 16) : '';

  const handleFeedback = async (liked: boolean) => {
    if (!promptId || feedbackState[promptId]) return;
    try {
      await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, liked }),
      });
      setFeedbackState((prev) => ({ ...prev, [promptId]: liked ? 'liked' : 'disliked' }));
    } catch (e) {
      toast({ title: 'Feedback failed', description: 'Please try again later.', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full pt-6 pb-3 sm:pt-8 sm:pb-4 px-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <img 
            src="/lovable-uploads/385e0a65-e43e-4b8c-a807-16e2af5aacfd.png" 
            alt="FixMyPrompts" 
            className="h-14 object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4">
        
        {/* Hero Section */}
        <section className="text-center mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 leading-tight px-2">
            Turn rough ideas into crystal clear AI prompts.
          </h3>
        </section>

        {/* Tool Section */}
        <section className="mb-8 sm:mb-12">
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/40 p-4 sm:p-5 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500">
            
            {/* Input Area */}
            <div className="mb-4 sm:mb-5">
              <Textarea
                placeholder="Enter your rough prompt idea here... (e.g., 'Help me write about dogs' or 'Make a business plan')"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                className="min-h-[100px] sm:min-h-[120px] text-sm sm:text-base resize-none border-0 bg-slate-50/50 focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 rounded-2xl transition-all duration-300 placeholder:text-slate-400"
              />
            </div>

            {/* Category Pills */}
            <div className="mb-5 sm:mb-6">
              <p className="text-xs sm:text-sm font-medium text-slate-700 mb-3">Category:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-all duration-300 hover:scale-105 rounded-full border-2 ${
                      selectedCategory === category 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg border-blue-600' 
                        : 'hover:bg-blue-50 hover:border-blue-300 border-slate-200 bg-white/50'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center mb-4 sm:mb-5">
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                    Improving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 animate-pulse" />
                    Fix my prompt (It's free!)
                  </>
                )}
              </Button>
            </div>

            {/* Trust Indicator */}
            <TrustIndicator />
          </div>
        </section>

        {/* Result Section */}
        {showResult && (
          <section ref={resultRef} className="mb-12 sm:mb-16 animate-fade-in">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200/60 p-4 sm:p-6 md:p-8 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-600" />
                Your Improved Prompt
              </h3>
              <div className="bg-white rounded-xl p-3 sm:p-4 mb-4 border border-green-200/80">
                <p className="text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {improvedPrompt}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start w-full sm:w-auto">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-green-300 hover:bg-green-50 rounded-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleRetry}
                    variant="outline"
                    disabled={isLoading}
                    className="rounded-lg"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
                <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                  <span className="text-xs text-slate-500 mb-1">How did we do?</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className={`rounded-lg flex items-center gap-2 ${feedbackState[promptId] === 'liked' ? 'border-blue-500 bg-blue-50 shadow' : ''}`}
                      onClick={() => handleFeedback(true)}
                      disabled={!!feedbackState[promptId]}
                    >
                      <ThumbsUp className="w-4 h-4" /> I love it
                    </Button>
                    <Button
                      variant="outline"
                      className={`rounded-lg flex items-center gap-2 ${feedbackState[promptId] === 'disliked' ? 'border-red-500 bg-red-50 shadow' : ''}`}
                      onClick={() => handleFeedback(false)}
                      disabled={!!feedbackState[promptId]}
                    >
                      <ThumbsDown className="w-4 h-4" /> Not good
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Examples Section */}
        <section className="mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 mb-6 sm:mb-8">
            See it in action
          </h2>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {exampleCards.map((example, index) => (
              <Card key={index} className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-200/60 rounded-xl">
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4">
                    <Badge variant="destructive" className="mb-2 text-xs rounded-full">BEFORE</Badge>
                    <p className="text-slate-600 text-sm italic">"{example.before}"</p>
                  </div>
                  <div>
                    <Badge variant="default" className="mb-2 text-xs bg-green-600 rounded-full">AFTER</Badge>
                    <p className="text-slate-800 text-sm font-medium leading-relaxed">
                      {example.after}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 rounded-2xl p-6 sm:p-8">
            <div className="grid gap-6 sm:gap-8 md:grid-cols-3 text-center">
              <div className="space-y-3">
                <div className="flex justify-center">
                  <SlidersHorizontal className="w-8 h-8 sm:w-10 sm:h-10 text-blue-100" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Structure</h3>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">Format your prompt the right way to get high-quality results instantly.</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Timer className="w-8 h-8 sm:w-10 sm:h-10 text-blue-100" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Speed</h3>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">Skip prompt trial-and-error and get to the answer faster.</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-center">
                  <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-blue-100" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Efficiency</h3>
                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">Make every token count — get more done without burning through credits.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-4">
            <Link to="/privacy-policy" className="text-slate-300 hover:text-white mx-3 sm:mx-4 transition-colors text-sm sm:text-base">Privacy Policy</Link>
            <Link to="/contact" className="text-slate-300 hover:text-white mx-3 sm:mx-4 transition-colors text-sm sm:text-base">Contact</Link>
            <Link to="/blog" className="text-slate-300 hover:text-white mx-3 sm:mx-4 transition-colors text-sm sm:text-base">Blog</Link>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm">
            Copyright 2025, FixMyPrompts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
