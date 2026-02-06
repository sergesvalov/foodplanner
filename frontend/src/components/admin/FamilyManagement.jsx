import React, { useState, useEffect } from 'react';
import { fetchFamily, saveFamilyMember, deleteFamilyMember } from '../../api/admin';
import FamilyList from './FamilyList';
import FamilyForm from './FamilyForm';

const FamilyManagement = () => {
    const [family, setFamily] = useState([]);
    const [editingMember, setEditingMember] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const data = await fetchFamily();
            setFamily(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSave = async (memberData) => {
        try {
            await saveFamilyMember(memberData);
            setEditingMember(null);
            loadData();
        } catch (err) {
            alert("Ошибка сохранения: " + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить пользователя из семьи?")) return;
        try {
            await deleteFamilyMember(id);
            if (editingMember && editingMember.id === id) {
                setEditingMember(null);
            }
            loadData();
        } catch (err) {
            alert("Ошибка удаления");
        }
    };

    if (loading) return <div className="text-center p-4 text-gray-500">Загрузка данных семьи...</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-50 text-indigo-500 p-2 rounded-lg text-2xl">👤</div>
                <h3 className="text-xl font-bold text-gray-800">Пользователи</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Form Column */}
                <div>
                    <div className="sticky top-6">
                        <FamilyForm
                            onSubmit={handleSave}
                            editingMember={editingMember}
                            onCancel={() => setEditingMember(null)}
                        />
                    </div>
                </div>

                {/* List Column */}
                <div>
                    <h4 className="font-bold text-gray-400 mb-4 text-xs uppercase tracking-wide">Список участников</h4>
                    <FamilyList
                        members={family}
                        onEdit={setEditingMember}
                        onDelete={handleDelete}
                        editingId={editingMember?.id}
                    />
                </div>
            </div>
        </div>
    );
};

export default FamilyManagement;
