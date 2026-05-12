import { Route, Routes } from 'react-router';
import { InventoryPage } from './pages/InventoryPage';
import { VehicleDetailPage } from './pages/VehicleDetailPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<InventoryPage />} />
      <Route path="/vehicle/:id" element={<VehicleDetailPage />} />
    </Routes>
  );
}
