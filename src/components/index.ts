// Components exports

// UI components (base primitives)
export * from './ui';

// Common components (shared across features)
export * from './common';

// Layout components
export * from './layouts';

// Feature components
export * from './features';

// Legacy exports for backward compatibility
export { ErrorBoundary, withErrorBoundary } from './ErrorBoundary';
export { default as DashboardErrorBoundary } from './DashboardErrorBoundary';
export { Providers } from './Providers';
