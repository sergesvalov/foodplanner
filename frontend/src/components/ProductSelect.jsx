import React, { useState, useEffect, useRef, useMemo } from 'react';

const ProductSelect = ({ products, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedProduct = (products || []).find(p => p.id === parseInt(value));

  // ОПТИМИЗАЦИЯ: Фильтрация происходит только при изменении products или searchTerm
  const filteredProducts = useMemo(() => {
    return (products || []).filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleSelect = (id) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
       <div
         className={`
            border rounded p-2 w-full cursor-text flex justify-between items-center bg-white transition-shadow
            ${isOpen ? 'ring-2 ring-indigo-200 border-indigo-400' : 'border-gray-300'}
         `}
         onClick={() => {
           if (!isOpen) setIsOpen(true);
         }}
       >
         {isOpen ? (
           <input
             autoFocus
             className="outline-none w-full text-sm text-gray-700 placeholder-gray-400"
             placeholder="Начните вводить название..."
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
         ) : (
           <span className={`text-sm truncate ${!selectedProduct ? "text-gray-400" : "text-gray-800"}`}>
             {selectedProduct ? selectedProduct.name : "Выберите продукт"}
           </span>
         )}
         
         <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
         </svg>
       </div>

       {isOpen && (
         <ul className="absolute z-50 w-full bg-white border border-gray-200 mt-1 max-h-60 overflow-y-auto rounded-md shadow-lg animate-fadeIn">
           {filteredProducts.length === 0 ? (
             <li className="p-3 text-gray-400 text-sm text-center">
               Ничего не найдено
             </li>
           ) : (
             filteredProducts.map(product => (
               <li
                 key={product.id}
                 className={`
                    p-2 px-3 cursor-pointer text-sm flex justify-between items-center border-b border-gray-50 last:border-0
                    ${product.id === parseInt(value) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}
                 `}
                 onClick={() => handleSelect(product.id)}
               >
                 <span className="font-medium">{product.name}</span>
                 
                 <span className="text-xs text-gray-400 flex flex-col items-end">
                    <span>{product.amount} {product.unit}</span>
                    <span className="text-[10px] text-orange-500">
                        {product.calories > 0 ? `${product.calories} ккал/100г` : ''}
                    </span>
                 </span>
               </li>
             ))
           )}
         </ul>
       )}
    </div>
  );
};

export default ProductSelect;