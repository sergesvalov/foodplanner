import React from 'react';

const PersonalPage = () => {
    return (
        <div className="h-full w-full bg-gray-50 min-h-[calc(100vh-64px)]">
            <div className="container mx-auto max-w-6xl p-6 lg:p-8 pb-32">
                {/* Header */}
                <div className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Личное</h1>
                        <p className="text-gray-500 mt-1">Персональная информация и настройки</p>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <p className="text-gray-600">Здесь будет ваша личная информация.</p>
                </div>
            </div>
        </div>
    );
};

export default PersonalPage;
