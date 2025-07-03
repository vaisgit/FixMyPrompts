import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
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
      <main className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <article className="prose prose-blue prose-lg bg-white/80 rounded-2xl shadow-md p-6 sm:p-10 border border-slate-200">
          <h1 className="text-3xl font-bold mb-4">FixMyPrompts Privacy Policy</h1>
          <p>At <strong>FixMyPrompts</strong>, we respect your privacy and are committed to protecting your data. This policy outlines what we do and do <strong>not</strong> collect when you use our AI prompt optimization tool.</p>

          <h2 className="mt-8 text-2xl font-semibold">What We Do <strong>Not</strong> Collect</h2>
          <ul className="list-disc ml-6">
            <li>We <strong>never</strong> collect or store the actual prompts you input.</li>
            <li>Your creative ideas, research questions, problem-solving requests, or image generation prompts remain entirely private and are <strong>never</strong> logged.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">What We <strong>Do</strong> Collect (Anonymously)</h2>
          <ul className="list-disc ml-6">
            <li>We may collect minimal, <strong>non-personally identifiable feedback</strong>, such as whether you "liked" or "disliked" a prompt improvement attempt.</li>
            <li>This feedback is fully anonymized and used solely to improve prompt clarity, <strong>token efficiency</strong>, and overall <strong>AI prompt optimization</strong> experience.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Third-Party Analytics</h2>
          <ul className="list-disc ml-6">
            <li>We use <strong>Google Analytics</strong> to monitor usage patterns. Data is collected in an <strong>anonymous</strong>, aggregated form.</li>
            <li>Google may place non-personal cookies to track basic usage statistics only—no personal data is captured.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Use of Data</h2>
          <ul className="list-disc ml-6">
            <li>Data collected is used exclusively for enhancing prompt-engineering performance, reducing unnecessary token usage, and improving user experience.</li>
            <li>We do <strong>not</strong> share, sell, or disclose any data with external parties.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Cookies</h2>
          <ul className="list-disc ml-6">
            <li>Only <strong>Google Analytics cookies</strong> may be set, and solely to capture anonymous usage metrics.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Security</h2>
          <ul className="list-disc ml-6">
            <li>We implement standard security practices to safeguard anonymized data.</li>
            <li>Since we do not store personal information, risks are limited.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Links to Third Parties</h2>
          <ul className="list-disc ml-6">
            <li>Our site may link to other websites. We are not responsible for their privacy practices—please review their policies individually.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Children</h2>
          <ul className="list-disc ml-6">
            <li>Our service is <strong>not intended</strong> for individuals under 13 years old.</li>
            <li>We do not knowingly collect any personal data from minors.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Changes to This Policy</h2>
          <ul className="list-disc ml-6">
            <li>We may update this policy periodically. The <strong>Last Updated</strong> date below reflects the most recent revision.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">Contact Us</h2>
          <p>For questions or requests to delete anonymized feedback data, please visit: <a href="https://fixmyprompts.com/contact" className="text-blue-600 underline">fixmyprompts.com/contact</a></p>

          <hr className="my-8" />
          <p className="text-sm text-slate-500"><strong>Last Updated:</strong> July 2, 2025</p>
        </article>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
