import React, { useState } from 'react';
import { GalleryItem } from '../types';
import { FileText, Calendar, Shield, PhoneCall, Copy, Check, Hash, Sparkles } from 'lucide-react';

interface GalleriesListProps {
  galleries: GalleryItem[];
}

export default function GalleriesList({ galleries }: GalleriesListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>Compiled Shoots Registry</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Historical audit ledger of developed selection portals.</p>
        </div>
        <span className="text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600">
          Total: {galleries.length}
        </span>
      </div>

      {galleries.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-600">No Shoots Compiled Yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Upload photographs above and click "Compile Interactive Gallery" to begin selection.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold text-xs uppercase tracking-wider">
                <th className="pb-3 pl-1">Shoot Title / ID</th>
                <th className="pb-3">Images Count</th>
                <th className="pb-3">Phone Linked</th>
                <th className="pb-3">Passcode Secure</th>
                <th className="pb-3 text-right">Compiled Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
              {galleries.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pl-1">
                    <div>
                      <span className="font-bold text-slate-900 block leading-normal">{item.title}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span>ID: {item.id}</span>
                        <button
                          onClick={() => handleCopyCode(item.id)}
                          className="hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Copy Gallery ID ID"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-2.5 h-2.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-50 border border-indigo-100 rounded text-indigo-700 text-xs font-bold">
                      <Hash className="w-3 h-3" />
                      <span>{item.imagesCount}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    {item.whatsappNumber ? (
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                        <span>+{item.whatsappNumber}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">No WhatsApp link</span>
                    )}
                  </td>
                  <td className="py-4">
                    {item.hasPassword ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                        <Shield className="w-3 h-3" />
                        <span>Protected</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Open Public</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-xs font-semibold text-slate-500 block">
                      {formatDate(item.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
