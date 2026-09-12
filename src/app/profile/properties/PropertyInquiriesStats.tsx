'use client';

import React, { useState, useTransition } from 'react';
import { PhoneCall, Heart, X, Loader2, Phone, MessageCircle, Calendar, UserCheck, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { getPropertyInquiriesListAction } from './actions';
import { formatE164Phone, formatMsg91Phone } from '@/lib/phoneUtils';

interface InquiryItem {
  _id: string;
  userName: string;
  userPhone: string | null;
  smsStatus: string;
  attemptCount?: number;
  createdAt: string;
}

interface PropertyInquiriesStatsProps {
  propertyId: string;
  propertyTitle: string;
  callCount: number;
  interestCount: number;
  showInterestStats?: boolean;
}

export default function PropertyInquiriesStats({
  propertyId,
  propertyTitle,
  callCount,
  interestCount,
  showInterestStats = true,
}: PropertyInquiriesStatsProps) {
  const [activeModalType, setActiveModalType] = useState<'call' | 'sms_interested' | null>(null);
  const [inquiriesList, setInquiriesList] = useState<InquiryItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleOpenModal = (type: 'call' | 'sms_interested') => {
    setActiveModalType(type);
    setErrorMessage(null);
    setInquiriesList([]);

    startTransition(async () => {
      const res = await getPropertyInquiriesListAction(propertyId, type);
      if (res.success && res.inquiries) {
        setInquiriesList(res.inquiries);
      } else {
        setErrorMessage(res.error || "Failed to load inquiries");
      }
    });
  };

  const handleCloseModal = () => {
    setActiveModalType(null);
    setInquiriesList([]);
    setErrorMessage(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* 1. CALL INQUIRIES STAT BOX */}
      <button
        type="button"
        onClick={() => handleOpenModal('call')}
        className="flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all hover:bg-slate-100 group cursor-pointer focus:outline-hidden"
        title="Click to view list of users who tried calling"
      >
        <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-emerald-100 transition-colors">
          <PhoneCall className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="flex items-center space-x-1">
            <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Call Inquiries</span>
            <ArrowUpRight className="h-2.5 w-2.5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
          </div>
          <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">{callCount}</span>
        </div>
      </button>

      {/* 2. INTERESTS SHARED STAT BOX (Conditionally shown based on feature flag) */}
      {showInterestStats && (
        <button
          type="button"
          onClick={() => handleOpenModal('sms_interested')}
          className="flex items-center space-x-2.5 p-2 rounded-xl text-left transition-all hover:bg-slate-100 group cursor-pointer focus:outline-hidden"
          title="Click to view list of users who shared interest"
        >
          <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-100 transition-colors">
            <Heart className="h-4.5 w-4.5" />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">Interests Shared</span>
              <ArrowUpRight className="h-2.5 w-2.5 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <span className="text-sm font-bold text-slate-800 group-hover:text-rose-700 transition-colors">{interestCount}</span>
          </div>
        </button>
      )}

      {/* MODAL DIALOG */}
      {activeModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  activeModalType === 'call'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {activeModalType === 'call' ? (
                    <PhoneCall className="h-5 w-5" />
                  ) : (
                    <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeModalType === 'call' ? 'Call Inquiries' : 'Interested Seekers'}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-sm">
                    {propertyTitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
              {isPending ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-primary" />
                  <span className="text-xs">Loading inquiry history...</span>
                </div>
              ) : errorMessage ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
                  <ShieldAlert className="h-4 w-4 text-rose-600 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              ) : inquiriesList.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    {activeModalType === 'call' ? 'No Call Inquiries Yet' : 'No Interests Shared Yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    {activeModalType === 'call'
                      ? 'When seekers attempt to call for this property, their contact record will appear here.'
                      : 'When seekers click "Interested" on this flat, their details and SMS alerts will show up here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                    <span>Unique {activeModalType === 'call' ? 'Callers' : 'Seekers'}: {inquiriesList.length}</span>
                    <span>Sorted by latest</span>
                  </div>

                  {inquiriesList.map((inq) => {
                    const hasPhone = Boolean(inq.userPhone && inq.userPhone !== 'Number on profile');
                    const formattedE164 = inq.userPhone ? formatE164Phone(inq.userPhone) : '';
                    const formattedMsg91 = inq.userPhone ? formatMsg91Phone(inq.userPhone) : '';

                    return (
                      <div
                        key={inq._id}
                        className="bg-slate-50/80 border rounded-xl p-3.5 space-y-2 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-2.5">
                            <div className="h-8 w-8 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-xs font-bold text-brand-primary uppercase">
                              {inq.userName.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <h4 className="text-xs font-bold text-slate-800">{inq.userName}</h4>
                                {inq.attemptCount && inq.attemptCount > 1 && (
                                  <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-semibold" title={`Inquired ${inq.attemptCount} times`}>
                                    {inq.attemptCount}x
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                                <Calendar className="h-3 w-3 text-slate-300" />
                                <span>{formatDate(inq.createdAt)}</span>
                              </span>
                            </div>
                          </div>

                          {/* SMS status badge for interest inquiries */}
                          {activeModalType === 'sms_interested' && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                              inq.smsStatus === 'sent'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inq.smsStatus === 'mocked'
                                ? 'bg-sky-50 text-sky-700 border-sky-200'
                                : inq.smsStatus === 'skipped_feature_disabled'
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {inq.smsStatus === 'sent'
                                ? 'SMS Delivered'
                                : inq.smsStatus === 'mocked'
                                ? 'Mock SMS'
                                : inq.smsStatus === 'skipped_feature_disabled'
                                ? 'App Only'
                                : 'SMS Pending'}
                            </span>
                          )}
                        </div>

                        {/* Contact info & direct actions for owner */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 text-xs">
                          <span className="text-[11px] font-mono text-slate-600">
                            {inq.userPhone || "Phone not shared"}
                          </span>

                          {hasPhone && (
                            <div className="flex items-center space-x-1.5">
                              <a
                                href={`tel:${formattedE164}`}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold shadow-xs transition-colors"
                                title={`Call ${inq.userName}`}
                              >
                                <Phone className="h-3 w-3 text-emerald-400" />
                                <span>Call</span>
                              </a>
                              <a
                                href={`https://wa.me/${formattedMsg91}?text=${encodeURIComponent(
                                  `Hi ${inq.userName}, regarding your inquiry on my listing "${propertyTitle}" on FlatNFlatmates:`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-white text-[10px] font-bold shadow-xs transition-colors"
                                title={`WhatsApp ${inq.userName}`}
                              >
                                <MessageCircle className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t flex justify-end">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
