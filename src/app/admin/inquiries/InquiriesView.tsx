'use client';

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Mail, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle,
  Edit2, Trash2, ExternalLink, Save, Check, Shield, Filter, Eye, Phone, Flag
} from "lucide-react";
import {
  updateInquiryStatusAction,
  deleteInquiryAction,
  updateContactEmailSettingAction,
} from "./actions";

interface InquiryDoc {
  _id: string;
  type: "inquiry" | "report";
  propertyId?: string;
  propertyTitle?: string;
  reporterUserId?: string;
  contactInfo: string;
  name?: string;
  reason: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  adminNotes?: string;
  userIp?: string;
  targetEmail?: string;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  initialInquiries: InquiryDoc[];
  initialContactEmail: string;
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  // Inquiries
  general_inquiry: { label: "General Inquiry", color: "bg-blue-50 text-blue-700 border-blue-200" },
  listing_issue: { label: "Listing Inquiry", color: "bg-amber-50 text-amber-700 border-amber-200" },
  flatmate_issue: { label: "Flatmate Search Issue", color: "bg-purple-50 text-purple-700 border-purple-200" },
  feedback: { label: "Feedback & Suggestion", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  business_partnership: { label: "Partnership / Broker", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  technical_support: { label: "Tech Support / Bug", color: "bg-rose-50 text-rose-700 border-rose-200" },
  
  // Reports
  inaccurate_info: { label: "Incorrect Info / Price", color: "bg-amber-50 text-amber-800 border-amber-300" },
  already_rented: { label: "Already Rented", color: "bg-slate-100 text-slate-800 border-slate-300" },
  fake_listing: { label: "Fake Listing / Photos", color: "bg-rose-50 text-rose-800 border-rose-300" },
  broker_pretending_owner: { label: "Broker Posing as Owner", color: "bg-purple-50 text-purple-800 border-purple-300" },
  scam_or_fraud: { label: "Scam / Fraud", color: "bg-red-100 text-red-900 border-red-300 font-bold" },
  inappropriate_content: { label: "Inappropriate Content", color: "bg-rose-50 text-rose-800 border-rose-300" },

  other: { label: "Other", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800 border-amber-300", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-300", icon: RefreshCw },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-slate-100 text-slate-700 border-slate-300", icon: XCircle },
};

export default function InquiriesView({ initialInquiries, initialContactEmail }: Props) {
  const [inquiries, setInquiries] = useState<InquiryDoc[]>(initialInquiries);
  const [configuredEmail, setConfiguredEmail] = useState(initialContactEmail);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState(initialContactEmail);
  const [emailSaveSuccess, setEmailSaveSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "inquiry" | "report">("all");
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDoc | null>(null);
  const [modalNotes, setModalNotes] = useState("");
  const [modalStatus, setModalStatus] = useState<"pending" | "in_progress" | "resolved" | "closed">("pending");

  const [isPending, startTransition] = useTransition();
  const [actionLoading, setActionLoading] = useState(false);

  // Handle saving target contact email
  const handleSaveContactEmail = async () => {
    setEmailError(null);
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setActionLoading(true);
    const res = await updateContactEmailSettingAction(emailInput.trim());
    setActionLoading(false);

    if (res.success && res.email) {
      setConfiguredEmail(res.email);
      setEditingEmail(false);
      setEmailSaveSuccess(true);
      setTimeout(() => setEmailSaveSuccess(false), 3000);
    } else {
      setEmailError(res.error || "Failed to save email");
    }
  };

  // Open detail modal
  const handleOpenDetail = (inq: InquiryDoc) => {
    setSelectedInquiry(inq);
    setModalStatus(inq.status);
    setModalNotes(inq.adminNotes || "");
  };

  // Save modal status & notes
  const handleSaveModal = async () => {
    if (!selectedInquiry) return;
    setActionLoading(true);

    const res = await updateInquiryStatusAction(selectedInquiry._id, modalStatus, modalNotes);
    setActionLoading(false);

    if (res.success && res.inquiry) {
      setInquiries((prev) =>
        prev.map((item) => (item._id === selectedInquiry._id ? res.inquiry : item))
      );
      setSelectedInquiry(res.inquiry);
    }
  };

  // Delete inquiry
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    setActionLoading(true);
    const res = await deleteInquiryAction(id);
    setActionLoading(false);

    if (res.success) {
      setInquiries((prev) => prev.filter((item) => item._id !== id));
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(null);
      }
    }
  };

  // Filtered inquiries
  const filteredInquiries = inquiries.filter((inq) => {
    if (typeFilter !== "all" && (inq.type || "inquiry") !== typeFilter) {
      return false;
    }
    if (statusFilter !== "all" && inq.status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchContact = inq.contactInfo.toLowerCase().includes(q);
      const matchName = inq.name?.toLowerCase().includes(q);
      const matchDesc = inq.description.toLowerCase().includes(q);
      const matchReason = inq.reason.toLowerCase().includes(q);
      const matchProp = inq.propertyTitle?.toLowerCase().includes(q);
      return matchContact || matchName || matchDesc || matchReason || matchProp;
    }
    return true;
  });

  const pendingCount = inquiries.filter((i) => i.status === "pending").length;
  const reportsCount = inquiries.filter((i) => i.type === "report").length;
  const inquiriesCount = inquiries.filter((i) => (i.type || "inquiry") === "inquiry").length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mail className="h-6 w-6 text-brand-primary" />
            Inquiries & Listing Reports
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage public contact inquiries, property listing moderation reports, and configure destination recipient routing.
          </p>
        </div>
      </div>

      {/* Configurable Contact Email Section */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/20 text-brand-primary border border-brand-primary/30 uppercase tracking-wider">
                Configurable Route
              </span>
              <span className="text-xs text-slate-400">Destination Notifications Email</span>
            </div>
            <h2 className="text-lg font-bold text-white">Contact & Reports Recipient Email</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              When users submit contact inquiries or flag a property listing report, email dispatches are sent to this address:
            </p>
          </div>

          <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex-1 max-w-md">
            {editingEmail ? (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-300">
                  Target Recipient Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="e.g. rent360official@gmail.com"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-xs focus:outline-none focus:border-brand-primary"
                />
                {emailError && <p className="text-[11px] text-rose-400">{emailError}</p>}
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    onClick={handleSaveContactEmail}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-xs disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Email</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingEmail(false);
                      setEmailInput(configuredEmail);
                      setEmailError(null);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="h-9 w-9 rounded-lg bg-brand-primary/20 text-brand-primary flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Current Target</p>
                    <p className="text-sm font-bold text-white truncate">{configuredEmail}</p>
                  </div>
                </div>

                <button
                  onClick={() => setEditingEmail(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 transition border border-slate-600"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>
              </div>
            )}

            {emailSaveSuccess && (
              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Successfully updated contact email setting!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Type & Status Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        
        {/* Type Filter Pills (Identifiable Inquiries vs Reports) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">Filter by:</span>
            <button
              onClick={() => setTypeFilter("all")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <span>All Messages ({inquiries.length})</span>
            </button>

            <button
              onClick={() => setTypeFilter("inquiry")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === "inquiry"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Inquiries ({inquiriesCount})</span>
            </button>

            <button
              onClick={() => setTypeFilter("report")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                typeFilter === "report"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Listing Reports ({reportsCount})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contact, property, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: `All Statuses` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "in_progress", label: "In Progress" },
            { id: "resolved", label: "Resolved" },
            { id: "closed", label: "Closed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-slate-800 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries & Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredInquiries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No records found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no messages matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Sender / Reporter</th>
                  <th className="py-3 px-4">Reason & Target</th>
                  <th className="py-3 px-4">Message Snippet</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInquiries.map((inq) => {
                  const isReport = inq.type === "report";
                  const reasonInfo = REASON_LABELS[inq.reason] || { label: inq.reason, color: "bg-slate-100 text-slate-700 border-slate-200" };
                  const statusInfo = STATUS_CONFIG[inq.status] || STATUS_CONFIG.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={inq._id} className={`hover:bg-slate-50/70 transition ${isReport ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(inq.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <div className="text-[10px] text-slate-400">
                          {new Date(inq.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isReport ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-2xs">
                            <Flag className="w-3 h-3 text-rose-600" />
                            <span>REPORT</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Mail className="w-3 h-3 text-blue-500" />
                            <span>INQUIRY</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {inq.name || "Registered User"}
                        </div>
                        <div className="text-[11px] text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                          {inq.contactInfo}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${reasonInfo.color}`}>
                          {reasonInfo.label}
                        </span>
                        {inq.propertyTitle && (
                          <div className="mt-1 text-[11px] text-slate-600 truncate max-w-xs flex items-center gap-1">
                            <span className="text-slate-400">Property:</span>
                            {inq.propertyId ? (
                              <Link
                                href={`/flat/${inq.propertyId}`}
                                target="_blank"
                                className="font-semibold text-brand-primary hover:underline flex items-center gap-0.5 truncate"
                              >
                                <span>{inq.propertyTitle}</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </Link>
                            ) : (
                              <span className="font-medium text-slate-700">{inq.propertyTitle}</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                        {inq.description}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetail(inq)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="View Details & Notes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(inq._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-xl ${selectedInquiry.type === 'report' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                  {selectedInquiry.type === 'report' ? <Flag className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedInquiry.type === 'report' ? 'Listing Moderation Report' : 'User Contact Inquiry'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${selectedInquiry.type === 'report' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                      {selectedInquiry.type === 'report' ? 'Report' : 'Inquiry'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Record ID: {selectedInquiry._id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* If Reported Property */}
            {selectedInquiry.type === 'report' && selectedInquiry.propertyTitle && (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Reported Listing</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedInquiry.propertyTitle}</p>
                </div>
                {selectedInquiry.propertyId && (
                  <Link
                    href={`/flat/${selectedInquiry.propertyId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition shadow-2xs"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            )}

            {/* Sender Overview */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                  {selectedInquiry.type === 'report' ? 'Reporter Name' : 'Sender Name'}
                </span>
                <span className="font-semibold text-slate-900">{selectedInquiry.name || "Registered User"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Contact Info</span>
                <span className="font-semibold text-slate-900 font-mono">{selectedInquiry.contactInfo}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Reason</span>
                <span className="font-medium text-slate-800">
                  {REASON_LABELS[selectedInquiry.reason]?.label || selectedInquiry.reason}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Submitted At</span>
                <span className="text-slate-800">
                  {new Date(selectedInquiry.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Full Message */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {selectedInquiry.type === 'report' ? 'Reporter Explanation' : 'User Message / Description'}
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                {selectedInquiry.description}
              </div>
            </div>

            {/* Status & Admin Notes */}
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Update Status
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
                  {selectedInquiry.contactInfo.includes("@") ? (
                    <a
                      href={`mailto:${selectedInquiry.contactInfo}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Reply via Email</span>
                    </a>
                  ) : (
                    <a
                      href={`tel:${selectedInquiry.contactInfo}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call User</span>
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Moderation Notes / Actions Taken
                </label>
                <textarea
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Add notes about actions taken (e.g. contacted lister, updated details, deactivated listing)..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleDelete(selectedInquiry._id)}
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleSaveModal}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-primary text-white hover:bg-brand-primary/90 transition shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
