import { ApiStatus } from "../features/system/ApiStatus";

/**
 * Root application component.
 * @returns The main application JSX layout.
 */
export function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
      }}
    >
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          color: "#0f172a",
          marginBottom: "0.5rem",
        }}
      >
        AGROWAVE
      </h1>
      <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
        Simulador de enlaces LPWAN en Colombia
      </p>
      <ApiStatus />
    </main>
  );
}
