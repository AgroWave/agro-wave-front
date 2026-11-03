import { AppProviders } from "./providers";
import { AppRouter } from "./router";

/**
 * Root application component wrapping router inside providers.
 * @returns Root element tree.
 */
export function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
