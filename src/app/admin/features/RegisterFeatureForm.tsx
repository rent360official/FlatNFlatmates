'use client';

import React, { useState, useTransition } from 'react';
import { createManagedFeature } from './actions';
import { CODE_HANDLED_FEATURES, type CodeHandledFeature } from '@/lib/featureConstants';
import { Plus, Check, AlertCircle, Sparkles, Layers } from 'lucide-react';

interface RegisterFeatureFormProps {
  existingKeys: string[];
}

export default function RegisterFeatureForm({ existingKeys }: RegisterFeatureFormProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customKey, setCustomKey] = useState<string>('');
  const [label, setLabel] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<'disabled' | 'testing' | 'enabled'>('disabled');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFeatureSelect = (val: string) => {
    setSelectedOption(val);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (val === '__custom__') {
      setCustomKey('');
      setLabel('');
      setDescription('');
      return;
    }

    const matched = CODE_HANDLED_FEATURES.find((f) => f.key === val);
    if (matched) {
      setLabel(matched.label);
      setDescription(matched.description);
    } else {
      setLabel('');
      setDescription('');
    }
  };

  const activeFeatureKey = selectedOption === '__custom__' ? customKey.trim() : selectedOption;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!activeFeatureKey) {
      setErrorMessage('Please select or specify a Feature Key.');
      return;
    }

    if (!label.trim()) {
      setErrorMessage('Please provide a Display Name.');
      return;
    }

    const formData = new FormData();
    formData.append('key', activeFeatureKey);
    formData.append('label', label.trim());
    formData.append('description', description.trim());
    formData.append('status', status);

    startTransition(async () => {
      const res = await createManagedFeature(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setSuccessMessage(`Feature "${label}" successfully registered!`);
        setSelectedOption('');
        setCustomKey('');
        setLabel('');
        setDescription('');
        setStatus('disabled');
      }
    });
  };

  const selectedFeatureMeta = CODE_HANDLED_FEATURES.find((f) => f.key === selectedOption);

  return (
    <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4 sticky top-6">
      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
        <Plus className="h-4 w-4 text-brand-primary" />
        Register New Feature
      </h3>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-start space-x-2">
          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Feature Key Selector */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Feature Key <span className="text-red-400">*</span>
          </label>
          <select
            value={selectedOption}
            onChange={(e) => handleFeatureSelect(e.target.value)}
            required
            className="w-full text-xs font-medium border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary cursor-pointer text-slate-800"
          >
            <option value="" disabled>-- Select a code-handled feature --</option>
            <optgroup label="Integrated Code Features">
              {CODE_HANDLED_FEATURES.map((feat) => {
                const isAlreadyRegistered = existingKeys.includes(feat.key);
                return (
                  <option
                    key={feat.key}
                    value={feat.key}
                    disabled={isAlreadyRegistered}
                  >
                    {feat.label} ({feat.key}) {isAlreadyRegistered ? '— [Registered]' : ''}
                  </option>
                );
              })}
            </optgroup>
            <optgroup label="Other">
              <option value="__custom__">Enter custom feature key...</option>
            </optgroup>
          </select>
        </div>

        {/* Custom Key Input (if custom selected) */}
        {selectedOption === '__custom__' && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 animate-fadeIn">
            <label className="block text-[10px] font-bold text-slate-600 uppercase">
              Custom Key Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
              required
              placeholder="e.g. instant_chat_v2"
              className="w-full text-xs font-mono border rounded-lg px-3 py-2 bg-white outline-brand-primary"
            />
            <p className="text-[10px] text-slate-400">Use snake_case without spaces.</p>
          </div>
        )}

        {/* Selected Code Feature Info Pill */}
        {selectedFeatureMeta && (
          <div className="px-2.5 py-1.5 bg-brand-primary/5 border border-brand-primary/20 rounded-lg flex items-center justify-between text-[11px] text-brand-primary">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Module: {selectedFeatureMeta.module}
            </span>
            <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-brand-primary/20 font-mono">
              {selectedFeatureMeta.key}
            </code>
          </div>
        )}

        {/* Display Name */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Display Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            placeholder="e.g. Facebook Community CTA"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
          />
        </div>

        {/* Initial State */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Initial State
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary"
          >
            <option value="disabled">Disabled (safe default)</option>
            <option value="testing">Testing (super_admin, ops_admin, tester)</option>
            <option value="enabled">Enabled (all users)</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What feature does this toggle control?"
            className="w-full text-xs border rounded-lg px-3 py-2 bg-slate-50 outline-brand-primary resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending || !selectedOption}
          className="w-full bg-brand-primary hover:bg-brand-primaryHover disabled:opacity-50 text-white rounded-lg py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isPending ? (
            <span>Registering...</span>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              <span>Register Feature</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
