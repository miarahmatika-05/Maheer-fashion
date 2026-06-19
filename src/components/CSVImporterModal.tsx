import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, UploadCloud, Loader2, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import Papa from 'papaparse';
import { supabase } from '@/lib/supabase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CSVImporterModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  
  // Mapping state
  const [dateField, setDateField] = useState('');
  const [revenueField, setRevenueField] = useState('');
  const [channelField, setChannelField] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorText, setErrorText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Just to get headers and some preview
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setPreviewData(results.data);
          setStep(2);
        } else {
          setErrorText('Gagal membaca header CSV. Pastikan format file benar.');
        }
      },
      error: (err) => {
        setErrorText(err.message);
      }
    });
  };

  const handleProcess = () => {
    if (!dateField || !revenueField) {
      setErrorText('Kolom Tanggal dan Total Omzet wajib dipetakan!');
      return;
    }
    
    setErrorText('');
    setStep(3);
    setIsProcessing(true);

    Papa.parse(file!, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        let successCount = 0;

        try {
          // Process in batches of 100 to avoid overloading
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            
            const transactionsToInsert = [];
            const itemsToInsert = [];

            for (const row of batch) {
              const rawDate = row[dateField];
              const rawRevenue = row[revenueField];
              
              if (!rawDate || !rawRevenue) continue;

              // Cleanup data
              const revClean = String(rawRevenue).replace(/[^0-9.-]+/g, '');
              const revenue = parseFloat(revClean) || 0;
              
              // Ensure date is valid (fallback to today if unparseable)
              let dateStr = new Date().toISOString().split('T')[0];
              try {
                const d = new Date(rawDate);
                if (!isNaN(d.getTime())) {
                  dateStr = d.toISOString().split('T')[0];
                }
              } catch (e) {}

              const channel = channelField ? (row[channelField] || 'Offline') : 'Offline';
              const trxId = `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

              transactionsToInsert.push({
                id: trxId,
                date: dateStr,
                time: '12:00:00',
                channel: channel,
                total_revenue: revenue,
                admin_fee: 0,
                customer_id: null,
                status: 'success',
                created_at: new Date(dateStr).toISOString()
              });

              itemsToInsert.push({
                transaction_id: trxId,
                sku: 'IMP-GENERIC-ITEM',
                quantity: 1,
                price: revenue,
                discount: 0
              });
            }

            if (transactionsToInsert.length > 0) {
              const { error: tErr } = await supabase.from('transaksi').insert(transactionsToInsert);
              if (tErr) throw tErr;

              const { error: iErr } = await supabase.from('transaksi_items').insert(itemsToInsert);
              if (iErr) throw iErr;

              successCount += transactionsToInsert.length;
              setProgress(Math.round((successCount / rows.length) * 100));
            }
          }

          setIsProcessing(false);
          onSuccess();
        } catch (err: any) {
          setErrorText('Gagal mengimpor: ' + err.message);
          setIsProcessing(false);
        }
      }
    });
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setHeaders([]);
    setDateField('');
    setRevenueField('');
    setChannelField('');
    setErrorText('');
    setProgress(0);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gray-50/50 p-6">
            <div>
              <h3 className="text-xl font-bold font-serif italic text-royal">Smart Data Importer</h3>
              <p className="text-sm text-gray-500">Unggah file Excel/CSV lama Anda</p>
            </div>
            <button onClick={() => { reset(); onClose(); }} className="rounded-full p-2 text-gray-400 hover:bg-gray-200 transition">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-8">
            {errorText && (
              <div className="mb-6 flex items-start gap-3 rounded-lg bg-rose-50 p-4 text-rose-700">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p className="text-sm">{errorText}</p>
              </div>
            )}

            {step === 1 && (
              <div className="text-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-16 hover:bg-gray-100 hover:border-royal transition-colors"
                >
                  <UploadCloud className="mb-4 h-12 w-12 text-gray-400" />
                  <p className="mb-2 text-lg font-bold text-gray-700">Klik untuk memilih file CSV</p>
                  <p className="text-sm text-gray-500">Format yang didukung: .csv</p>
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4">
                <h4 className="mb-4 font-bold text-gray-800">Pemetaan Kolom (Data Mapping)</h4>
                <p className="mb-6 text-sm text-gray-600">Pasangkan judul kolom Supabase di sebelah kiri dengan judul kolom dari file Excel Anda di sebelah kanan.</p>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border p-4 bg-gray-50">
                    <div className="w-1/3">
                      <p className="font-bold text-sm text-gray-700">Tanggal Transaksi</p>
                      <p className="text-[10px] text-rose-500 font-bold">*Wajib</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <div className="flex-1">
                      <select 
                        value={dateField} 
                        onChange={(e) => setDateField(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                      >
                        <option value="">-- Pilih Kolom Excel Anda --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-4 bg-gray-50">
                    <div className="w-1/3">
                      <p className="font-bold text-sm text-gray-700">Total Omzet (Rp)</p>
                      <p className="text-[10px] text-rose-500 font-bold">*Wajib</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <div className="flex-1">
                      <select 
                        value={revenueField} 
                        onChange={(e) => setRevenueField(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                      >
                        <option value="">-- Pilih Kolom Excel Anda --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 rounded-lg border p-4 bg-gray-50">
                    <div className="w-1/3">
                      <p className="font-bold text-sm text-gray-700">Channel Jualan</p>
                      <p className="text-[10px] text-gray-500">(Opsional)</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                    <div className="flex-1">
                      <select 
                        value={channelField} 
                        onChange={(e) => setChannelField(e.target.value)}
                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-royal focus:outline-none focus:ring-1 focus:ring-royal"
                      >
                        <option value="">-- Lewati (Otomatis "Offline") --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
                  <Button className="bg-royal text-white hover:bg-royal/90" onClick={handleProcess}>
                    Mulai Impor Data
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-10">
                {!isProcessing && progress === 100 ? (
                  <div className="animate-in zoom-in flex flex-col items-center">
                    <CheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
                    <h4 className="text-xl font-bold text-gray-800">Impor Selesai!</h4>
                    <p className="text-gray-500 mt-2 mb-6">Data penjualan Anda telah berhasil dimasukkan ke dalam sistem.</p>
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => { reset(); onClose(); }}>
                      Tutup & Muat Ulang
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Loader2 className="mb-6 h-12 w-12 animate-spin text-royal" />
                    <h4 className="text-lg font-bold text-gray-800 mb-2">Memproses Data...</h4>
                    <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-2">
                      <div className="bg-royal h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="text-sm font-bold text-royal">{progress}% Selesai</p>
                    <p className="text-xs text-gray-500 mt-4">Mohon jangan tutup halaman ini.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
