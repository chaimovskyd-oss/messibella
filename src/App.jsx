import { Toaster } from '@/components/ui/toaster';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from '@/components/ScrollToTop';
import Catalog from '@/pages/Catalog';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="*" element={<Catalog />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
