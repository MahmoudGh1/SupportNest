import { Suspense } from "react";
import PaymentCallbackClient from "./PaymentCallbackClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: 80 }}>Processing...</div>
      }
    >
      <PaymentCallbackClient />
    </Suspense>
  );
}
