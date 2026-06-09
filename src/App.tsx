import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Home = lazy(() => import("./components/Home").then(({ Home }) => ({ default: Home })));
const Instructions = lazy(() => import("./components/Instructions").then(({ Instructions }) => ({ default: Instructions })));
const Photobooth = lazy(() => import("./components/Photobooth").then(({ Photobooth }) => ({ default: Photobooth })));
const Success = lazy(() => import("./components/Success").then(({ Success }) => ({ default: Success })));
const DataPage = lazy(() => import("./components/DataPage").then(({ DataPage }) => ({ default: DataPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950">
      <div className="relative w-10 h-10">
        <span className="absolute inset-0 border-4 border-neutral-800 rounded-full" />
        <span className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/photobooth" element={<Photobooth />} />
          <Route path="/success" element={<Success />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

