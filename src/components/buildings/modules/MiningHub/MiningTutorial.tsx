/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import { ChevronRight, Database, Settings, Truck, X } from 'lucide-react';
import * as React from "react";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
  target: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: 'Resource Management',
    description:
      'View and manage your resource nodes. Each node shows its type, abundance, and extraction rate.',
    icon: Database,
    target: 'resource-nodes',
  },
  {
    title: 'Mining Fleet',
    description:
      'Monitor your mining ships and their current activities. Ships automatically transport resources back to storage.',
    icon: Truck,
    target: 'mining-fleet',
  },
  {
    title: 'Priority System',
    description: 'Set mining priorities to determine which resources should be extracted first.',
    icon: ChevronRight,
    target: 'priority-controls',
  },
  {
    title: 'Storage Thresholds',
    description:
      'Configure minimum and maximum storage levels to maintain optimal resource levels.',
    icon: Settings,
    target: 'threshold-controls',
  },
];

interface MiningTutorialProps {
  onClose: () => void;
}

export function MiningTutorial({ onClose }: MiningTutorialProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-lg bg-gray-800 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-indigo-500/20 p-2">
              <Icon className="h-6 w-6 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-white">{step.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <p className="mb-6 text-gray-300">{step.description}</p>

        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === currentStep ? 'bg-indigo-500' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="flex items-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700"
          >
            <span>{currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
