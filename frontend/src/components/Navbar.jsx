import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white";
  };

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl flex items-center gap-2">
              📅 FoodPlanner
            </Link>
            
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/')}`}>
                План на неделю
              </Link>
              
              <Link to="/shopping-list" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/shopping-list')}`}>
                🛒 Покупки
              </Link>

              <Link to="/products" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/products')}`}>
                📦 Продукты
              </Link>
              
              <Link to="/recipes" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/recipes')}`}>
                🍳 Рецепты
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;