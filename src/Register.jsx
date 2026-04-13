import React, { useState } from 'react';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', shopName: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        alert(`Mendaftar sebagai: ${formData.shopName}`);
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="text-center text-3xl font-bold text-gray-900">Daftar Merchant Baru</h2>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Pemilik</label>
                            <input type="text" required onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Toko</label>
                            <input type="text" required onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Business</label>
                            <input type="email" required onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-emerald-500 focus:border-emerald-500" />
                        </div>
                        <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700">
                            Registrasi Toko Syariah
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}