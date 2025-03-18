import { AlertTriangle } from 'lucide-react';
import * as React from "react";
import { Component, ErrorInfo } from 'react';

interface Props {
  moduleId: string;
  onError: (error: Error, moduleId: string) => void;
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class VPRErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props?.onError(error, this.props?.moduleId);
    console.error('VPR Module Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-lg border border-red-700/30 bg-red-900/20 p-4">
          <div className="mb-2 flex items-center space-x-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Module Error</span>
          </div>
          <p className="text-sm text-red-200">
            This module has encountered an error and has been disabled.
          </p>
        </div>
      );
    }

    return this.props?.children;
  }
}
