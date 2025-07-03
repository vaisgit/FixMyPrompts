import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Contact = () => {
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
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Contact</h1>
          <div className="w-full flex justify-center">
            <div className="w-full max-w-2xl">
              <style>{`
                @media screen and (max-width: 600px) {
                  .calendly-inline-widget { height: 500px !important; }
                }
              `}</style>
              <iframe
                src="https://calendly.com/vaisakhans/contact-fixmyprompts?hide_gdpr_banner=1"
                title="Book a call with FixMyPrompts"
                className="calendly-inline-widget w-full min-h-[650px] border-0 rounded-xl shadow-lg"
                style={{ minHeight: '650px', height: '650px', width: '100%' }}
                allowTransparency={true}
                frameBorder="0"
              ></iframe>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
