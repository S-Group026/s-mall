import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Client from './Client';
import Admin from './Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Client />} />
        <Route path="/admin/*" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
