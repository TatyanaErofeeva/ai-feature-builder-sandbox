'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CompileErrorScreen } from './CompileErrorScreen';

interface PreviewErrorBoundaryProps {
  children: ReactNode;
  resetKey: number;
}

interface PreviewErrorBoundaryState {
  error: Error | null;
}

export class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return { error };
  }

  componentDidUpdate(prevProps: PreviewErrorBoundaryProps): void {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Ошибка изолированного превью', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return <CompileErrorScreen title="ОШИБКА ВЫПОЛНЕНИЯ" message={this.state.error.message} />;
    }

    return this.props.children;
  }
}
