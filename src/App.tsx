import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VeterinaryDashboard from './VeterinaryDashboard';
import DispatchCalendarDashboard from './components/DispatchCalendarDashboard';

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