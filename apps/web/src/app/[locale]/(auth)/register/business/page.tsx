import { Suspense } from "react";
import BusinessDetailsClient from "./businessClienta";

export default function Page() {
    return (
        <Suspense fallback={<div style={{ textAlign: "center", padding: 80 }}>Loading…</div>}>
            <BusinessDetailsClient />
        </Suspense>
    );
}