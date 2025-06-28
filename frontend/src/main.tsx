import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import App from "./App.tsx";
import "./index.css";
import { SuccessPage } from "./Success.tsx";
import { ErrorPage } from "./Error.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="*" element={<ErrorPage />} />
                <Route path="/:cartID" element={<App />} />
                <Route path="/:cartID/success" element={<SuccessPage />} />
            </Routes>
        </BrowserRouter>
    </StrictMode>
);
