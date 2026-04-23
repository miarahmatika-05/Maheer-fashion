import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Product } from '@/types';
import { addProduct } from '@/lib/supabaseService';

const CATEGORIES = ['Gamis', 'Koko', 'Hijab', 'Tunik', 'Aksesoris'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'All Size'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProduct: Product) => void;
}

export function ProductFormModal({ isOpen, onClose, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [size, setSize] = useState(SIZES[0]);
  const [color, setColor] = useState('');
  const [hpp, setHpp] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const [generatedSku, setGeneratedSku] = useState('');

  // Generate SKU automatically when category, size, or color changes
  useEffect(() => {
    if (category && size && color) {
      const catPrefix = category.slice(0, 2).toUpperCase();
      const colPrefix = color.slice(0, 3).toUpperCase();
      const sizeStr = size.toUpperCase().replace(/\s+/g, '');
      const randomId = Math.floor(1000 + Math.random() * 9000); // 4 digit
      setGeneratedSku(`${catPrefix}-${sizeStr}-${colPrefix}-${randomId}`);
    } else {
      setGeneratedSku('');
    }
  }, [category, size, color]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!name || !color || !hpp || !price || !stock || !generatedSku) {
      setErrorText('Mohon lengkapi semua data.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pData = {
        sku: generatedSku,
        name,
        category,
        size,
        color,
        hpp: Number(hpp),
        price: Number(price),
        stock: Number(stock),
        initial_stock: Number(stock),
      };

      const newProd = await addProduct(pData);
      onSuccess(newProd);
      
      // Reset form
      setName('');
      setCategory(CATEGORIES[0]);
      setSize(SIZES[0]);
      setColor('');
      setHpp('');
      setPrice('');
      setStock('');
    } catch (err: any) {
      setErrorText(err.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl"
        >
          <div className="flex items-center justify-between border-b p-6">
            <h3 className="font-serif text-xl font-bold italic text-royal">Add New Product</h3>
            <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nama Produk</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                  placeholder="Contoh: Gamis Al-Zahra"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Size */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ukuran</label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal bg-white"
                  >
                    {SIZES.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Warna</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                  placeholder="Contoh: Royal Blue"
                  required
                />
              </div>

              {/* Generated SKU Display */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-xs text-gray-500 mb-1">SKU yang akan di-generate (Otomatis):</p>
                <p className="font-mono text-sm font-bold text-royal">
                  {generatedSku || 'Isi Kategori dan Warna untuk generate SKU'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* HPP */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">HPP (Modal)</label>
                  <input
                    type="number"
                    value={hpp}
                    onChange={(e) => setHpp(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                    placeholder="250000"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Harga Jual</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                    placeholder="350000"
                    required
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Jumlah Stok</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                  placeholder="50"
                  required
                />
              </div>
            </div>

            {errorText && (
              <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
                {errorText}
              </div>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" className="bg-royal text-white hover:bg-royal/90" disabled={isSubmitting || !generatedSku}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Produk'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
