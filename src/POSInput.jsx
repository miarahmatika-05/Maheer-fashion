import React, { useState } from 'react';

export default function POSInput() {
    const [cartTotal, setCartTotal] = useState(250000); // Contoh nilai statis
    const [charity, setCharity] = useState(0);

    const calculateTotal = () => cartTotal + Number(charity);

    return (
        <div className="flex h-screen bg-gray-100 p-6 gap-6">
            {/* Product Grid (Kiri) */}
            <div className="flex-1 bg-white rounded-xl shadow-md p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Katalog Produk</h1>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                        ✓ Sharia Compliant System
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="border p-4 rounded-lg hover:border-emerald-500 cursor-pointer transition">
                            <div className="h-32 bg-gray-200 rounded mb-2"></div>
                            <p className="font-semibold text-gray-700">Produk Busana {item}</p>
                            <p className="text-emerald-600">Rp 125.000</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Checkout Sidebar (Kanan) */}
            <div className="w-96 bg-white rounded-xl shadow-md p-6 flex flex-col">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">Ringkasan Pesanan</h2>
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>Rp {cartTotal.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <label className="block text-xs font-bold text-blue-700 mb-1">Infaq / Sedekah (Opsional)</label>
                        <div className="flex gap-2">
                            <button onClick={() => setCharity(cartTotal * 0.025)} className="text-[10px] bg-blue-200 px-2 py-1 rounded">2.5% Zakat</button>
                            <input type="number" value={charity} onChange={(e) => setCharity(e.target.value)} className="w-full text-sm border-none bg-transparent focus:ring-0" placeholder="Rp 0" />
                        </div>
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900 mb-4">
                        <span>Total Akhir</span>
                        <span className="text-emerald-700">Rp {calculateTotal().toLocaleString()}</span>
                    </div>
                    <button className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg">
                        Bayar & Cetak Struk
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-3 italic">
                        "Semoga Allah memberkahi jual beli Anda."
                    </p>
                </div>
            </div>
        </div>
    );
}