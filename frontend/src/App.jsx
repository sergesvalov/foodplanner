import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import RecipesPage from './pages/RecipesPage';
import ShoppingListPage from './pages/ShoppingListPage';
import TodayPage from './pages/TodayPage';
import AdminPage from './pages/AdminPage'; // <-- Импорт

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-100">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/today" element={<TodayPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/recipes" element={<RecipesPage />} />
            <Route path="/shopping-list" element={<ShoppingListPage />} />
            <Route path="/admin" element={<AdminPage />} /> {/* <-- Новый роут */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;