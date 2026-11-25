import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle2,
  CloudRain,
  Construction,
  Droplets,
  HelpCircle,
  LightbulbOff,
  LocateFixed,
  MapPin,
  Trash2,
  Upload,
} from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import type { Complaint, IssueCategory } from '../types/complaint';
import { LeafletMap } from '../components/LeafletMap';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { CivicImage } from '../components/CivicImage';
import { DEMO_CITY } from '../lib/seedData';

const CATEGORY_CARDS: {
  id: IssueCategory;
  label: string;
  hint: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { id: 'Pothole', label: 'Pothole', hint: 'Road cavity or depression', icon: AlertTriangle },
  { id: 'Garbage Overflow', label: 'Garbage Overflow', hint: 'Overflowing bin or dumped waste', icon: Trash2 },
  { id: 'Water Leakage', label: 'Water Leakage', hint: 'Leaking pipe, valve, or main', icon: Droplets },
  { id: 'Damaged Road', label: 'Damaged Road', hint: 'Cracked or buckled pavement', icon: Construction },
  { id: 'Broken Streetlight', label: 'Broken Streetlight', hint: 'Unlit or damaged streetlamp', icon: LightbulbOff },
  { id: 'Drainage Problem', label: 'Drainage Problem', hint: 'Blocked grate or waterlogging', icon: CloudRain },
  { id: 'Other', label: 'Other', hint: 'Other public civic issue', icon: HelpCircle },
];

