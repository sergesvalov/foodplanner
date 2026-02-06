import React, { useState } from 'react';
import AdminAuth from '../components/admin/AdminAuth';
import FamilyManagement from '../components/admin/FamilyManagement';
import TelegramManagement from '../components/admin/TelegramManagement';
import BackupManagement from '../components/admin/BackupManagement';

const AdminPage = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    if (!isAuthenticated) {
        return <AdminAuth onLogin={() => setIsAuthenticated(true)} />;
    }

    return (
        <div className="h-full w-full bg-gray-50 min-h-[calc(100vh-64px)]">
            <div className="container mx-auto max-w-6xl p-6 lg:p-8 pb-32">
                {/* Header */}
                <div className="flex justify-between items-center mb-10 border-b border-gray-200 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Панель управления</h1>
                        <p className="text-gray-500 mt-1">Системные настройки и управление</p>
                    </div>
                    <button
                        onClick={() => setIsAuthenticated(false)}
                        className="text-red-600 font-bold px-4 py-2 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    >
                        Выйти
                    </button>
                </div>

                {/* Content Grid */}
                <div className="space-y-8">

                    {/* Section: Family */}
                    <section>
                        <FamilyManagement />
                    </section>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Section: Telegram */}
                        <section className="h-full">
                            <TelegramManagement />
                        </section>

                        {/* Section: Backups */}
                        <section className="h-full">
                            <BackupManagement />
                        </section>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AdminPage;