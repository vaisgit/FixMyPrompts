
import { CheckCircle, Globe, Timer, MessageCircle, ShieldCheck } from 'lucide-react';

const TrustIndicator = () => {
  const trustItems = [
    { text: "100K+ prompts improved", icon: CheckCircle },
    { text: "Used in 15+ countries", icon: Globe },
    { text: "1.4s avg response time", icon: Timer },
    { text: "Based on real expert feedback", icon: MessageCircle },
    { text: "Zero prompt storage", icon: ShieldCheck }
  ];

  return (
    <div className="flex justify-center overflow-hidden py-2">
      <div className="flex animate-marquee whitespace-nowrap space-x-8">
        {trustItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={index} className="flex items-center space-x-2 text-slate-500">
              <IconComponent className="w-3 h-3" />
              <span className="text-xs font-medium">{item.text}</span>
            </div>
          );
        })}
        {/* Duplicate for seamless loop */}
        {trustItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div key={`duplicate-${index}`} className="flex items-center space-x-2 text-slate-500">
              <IconComponent className="w-3 h-3" />
              <span className="text-xs font-medium">{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustIndicator;
