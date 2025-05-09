import { Location } from 'react-router-dom';

// Define custom types for router
export interface EditLocationState {
  content: string;
  prUrl: string;
}

// Extend the Location type from react-router-dom
export interface EditLocation extends Location {
  state: EditLocationState | null;
}