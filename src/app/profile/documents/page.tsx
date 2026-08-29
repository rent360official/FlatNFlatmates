import { ShieldCheck, FileText, UploadCloud, AlertCircle } from "lucide-react";
import React from "react";

export default function DocumentVaultPage() {
  const documents = [
    { name: "Government ID (Aadhaar / Passport)", type: "Identity Proof", status: "verified", date: "2026-08-16" },
    { name: "Permanent Account Number (PAN Card)", type: "Tax Identity", status: "pending", date: "2026-08-18" },
    { name: "Active Rent Agreement", type: "Address Proof", status: "missing", date: null },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center space-x-1 bg-bg-status-successBg/15 text-brand-primary px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-100">
            <ShieldCheck className="h-3 w-3" />
            <span>Verified</span>
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-100">
            <AlertCircle className="h-3 w-3" />
            <span>Pending Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold border">
            <span>Not Uploaded</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 font-sans">Document Vault</h2>
        <p className="text-xs text-slate-500">Securely store your identity papers, address proofs, and leases. Documents are private and only shared upon call consent.</p>
      </div>

      <div className="space-y-4 max-w-3xl">
        <div className="bg-brand-primary rounded-xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold">100% Secure Storage</h3>
            <p className="text-[11px] text-brand-primary/20">All uploaded vault files are protected with short-lived presigned URLs and AWS-SSE encryption.</p>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center bg-white/10 text-white border border-white/10 px-3 py-1 rounded text-xs font-semibold">
              AES-256 Enabled
            </span>
          </div>
        </div>

        <div className="border rounded-xl divide-y bg-white">
          {documents.map((doc) => (
            <div key={doc.name} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-500 border mt-0.5">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{doc.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    Category: {doc.type} {doc.date && `| Uploaded on: ${doc.date}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 justify-end">
                {getStatusBadge(doc.status)}
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
