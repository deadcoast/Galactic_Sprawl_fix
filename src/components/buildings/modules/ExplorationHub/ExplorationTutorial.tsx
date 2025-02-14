import { AlertTriangle, ChevronRight, History, Map, Rocket, X } from 'lucide-react';
import React from 'react';

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Sector Navigation',
    description:
      'Explore the galaxy map to discover new sectors. Unmapped sectors appear dimmed until scanned by recon ships.',
    icon: Map,
  },
  {
    title: 'Anomaly Detection',
    description:
      'Watch for anomaly indicators that may signal valuable discoveries or potential threats.',
    icon: AlertTriangle,
  },
  {
    title: 'Recon Fleet',
    description:
      'Manage your recon ships to scan sectors and investigate anomalies. Ships gain experience over time.',
    icon: Rocket,
  },
  {
    title: 'Mission Logs',
    description:
      'Track your exploration progress and discoveries in the mission log. High-priority findings are highlighted.',
    icon: History,
  },
];

interface ExplorationTutorialProps {
  onClose: () => void;
}

export function ExplorationTutorial({ onClose }: ExplorationTutorialProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Icon className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-medium text-white">{step.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">{step.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-teal-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
          >
            <span>{currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