const QUICK_AREAS = [
  { area: 'Banjara Hills', address: 'Road No. 12, Banjara Hills, Hyderabad', lat: 17.4126, lng: 78.4398 },
  { area: 'Madhapur', address: 'Ayyappa Society Main Road, Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { area: 'Jubilee Hills', address: 'Road No. 36, Jubilee Hills, Hyderabad', lat: 17.4311, lng: 78.4071 },
  { area: 'Begumpet', address: 'Sardar Patel Road, Begumpet, Hyderabad', lat: 17.4445, lng: 78.4679 },
  { area: 'Gachibowli', address: 'Old Mumbai Highway, Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
];

const SAMPLE_PHOTOS: Record<IssueCategory, string> = {
  Pothole: '/demo-photos/pothole.svg',
  'Garbage Overflow': '/demo-photos/garbage.svg',
  'Water Leakage': '/demo-photos/water-leak.svg',
  'Damaged Road': '/demo-photos/damaged-road.svg',
  'Broken Streetlight': '/demo-photos/streetlight.svg',
  'Drainage Problem': '/demo-photos/drainage.svg',
  Other: '/demo-photos/damaged-road.svg',
};

export const ReportProblemPage: React.FC = () => {
  const { uploadImage, submitComplaint, pushToast, t } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [category, setCategory] = useState<IssueCategory | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Banjara Hills');
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: DEMO_CITY.center.lat,
    lng: DEMO_CITY.center.lng,
  });
  const [locationSource, setLocationSource] = useState<'manual' | 'map' | 'gps'>('manual');
  const [gpsStatus, setGpsStatus] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPhotoUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload photograph.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUseCurrentLocation = () => {
    setGpsStatus('');
    if (!('geolocation' in navigator)) {
      setGpsStatus('Browser location is not supported on this device. Please enter an address or tap the map.');
      return;
    }
    setGpsStatus('Requesting location permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(5));
        const lng = Number(position.coords.longitude.toFixed(5));
        setCoords({ lat, lng });
        setLocationSource('gps');
        if (!address.trim()) {
          setAddress(`Pinned GPS coordinates (${lat}, ${lng})`);
        }
        setGpsStatus('Current browser location captured.');
      },
      () => {
        setGpsStatus(
          'Location permission unavailable or denied. Please enter the street address manually or select a point on the map.'
        );
      },
      { timeout: 6000 }
    );
  };

  const handleMapPick = (picked: { lat: number; lng: number }) => {
    setCoords(picked);
    setLocationSource('map');
    if (!address.trim()) {
      setAddress(`Selected map point near ${area}, Hyderabad`);
    }
    setGpsStatus(`Map pin placed at ${picked.lat.toFixed(4)}, ${picked.lng.toFixed(4)}.`);
  };

  const goNext = () => {
    setFormError(null);
    if (step === 1 && !category) {
      setFormError('Please select a problem category to continue.');
      return;
    }
    if (step === 3 && !description.trim() && !photoUrl) {
      setFormError('Please describe the problem or go back and attach a photograph.');
      return;
    }
    if (step === 4 && !address.trim()) {
      setFormError('Please enter a street address or select a demo area below.');
      return;
    }
    if (step < 5) {
      setStep((step + 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const handleSubmit = async () => {
    if (!category) return;
    setFormError(null);
    setSubmitting(true);
    try {
      const created = await submitComplaint({
        category,
        description: description.trim(),
        photoUrl: photoUrl || undefined,
        location: {
          address: address.trim(),
          area: area.trim() || 'Hyderabad',
          lat: coords.lat,
          lng: coords.lng,
          source: locationSource,
        },
      });
      setSubmittedComplaint(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to submit report.';
      setFormError(message);
      pushToast('Submission error', message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedComplaint) {
    return (
      <AppShell
        breadcrumbs={[
          { label: t.nav.overview, to: '/dashboard' },
          { label: t.report.title },
        ]}
      >
        <div className="mx-auto max-w-4xl space-y-6">
          <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[#16A34A] dark:bg-emerald-950/60 dark:text-emerald-400">
                  <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold text-[#172033] sm:text-2xl dark:text-white">
                    Your report has been submitted successfully.
                  </h1>
                  <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                    Complaint ID:{' '}
                    <span className="font-mono font-semibold text-[#172033] dark:text-slate-100">
                      {submittedComplaint.id}
                    </span>{' '}
                    · Status: {submittedComplaint.status}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/complaints/${submittedComplaint.id}`)}
                  className="rounded-lg bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
                >
                  Track My Report
                </button>
                <Link
                  to="/dashboard"
                  className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-medium text-[#172033] transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 whitespace-nowrap"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </section>

          <AIAnalysisCard
            analysis={submittedComplaint.aiAnalysis}
            complaintStatus={submittedComplaint.status}
          />
        </div>
      </AppShell>
    );
  }

  const steps = [
    { num: 1, label: 'Category' },
    { num: 2, label: 'Photograph' },
    { num: 3, label: 'Description' },
    { num: 4, label: 'Location' },
    { num: 5, label: 'Review' },
  ];

  return (
    <AppShell
      breadcrumbs={[
        { label: t.nav.overview, to: '/dashboard' },
        { label: t.report.title },
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#172033] dark:text-white">
            {t.report.title}
          </h1>
          <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">{t.report.subtitle}</p>
        </div>

        {/* Step Progress Indicator */}
        <nav aria-label="Report form steps" className="grid grid-cols-5 gap-2">
          {steps.map((s) => {
            const active = s.num === step;
            const done = s.num < step;
            return (
              <button
                key={s.num}
                type="button"
                disabled={s.num > step}
                onClick={() => s.num < step && setStep(s.num as 1 | 2 | 3 | 4 | 5)}
                className={`rounded-lg border px-2.5 py-2 text-left transition-colors ${
                  active
                    ? 'border-[#4F46E5] bg-[#EEF2FF]/70 text-[#4F46E5] dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-300'
                    : done
                    ? 'border-[#E5E7EB] bg-white text-[#172033] hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
                    : 'border-[#E5E7EB] bg-[#F7F8FA] text-[#94A3B8] dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-500'
                }`}
              >
                <div className="font-mono text-[11px] font-medium tabular-nums">Step 0{s.num}</div>
                <div className="mt-0.5 truncate text-xs font-semibold">{s.label}</div>
              </button>
            );
          })}
        </nav>

        {/* Step Content Card */}
        <section className="rounded-xl border border-[#E5E7EB] bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-semibold text-[#172033] dark:text-white">
                {t.report.step1Title}
              </h2>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                Choose the category that best describes the issue.
              </p>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {CATEGORY_CARDS.map((item) => {
                  const Icon = item.icon;
                  const selected = category === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCategory(item.id);
                        setFormError(null);
                      }}
                      aria-pressed={selected}
                      className={`flex items-start gap-3.5 rounded-xl border p-4 text-left transition-colors ${
                        selected
                          ? 'border-[#4F46E5] bg-[#EEF2FF]/60 dark:border-indigo-500 dark:bg-indigo-950/40'
                          : 'border-[#E5E7EB] bg-white hover:border-slate-300 hover:bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? 'bg-[#4F46E5] text-white'
                            : 'bg-[#F1F5F9] text-[#475569] dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#172033] dark:text-white">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs text-[#64748B] dark:text-slate-400">
                          {item.hint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-semibold text-[#172033] dark:text-white">
                {t.report.step2Title}
              </h2>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                Upload a clear photo of the issue so reviewers and field officers can assess it faster. You may also skip this step for text-only reporting.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Upload problem photograph"
              />

              {photoUrl ? (
                <div className="mt-5 space-y-4">
                  <CivicImage
                    src={photoUrl}
                    alt={`Uploaded preview for ${category ?? 'reported issue'}`}
                    className="h-64 w-full"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Replace Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-xs font-medium text-[#DC2626] hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Remove Photo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#F7F8FA] px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-800/40">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-xs dark:bg-slate-800 dark:text-indigo-400">
                      <Camera className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#172033] dark:text-white">
                      {uploading ? 'Uploading photograph...' : 'Upload or capture a photograph'}
                    </p>
                    <p className="mt-1 text-xs text-[#64748B] dark:text-slate-400">
                      Accepts JPG, PNG, or WEBP up to 8 MB
                    </p>
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-4 py-2 text-xs font-medium text-white hover:bg-[#4338CA] disabled:opacity-50"
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Choose Image</span>
                      </button>
                      {category && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl(SAMPLE_PHOTOS[category])}
                          className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          Use Demo Sample Image
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadError && (
                    <p className="text-xs font-medium text-[#DC2626] dark:text-red-400" role="alert">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-[#172033] dark:text-white">
                {t.report.step3Title}
              </h2>
              <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                {photoUrl
                  ? 'Add helpful context such as nearby landmarks or safety impact (optional since a photo is attached).'
                  : 'Please describe the problem clearly so the maintenance team knows what to expect.'}
              </p>

              <div className="mt-5">
                <label
                  htmlFor="issue-description"
                  className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                >
                  Problem Description
                </label>
                <textarea
                  id="issue-description"
                  rows={5}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Describe the problem and how it affects the area..."
                  className="mt-2 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#172033] placeholder:text-[#94A3B8] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <p className="mt-2 text-xs text-[#64748B] dark:text-slate-400">
                  Tip: Mentioning nearby junctions, traffic impact, or duration helps prioritize urgent hazards.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#172033] dark:text-white">
                  {t.report.step4Title}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  Enter the address manually, request your browser location, or tap anywhere on the map to place a pin.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="location-address"
                    className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                  >
                    Street Address / Landmark
                  </label>
                  <input
                    id="location-address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setLocationSource('manual');
                      setFormError(null);
                    }}
                    placeholder="e.g. Road No. 12 Junction, Banjara Hills, Hyderabad"
                    className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="location-area"
                    className="block text-xs font-medium text-[#475569] dark:text-slate-300"
                  >
                    Neighborhood / Ward
                  </label>
                  <input
                    id="location-area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="e.g. Banjara Hills"
                    className="mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#172033] focus:border-[#4F46E5] focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#172033] hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <LocateFixed className="h-3.5 w-3.5 text-[#4F46E5]" aria-hidden="true" />
                  <span>Use Current Location</span>
                </button>
                <span className="text-xs text-[#64748B] dark:text-slate-400">or quick-fill demo area:</span>
                {QUICK_AREAS.map((preset) => (
                  <button
                    key={preset.area}
                    type="button"
                    onClick={() => {
                      setAddress(preset.address);
                      setArea(preset.area);
                      setCoords({ lat: preset.lat, lng: preset.lng });
                      setLocationSource('map');
                      setFormError(null);
                    }}
                    className="rounded-md border border-[#E5E7EB] bg-[#F7F8FA] px-2.5 py-1 text-xs font-medium text-[#475569] hover:border-[#4F46E5] hover:text-[#4F46E5] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {preset.area}
                  </button>
                ))}
              </div>

              {gpsStatus && (
                <p className="text-xs text-[#475569] dark:text-slate-300" role="status">
                  {gpsStatus}
                </p>
              )}

              <LeafletMap
                pickerMode
                pickedCoords={coords}
                onPickLocation={handleMapPick}
                heightClass="h-[280px]"
              />

              <div className="grid grid-cols-1 gap-3 rounded-lg bg-[#F7F8FA] p-3.5 text-xs sm:grid-cols-3 dark:bg-slate-800/60">
                <div>
                  <span className="text-[#64748B] dark:text-slate-400">Location Source</span>
                  <div className="mt-0.5 font-medium capitalize text-[#172033] dark:text-slate-100">
                    {locationSource === 'gps'
                      ? 'Browser Geolocation'
                      : locationSource === 'map'
                      ? 'Map Selection'
                      : 'Manual Entry'}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-slate-400">Latitude</span>
                  <div className="mt-0.5 font-mono font-medium text-[#172033] tabular-nums dark:text-slate-100">
                    {coords.lat.toFixed(5)}
                  </div>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-slate-400">Longitude</span>
                  <div className="mt-0.5 font-mono font-medium text-[#172033] tabular-nums dark:text-slate-100">
                    {coords.lng.toFixed(5)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-[#172033] dark:text-white">
                  {t.report.step5Title}
                </h2>
                <p className="mt-1 text-sm text-[#64748B] dark:text-slate-400">
                  Confirm the report details below. Automated triage will run immediately upon submission.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                      Category
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[#172033] dark:text-white">
                      {category}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                      Description
                    </div>
                    <div className="mt-1 text-sm leading-relaxed text-[#334155] dark:text-slate-300">
                      {description.trim() || 'Submitted via photograph without additional notes.'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                      Location
                    </div>
                    <div className="mt-1 flex items-start gap-1.5 text-sm text-[#172033] dark:text-slate-100">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#4F46E5]" aria-hidden="true" />
                      <div>
                        <div>{address}</div>
                        <div className="mt-0.5 font-mono text-xs text-[#64748B] tabular-nums dark:text-slate-400">
                          {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-medium text-[#64748B] dark:text-slate-400">
                    Photograph
                  </div>
                  <CivicImage
                    src={photoUrl || undefined}
                    alt={`Preview of ${category}`}
                    fallbackLabel="Text-only report (no photo)"
                    className="h-48 w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {formError && (
            <p
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-[#DC2626] dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400"
              role="alert"
            >
              {formError}
            </p>
          )}

          {/* Footer Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-[#E5E7EB] pt-5 dark:border-slate-800">
            <button
              type="button"
              disabled={step === 1 || submitting}
              onClick={() => {
                setFormError(null);
                setStep((step - 1) as 1 | 2 | 3 | 4 | 5);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-medium text-[#172033] transition-colors hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>{t.report.backBtn}</span>
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#4F46E5] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] whitespace-nowrap"
              >
                <span>{step === 2 && !photoUrl ? 'Skip & Continue' : t.report.nextBtn}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4F46E5] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA] disabled:opacity-50 whitespace-nowrap"
              >
                <span>{submitting ? 'Submitting & Analyzing...' : t.report.submitBtn}</span>
              </button>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
