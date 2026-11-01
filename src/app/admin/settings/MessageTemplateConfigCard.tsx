'use client';

import React, { useState, useRef, useTransition } from 'react';
import {
  MessageSquare,
  Sparkles,
  Save,
  RotateCcw,
  Check,
  Info,
  Smartphone,
  Building2,
  Users,
} from 'lucide-react';
import {
  AVAILABLE_MESSAGE_PLACEHOLDERS,
  AVAILABLE_BULK_MESSAGE_PLACEHOLDERS,
  DEFAULT_APPROVAL_MESSAGE_TEMPLATE,
  DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE,
  formatPropertyApprovalMessage,
  formatBulkPropertyApprovalMessage,
} from '@/lib/propertyApprovalConfig';
import {
  updatePropertyApprovalMessageTemplateAction,
  updateBulkPropertyApprovalMessageTemplateAction,
} from './actions';

export default function MessageTemplateConfigCard({
  initialTemplate,
  initialBulkTemplate,
}: {
  initialTemplate: string;
  initialBulkTemplate?: string;
}) {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Property State
  const [template, setTemplate] = useState<string>(initialTemplate || DEFAULT_APPROVAL_MESSAGE_TEMPLATE);
  // Bulk Property State
  const [bulkTemplate, setBulkTemplate] = useState<string>(initialBulkTemplate || DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE);

  const [isPending, startTransition] = useTransition();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedPlaceholder, setCopiedPlaceholder] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentTemplate = activeTab === 'single' ? template : bulkTemplate;
  const setCurrentTemplate = activeTab === 'single' ? setTemplate : setBulkTemplate;
  const currentPlaceholders = activeTab === 'single' ? AVAILABLE_MESSAGE_PLACEHOLDERS : AVAILABLE_BULK_MESSAGE_PLACEHOLDERS;

  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setCurrentTemplate((prev) => prev + ' ' + placeholder);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = currentTemplate.substring(0, start);
    const after = currentTemplate.substring(end);

    const newText = before + placeholder + after;
    setCurrentTemplate(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);

    setCopiedPlaceholder(placeholder);
    setTimeout(() => setCopiedPlaceholder(null), 1500);
  };

  const handleResetDefault = () => {
    if (activeTab === 'single') {
      if (confirm('Reset the single property message format back to platform default?')) {
        setTemplate(DEFAULT_APPROVAL_MESSAGE_TEMPLATE);
        showToast('Reset to default single message format');
      }
    } else {
      if (confirm('Reset the bulk properties message format back to platform default?')) {
        setBulkTemplate(DEFAULT_BULK_APPROVAL_MESSAGE_TEMPLATE);
        showToast('Reset to default bulk message format');
      }
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      if (activeTab === 'single') {
        const res = await updatePropertyApprovalMessageTemplateAction(template);
        if (res?.error) {
          showToast(`Error: ${res.error}`);
        } else {
          showToast('Single property message format saved successfully!');
        }
      } else {
        const res = await updateBulkPropertyApprovalMessageTemplateAction(bulkTemplate);
        if (res?.error) {
          showToast(`Error: ${res.error}`);
        } else {
          showToast('Bulk property message format saved successfully!');
        }
      }
    });
  };

  // Sample data for real-time live preview
  const sampleFormattedMessage =
    activeTab === 'single'
      ? formatPropertyApprovalMessage(template, {
          ownerName: 'Rajesh Kumar',
          propertyTitle: 'Spacious 2BHK Near Tech Park',
          bhkConfig: '2BHK',
          localityName: 'Hinjewadi Phase 1',
          cityName: 'Pune',
          rentAmount: 28000,
          depositAmount: 60000,
          magicLink: 'https://flatnflatmates.com/approve-property/663a9b8f10b74c20',
          propertyId: '663a9b8f10b74c20',
        })
      : formatBulkPropertyApprovalMessage(bulkTemplate, {
          ownerName: 'Rajesh Kumar',
          propertyCount: 3,
          magicLink: 'https://flatnflatmates.com/approve-all-property/663a9b8f10b74c20',
          userId: '663a9b8f10b74c20',
        });

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-slate-700 animate-in slide-in-from-bottom-5">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center">
            <MessageSquare className="mr-2 h-4.5 w-4.5 text-brand-primary" />
            Verification Magic Link Message Templates
          </h3>
          <p className="text-xs text-slate-500">
            Configure the pre-formatted WhatsApp / SMS messages sent to owners for individual property approval or bulk multi-property approval.
          </p>
        </div>
        <span className="inline-flex items-center text-[11px] font-semibold bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full border border-violet-200 shrink-0 self-start sm:self-auto">
          <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-500" />
          Configurable Placeholders
        </span>
      </div>

      {/* Sub-Tabs: Single vs Bulk */}
      <div className="flex items-center gap-2 border-b pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('single')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'single'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Single Property Template (/approve-property/id)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'bulk'
              ? 'bg-brand-primary text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span>Bulk / All-Properties Template (/approve-all-property/USER_ID)</span>
        </button>
      </div>

      {/* Placeholder Buttons / Chips */}
      <div className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-500" />
            <span>
              {activeTab === 'single'
                ? 'Click to insert placeholder into single property message:'
                : 'Click to insert placeholder into bulk approval message:'}
            </span>
          </label>
          <span className="text-[10px] text-slate-400">Click a chip to place at cursor</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentPlaceholders.map((item) => {
            const isJustCopied = copiedPlaceholder === item.placeholder;
            return (
              <button
                key={item.placeholder}
                type="button"
                onClick={() => handleInsertPlaceholder(item.placeholder)}
                title={`${item.description} (e.g. ${item.sampleValue})`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium border transition ${
                  isJustCopied
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-brand-primary hover:text-brand-primary shadow-xs'
                }`}
              >
                {isJustCopied ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <span className="text-brand-primary text-[10px] font-bold">+</span>
                )}
                <span>{item.placeholder}</span>
                <span className="text-[10px] font-sans text-slate-400">({item.label})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor Form */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              {activeTab === 'single'
                ? 'Single Property Template Text'
                : 'Bulk / Multi-Property Template Text'}
            </label>
            <span className="text-[11px] text-slate-400 font-mono">
              {currentTemplate.length} characters
            </span>
          </div>

          <textarea
            ref={textareaRef}
            rows={9}
            value={currentTemplate}
            onChange={(e) => setCurrentTemplate(e.target.value)}
            className="w-full text-xs font-sans leading-relaxed border rounded-xl p-3.5 bg-white border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary shadow-xs"
            placeholder="Enter message template..."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleResetDefault}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition disabled:opacity-50"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset to Default</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="bg-brand-primary hover:bg-brand-primaryHover text-white rounded-xl px-5 py-2.5 text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-brand-primary/20 disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>
                    Save {activeTab === 'single' ? 'Single' : 'Bulk'} Message Format
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Preview Bubble */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="h-4 w-4 text-emerald-600" />
              <span>
                {activeTab === 'single' ? 'Single Review' : 'Bulk Review'} WhatsApp Preview
              </span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Sample Data
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-100 to-slate-200 p-4 shadow-inner">
            <div className="bg-emerald-800 text-white px-3 py-1.5 rounded-t-xl text-[11px] font-bold flex items-center justify-between">
              <span>FlatNFlatmates WhatsApp</span>
              <span className="text-[9px] text-emerald-200">Online</span>
            </div>

            <div className="bg-[#e5ddd5] p-3 rounded-b-xl min-h-[170px] space-y-2">
              <div className="bg-white rounded-lg p-3 shadow-xs text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-wrap border border-black/5 relative max-w-[95%]">
                {sampleFormattedMessage}
                <div className="text-[9px] text-slate-400 text-right mt-1.5">
                  Just now · Sent
                </div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Placeholders like{' '}
            <code className="text-[10px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-600">
              {activeTab === 'single' ? '{{magic_link}}' : '{{magic_link}} & {{property_count}}'}
            </code>{' '}
            will be substituted dynamically when admins copy from Pending Approvals (Property or User View).
          </p>
        </div>
      </div>
    </div>
  );
}
