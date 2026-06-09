import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { Photobooth } from "./components/Photobooth";
import { Instructions } from "./components/Instructions";
import { Success } from "./components/Success";
import { DataPage } from "./components/DataPage";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/instructions" element={<Instructions />} />
        <Route path="/photobooth" element={<Photobooth />} />
        <Route path="/success" element={<Success />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

