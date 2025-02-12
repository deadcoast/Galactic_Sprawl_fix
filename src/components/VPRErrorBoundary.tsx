import { AlertTriangle } from "lucide-react";
import React, { Component, ErrorInfo } from "react";

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
    this.props.onError(error, this.props.moduleId);
    console.error("VPR Module Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Module Error</span>
          </div>
          <p className="text-sm text-red-200">
            This module has encountered an error and has been disabled.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
