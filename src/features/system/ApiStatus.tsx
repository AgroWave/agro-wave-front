import { useEffect, useState } from "react";
import { getHealth } from "../../api/health";
import { t } from "../../i18n";

/**
 * Component displaying the connectivity status to the backend API.
 * @returns JSX element rendering the status banner.
 */
export function ApiStatus() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then((data) => {
        if (isMounted) {
          setIsAvailable(data.status === "ok" && data.database === "ok");
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsAvailable(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "0.5rem",
        border: "1px solid #e2e8f0",
        maxWidth: "400px",
        margin: "2rem auto",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <h2 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>
        {t("system.api_status_title")}
      </h2>
      {isAvailable === null && <p>{t("system.checking")}</p>}
      {isAvailable === true && (
        <div style={{ color: "#16a34a", fontWeight: "bold" }}>
          <span aria-hidden="true">● </span>
          <span>{t("system.api_available")}</span>
        </div>
      )}
      {isAvailable === false && (
        <div style={{ color: "#dc2626", fontWeight: "bold" }}>
          <span aria-hidden="true">● </span>
          <span>{t("system.api_unavailable")}</span>
        </div>
      )}
    </div>
  );
}
