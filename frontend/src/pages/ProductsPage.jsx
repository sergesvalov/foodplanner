import React from 'react';
import { useProductsManager } from '../hooks/useProductsManager';
import ProductForm from '../components/products/ProductForm';
import ProductTable from '../components/products/ProductTable';

const ProductsPage = () => {
  const {
    sortedProducts,
    editingId,
    form,
    setForm,
    searchTerm,
    setSearchTerm,
    UNITS,
    requestSort,
    getSortIndicator,
    resetForm,
    handleEditClick,
    handleDelete,
    handleSubmit,
    handleCreateRecipe,
    handleServerExport,
    handleServerImport
  } = useProductsManager();

  return (
    <div className="container mx-auto max-w-7xl p-4">

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 whitespace-nowrap">Каталог продуктов</h2>

        <div className="flex gap-2">
          <button
            onClick={handleServerExport}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border border-blue-200 font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            💾 Сохранить на сервер
          </button>

          <button
            onClick={handleServerImport}
            className="px-4 py-2 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 border border-orange-200 font-medium text-sm flex items-center gap-2 shadow-sm transition-colors"
          >
            📂 Загрузить с сервера
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ФОРМА (Слева) */}
        <ProductForm
          form={form}
          setForm={setForm}
          handleSubmit={handleSubmit}
          handleCreateRecipe={handleCreateRecipe}
          resetForm={resetForm}
          editingId={editingId}
          UNITS={UNITS}
        />

        {/* ТАБЛИЦА (Справа) */}
        <ProductTable
          products={sortedProducts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          requestSort={requestSort}
          getSortIndicator={getSortIndicator}
          editingId={editingId}
          handleEditClick={handleEditClick}
          handleDelete={handleDelete}
        />

      </div>
    </div>
  );
};

export default ProductsPage;
