
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Blog = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="w-full py-4 sm:py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <img 
            src="/lovable-uploads/385e0a65-e43e-4b8c-a807-16e2af5aacfd.png" 
            alt="FixMyPrompts" 
            className="h-8 sm:h-10 object-contain"
          />
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Blog</h1>
          <p className="text-lg text-slate-600">Coming Soon</p>
        </div>
      </main>
    </div>
  );
};

export default Blog;
