import { Component } from 'react';

/**
 * Keeps a failure contained. Without this, an exception anywhere in the tree
 * unmounts the whole page and leaves a blank screen.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Section failed to render:', error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div className="boundary-fallback" role="alert">
            <p>This section could not load.</p>
            <button type="button" onClick={() => this.setState({ failed: false })}>
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
