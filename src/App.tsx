import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VeterinaryDashboard from './VeterinaryDashboard'; // หน้าเดิม
import DispatchCalendarDashboard from './components/DispatchCalendarDashboard'; // เพิ่มหน้านี้

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VeterinaryDashboard />} />
        <Route path="/DispatchCalendarDashboard" element={<DispatchCalendarDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;