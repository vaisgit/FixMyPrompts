
import { CheckCircle, Globe, Timer, MessageCircle, ShieldCheck } from 'lucide-react';

const TrustIndicator = () => {
  const trustItems = [
    { text: "We do not collect or store user prompts", icon: ShieldCheck },
    { text: "10K+ prompts improved so far", icon: CheckCircle },
    { text: "Used in 5+ countries", icon: Globe },
    { text: "Based on real experts' feedback", icon: MessageCircle }
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
