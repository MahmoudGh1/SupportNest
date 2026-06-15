import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function Page() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: 80 }}>Loading…</div>}>
            <VerifyEmailClient />
        </Suspense>
    );
}