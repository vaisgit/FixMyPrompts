
import { useState, useRef } from 'react';
import { Copy, Sparkles, Info, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('General');
  const [improvedPrompt, setImprovedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

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
      // TODO: Replace with actual Cloudflare Worker endpoint
      const response = await fetch('/api/improve-prompt', {
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
      
      // Smooth scroll to result
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-6 px-4">
        <div className="max-w-4xl mx-auto flex justify-center">
          <img 
            src="/lovable-uploads/385e0a65-e43e-4b8c-a807-16e2af5aacfd.png" 
            alt="FixMyPrompts" 
            className="h-12 md:h-16 object-contain"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 pb-16">
        
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Turn rough ideas into crystal clear AI prompts.
            <br />
            <span className="text-blue-600">Save tokens, save time, get better answers.</span>
          </h1>
        </section>

        {/* Tool Section */}
        <section className="mb-16">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 md:p-8">
              
              {/* Input Area */}
              <div className="mb-6">
                <Textarea
                  placeholder="Enter your rough prompt idea here... (e.g., 'Help me write about dogs' or 'Make a business plan')"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  className="min-h-[120px] text-base resize-none border-2 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Category Pills */}
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Category:</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105 ${
                        selectedCategory === category 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'hover:bg-blue-50 hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <div className="text-center mb-4">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3 animate-pulse" />
                      Fix my prompt
                    </>
                  )}
                </Button>
              </div>

              {/* Disclaimer */}
              <div className="flex items-center justify-center text-sm text-slate-600">
                <Info className="w-4 h-4 mr-2 text-blue-500" />
                We never store your prompts
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Result Section */}
        {showResult && (
          <section ref={resultRef} className="mb-16 animate-fade-in">
            <Card className="shadow-xl border-0 bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-green-600" />
                  Your Improved Prompt
                </h3>
                <div className="bg-white rounded-lg p-4 mb-4 border-2 border-green-200">
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {improvedPrompt}
                  </p>
                </div>
                <div className="flex gap-3 justify-center sm:justify-start">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    className="border-green-300 hover:bg-green-50"
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
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Examples Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            See it in action
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exampleCards.map((example, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <Badge variant="destructive" className="mb-2 text-xs">BEFORE</Badge>
                    <p className="text-slate-600 text-sm italic">"{example.before}"</p>
                  </div>
                  <div>
                    <Badge variant="default" className="mb-2 text-xs bg-green-600">AFTER</Badge>
                    <p className="text-slate-800 text-sm font-medium leading-relaxed">
                      {example.after}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Bar */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <h3 className="text-xl font-bold mb-2">Sharpen</h3>
                  <p className="text-blue-100">Transform vague ideas into precise instructions</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Expand</h3>
                  <p className="text-blue-100">Add crucial context and specific requirements</p>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Guide</h3>
                  <p className="text-blue-100">Structure prompts for optimal AI responses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-4">
            <a href="#" className="text-slate-300 hover:text-white mx-4 transition-colors">Privacy Policy</a>
            <a href="#" className="text-slate-300 hover:text-white mx-4 transition-colors">Contact</a>
            <a href="#" className="text-slate-300 hover:text-white mx-4 transition-colors">Blog</a>
          </div>
          <p className="text-slate-400 text-sm">
            Copyright 2025, FixMyPrompts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
