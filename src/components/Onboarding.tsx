
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (level: string, interests: string[]) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [level, setLevel] = useState<string>('');
  const [interests, setInterests] = useState<string[]>([]);
  const [name, setName] = useState<string>('');
  
  const handleLevelSelect = (selectedLevel: string) => {
    setLevel(selectedLevel);
    setStep(2);
  };
  
  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };
  
  const handleComplete = () => {
    if (interests.length > 0) {
      onComplete(level, interests);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-white z-50 p-5 flex flex-col">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-2xl font-bold text-finance-navy mb-2">Välkommen till Market Mentor</h1>
        <p className="text-finance-gray">Låt oss anpassa upplevelsen för dig</p>
      </div>
      
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-medium mb-5 text-center">Hur bekant är du med finansmarknader?</h2>
          
          <div className="space-y-3 mb-6">
            <button 
              onClick={() => handleLevelSelect('novice')}
              className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium mb-1">Nybörjare</h3>
              <p className="text-sm text-finance-gray">Jag är ny på börsen och vill lära mig grunderna</p>
            </button>
            
            <button 
              onClick={() => handleLevelSelect('analyst')}
              className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium mb-1">Intermediär</h3>
              <p className="text-sm text-finance-gray">Jag har investerat tidigare och förstår de flesta begrepp</p>
            </button>
            
            <button 
              onClick={() => handleLevelSelect('pro')}
              className="w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-medium mb-1">Avancerad</h3>
              <p className="text-sm text-finance-gray">Jag är en erfaren investerare med djup marknadskunskap</p>
            </button>
          </div>
          
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-1">
              <div className="h-1 w-6 rounded-full bg-finance-navy opacity-100"></div>
              <div className="h-1 w-6 rounded-full bg-finance-navy opacity-30"></div>
            </div>
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-medium mb-5 text-center">Välj dina intressen</h2>
          <p className="text-sm text-finance-gray text-center mb-6">Välj minst ett område som intresserar dig</p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            {['Aktier', 'ETFer', 'Kryptovalutor', 'Råvaror', 'Makroekonomi', 'Teknisk analys'].map((interest) => (
              <button 
                key={interest}
                onClick={() => handleInterestToggle(interest)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  interests.includes(interest) 
                    ? 'bg-finance-lightBlue bg-opacity-10 border-finance-lightBlue text-finance-blue' 
                    : 'hover:bg-gray-50'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
          
          <div className="mt-8 mb-6">
            <label className="block text-sm mb-2">Ditt namn (frivilligt)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skriv ditt namn"
              className="w-full p-3 border rounded-md"
            />
          </div>
          
          <button
            onClick={handleComplete}
            disabled={interests.length === 0}
            className={`w-full py-3 px-4 rounded-md text-white transition-colors ${
              interests.length > 0 
                ? 'bg-finance-navy hover:bg-finance-blue' 
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Starta din marknadspuls
          </button>
          
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-1">
              <div className="h-1 w-6 rounded-full bg-finance-navy opacity-30"></div>
              <div className="h-1 w-6 rounded-full bg-finance-navy opacity-100"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
