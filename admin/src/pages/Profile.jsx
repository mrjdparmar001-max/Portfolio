import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiMail, FiPhone, FiMapPin, FiSave, FiUpload, FiFileText,
  FiExternalLink, FiCamera, FiGithub, FiLinkedin, FiTwitter,
  FiTrendingUp, FiSmile, FiAward, FiRefreshCw,
} from 'react-icons/fi';
import { getProfile, updateProfile, uploadResume, uploadAvatar } from '../api/api';

// ─── Try to import bg-removal; if it fails at runtime, we fall back gracefully
let removeBackground = null;
let bgRemovalAvailable = false;
try {
  const mod = await import('@imgly/background-removal').catch(() => null);
  if (mod && mod.removeBackground) {
    removeBackground = mod.removeBackground;
    bgRemovalAvailable = true;
    // Pre-warm model in background
    mod.preload?.({ model: 'small' }).catch(() => {});
  }
} catch (_) {
  bgRemovalAvailable = false;
}

const fields = [
  { key: 'email',    label: 'Email',    icon: <FiMail />,   type: 'email', placeholder: 'admin@example.com' },
  { key: 'phone',    label: 'Phone',    icon: <FiPhone />,  type: 'text',  placeholder: '+91 98765 43210' },
  { key: 'location', label: 'Location', icon: <FiMapPin />, type: 'text',  placeholder: 'City, Country' },
];

const BASE = import.meta.env.VITE_API_URL;

// ─── PNG Blob → WebP Blob ────────────────────────────────────────────────────
function pngBlobToWebP(pngBlob) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(pngBlob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(objectUrl);
      const testCanvas = document.createElement('canvas');
      testCanvas.width = testCanvas.height = 1;
      const supportsWebP = testCanvas.toDataURL('image/webp').startsWith('data:image/webp');
      canvas.toBlob(
        (blob) => blob
          ? resolve({ blob, mimeType: supportsWebP ? 'image/webp' : 'image/png' })
          : reject(new Error('Conversion failed')),
        supportsWebP ? 'image/webp' : 'image/png',
        0.88,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

// ─── Retry helper — retries fn up to `tries` times with exponential back-off ─
async function withRetry(fn, tries = 3, delayMs = 1200) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}

const DEFAULT_FORM = {
  email: '', phone: '', location: '',
  github: '', linkedin: '', twitter: '',
  yearsExperience: 0, expYears: 0, expMonths: 0, expDays: 0,
  happyClients: 0, awardsWon: 0,
};

export default function Profile() {
  const [form,           setForm]           = useState(DEFAULT_FORM);
  const [resume,         setResume]         = useState('');
  const [avatar,         setAvatar]         = useState('');
  const [avatarVersion,  setAvatarVersion]  = useState(Date.now());
  const [status,         setStatus]         = useState('');        // '' | 'success' | 'error'
  const [loading,        setLoading]        = useState(false);
  const [resumeUploading,setResumeUploading]= useState(false);
  const [resumeStatus,   setResumeStatus]   = useState('');
  const [avatarUploading,setAvatarUploading]= useState(false);
  const [avatarStatus,   setAvatarStatus]   = useState('');
  const [bgRemoving,     setBgRemoving]     = useState(false);
  const [bgProgress,     setBgProgress]     = useState(0);

  // ── First-load state ────────────────────────────────────────────────────────
  const [dataLoading,    setDataLoading]    = useState(true);  // true on first mount
  const [dataError,      setDataError]      = useState(false); // true if all retries failed
  const avatarInputRef = useRef();

  // ── Load profile with retry (fixes cold-start blank on first load) ──────────
  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) { setDataLoading(true); setDataError(false); }
    try {
      const r = await withRetry(() => getProfile(), 4, 1500);
      const d = r.data;
      setForm({
        email:          d.email          ?? '',
        phone:          d.phone          ?? '',
        location:       d.location       ?? '',
        github:         d.github         ?? '',
        linkedin:       d.linkedin       ?? '',
        twitter:        d.twitter        ?? '',
        yearsExperience:d.yearsExperience ?? 0,
        expYears:       d.expYears        ?? d.yearsExperience ?? 0,
        expMonths:      d.expMonths       ?? 0,
        expDays:        d.expDays         ?? 0,
        happyClients:   d.happyClients    ?? 0,
        awardsWon:      d.awardsWon       ?? 0,
      });
      setResume(d.resume ?? '');
      setAvatar(d.avatar ?? '');
      setAvatarVersion(Date.now());
      setDataError(false);
    } catch (e) {
      console.error('Profile load failed:', e);
      setDataError(true);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Re-load silently when tab becomes visible after being hidden (idle fix) ──
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadProfile(true);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadProfile]);

  // ── Save contact/social/stats ────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(form);
      setStatus('success');
    } catch {
      setStatus('error');
    }
    setLoading(false);
    setTimeout(() => setStatus(''), 4000);
  };

  // ── Resume upload — ensure correct MIME type to avoid "only PDF" error ───────
  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate on the client side first
    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setResumeStatus('notpdf');
      setTimeout(() => setResumeStatus(''), 4000);
      return;
    }

    setResumeUploading(true);
    setResumeStatus('');
    try {
      // Force correct MIME type regardless of what the OS detected
      const correctedFile = new File([file], file.name, { type: 'application/pdf' });
      const res = await withRetry(() => uploadResume(correctedFile), 3, 1000);
      setResume(res.data.url);
      setResumeStatus('success');
    } catch {
      setResumeStatus('error');
    }
    setResumeUploading(false);
    // Reset input so same file can be re-selected
    e.target.value = '';
    setTimeout(() => setResumeStatus(''), 4000);
  };

  // ── Avatar upload — with bg-removal when available, plain upload as fallback ─
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAvatarStatus('');

    try {
      let uploadFile = file;

      if (bgRemovalAvailable && removeBackground) {
        // ── Path A: remove background ─────────────────────────────────────
        setBgRemoving(true);
        setBgProgress(0);

        let bgRemovedBlob;
        try {
          bgRemovedBlob = await removeBackground(file, {
            model: 'small',
            output: { format: 'image/png', quality: 1 },
            progress: (key, current, total) => {
              if (total > 0) setBgProgress(Math.round((current / total) * 100));
            },
          });
        } catch (bgErr) {
          // BG removal failed — fall through to plain upload
          console.warn('BG removal failed, uploading original:', bgErr);
          bgRemovedBlob = null;
        }
        setBgRemoving(false);

        if (bgRemovedBlob) {
          const { blob: webpBlob, mimeType } = await pngBlobToWebP(bgRemovedBlob);
          const ext = mimeType === 'image/webp' ? '.webp' : '.png';
          uploadFile = new File(
            [webpBlob],
            file.name.replace(/\.[^.]+$/, ext),
            { type: mimeType },
          );
        }
        // else: uploadFile stays as original file
      }
      // ── Path B: no bg removal lib → upload original as-is ─────────────

      setAvatarUploading(true);
      const res = await withRetry(() => uploadAvatar(uploadFile), 3, 1000);
      setAvatar(res.data.url);
      setAvatarVersion(Date.now());
      setAvatarStatus('success');
    } catch (error) {
      console.error('Avatar upload failed:', error);
      setAvatarStatus('error');
    } finally {
      setBgRemoving(false);
      setAvatarUploading(false);
      setBgProgress(0);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
      setTimeout(() => setAvatarStatus(''), 4000);
    }
  };

  const avatarBusy = avatarUploading || bgRemoving;

  const avatarBtnLabel = bgRemoving
    ? `Removing background… ${bgProgress > 0 ? bgProgress + '%' : ''}`
    : avatarUploading
    ? 'Uploading…'
    : avatar
    ? 'Change Photo'
    : 'Upload Photo';

  // ── Full-page loading skeleton ───────────────────────────────────────────────
  if (dataLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16 }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <FiRefreshCw style={{ fontSize: 32, color: '#6c63ff' }} />
        </motion.div>
        <p style={{ color: '#a0a0b0', fontSize: 14 }}>Loading profile…</p>
      </div>
    );
  }

  // ── Error state with retry button ────────────────────────────────────────────
  if (dataError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 320, gap: 16 }}>
        <p style={{ color: '#ff6584', fontSize: 16 }}>⚠️ Failed to load profile. Server may be waking up.</p>
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => loadProfile()}
          style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '12px 28px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FiRefreshCw /> Retry
        </motion.button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Profile</h1>
        <p style={{ color: '#a0a0b0', marginBottom: 40 }}>
          Manage your profile photo, contact info and resume.
        </p>

        {/* ── Avatar Upload Card ──────────────────────────────────────────── */}
        <div style={{ maxWidth: 520, background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 20, padding: 36, marginBottom: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Profile Photo</h2>
          <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>
            This photo is shown on the user-facing portfolio hero section.
            {!bgRemovalAvailable && (
              <span style={{ color: '#ffb347', display: 'block', marginTop: 4 }}>
                ⚠️ Background removal unavailable — photo uploaded as-is.
              </span>
            )}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                border: '3px solid #6c63ff', background: '#0a0a0f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {avatar ? (
                  <img
                    key={`${avatar}-${avatarVersion}`}
                    src={`${BASE}${avatar}?v=${avatarVersion}`}
                    alt="Avatar"
                    loading="eager"
                    decoding="async"
                    width={100}
                    height={100}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <span style={{ fontSize: 36 }}>🧑‍💻</span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => avatarInputRef.current.click()}
                disabled={avatarBusy}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6c63ff,#ff6584)',
                  border: '2px solid #12121a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: avatarBusy ? 'not-allowed' : 'pointer',
                  color: '#fff', fontSize: 13,
                }}
              >
                <FiCamera />
              </motion.button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => avatarInputRef.current.click()}
                disabled={avatarBusy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'transparent', border: '1px dashed #6c63ff',
                  borderRadius: 12, padding: '12px 20px',
                  color: '#6c63ff', fontSize: 14, fontWeight: 600,
                  cursor: avatarBusy ? 'not-allowed' : 'pointer',
                  opacity: avatarBusy ? 0.6 : 1, width: '100%', justifyContent: 'center',
                }}
              >
                <FiUpload />
                {avatarBtnLabel}
              </motion.button>

              {bgRemoving && bgProgress > 0 && (
                <div style={{ marginTop: 8, background: '#0a0a0f', borderRadius: 6, overflow: 'hidden', height: 4 }}>
                  <div style={{
                    height: '100%', width: `${bgProgress}%`,
                    background: 'linear-gradient(90deg,#6c63ff,#ff6584)',
                    transition: 'width 0.3s ease', borderRadius: 6,
                  }} />
                </div>
              )}

              <p style={{ color: '#a0a0b0', fontSize: 12, marginTop: 8 }}>
                {bgRemovalAvailable
                  ? 'Any format (JPG, PNG, WebP, GIF…) — background removed & saved as WebP.'
                  : 'Any image format (JPG, PNG, WebP, GIF…).'}
              </p>
            </div>
          </div>

          {avatarStatus === 'success' && (
            <div style={{ marginTop: 16, background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>
              ✅ {bgRemovalAvailable ? 'Background removed & photo updated!' : 'Photo updated successfully!'}
            </div>
          )}
          {avatarStatus === 'error' && (
            <div style={{ marginTop: 16, background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
              ❌ Upload failed. Please try again (max 5MB).
            </div>
          )}
        </div>

        {/* ── Contact Info Card ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 520, background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 20, padding: 36, marginBottom: 32 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {fields.map(({ key, label, icon, type, placeholder }) => (
              <div key={key}>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}>{icon}</span> {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                />
              </div>
            ))}

            {status === 'success' && <div style={{ background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>✅ Profile updated successfully!</div>}
            {status === 'error'   && <div style={{ background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>❌ Failed to update. Try again.</div>}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </form>
        </div>

        {/* ── Social Links Card ───────────────────────────────────────────── */}
        <div style={{ maxWidth: 520, background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 20, padding: 36, marginBottom: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Social Links</h2>
          <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>These links power the icons in the Hero and Footer sections.</p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { key: 'github',   label: 'GitHub URL',      icon: <FiGithub />,   placeholder: 'https://github.com/yourusername' },
              { key: 'linkedin', label: 'LinkedIn URL',    icon: <FiLinkedin />, placeholder: 'https://linkedin.com/in/yourusername' },
              { key: 'twitter',  label: 'Twitter / X URL', icon: <FiTwitter />,  placeholder: 'https://twitter.com/yourusername' },
              { key: 'email',    label: 'Email',           icon: <FiMail />,     placeholder: 'you@example.com', type: 'email' },
            ].map(({ key, label, icon, placeholder, type = 'url' }) => (
              <div key={key}>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}>{icon}</span> {label}
                </label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={e => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                />
              </div>
            ))}
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiSave /> {loading ? 'Saving...' : 'Save Social Links'}
            </motion.button>
          </form>
        </div>

        {/* ── About Stats Card ────────────────────────────────────────────── */}
        <div style={{ maxWidth: 520, background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 20, padding: 36, marginBottom: 32 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>About Stats</h2>
          <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>These numbers appear in the About section stat cards on the user site.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 28 }}>
            {[
              {
                icon: <FiTrendingUp />, label: 'Experience',
                value: [
                  form.expYears  > 0 ? `${form.expYears}y`  : '',
                  form.expMonths > 0 ? `${form.expMonths}m` : '',
                  form.expDays   > 0 ? `${form.expDays}d`   : '',
                ].filter(Boolean).join(' ') || '0d',
                suffix: '+',
              },
              { icon: <FiSmile />, label: 'Happy Clients', value: form.happyClients, suffix: '+' },
              { icon: <FiAward />, label: 'Awards Won',    value: form.awardsWon,    suffix: '+' },
            ].map(({ icon, label, value, suffix }) => (
              <div key={label} style={{ background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 14, padding: '16px 8px', textAlign: 'center' }}>
                <div style={{ color: '#6c63ff', fontSize: 20, marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <div style={{ fontSize: 20, fontWeight: 900, background: 'linear-gradient(135deg,#6c63ff,#ff6584)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
                  {value}{suffix}
                </div>
                <div style={{ color: '#a0a0b0', fontSize: 11, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ color: '#6c63ff' }}><FiTrendingUp /></span> Experience
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { sub: 'Years',         k: 'expYears',  min: 0, max: 50 },
                  { sub: 'Months (0–11)', k: 'expMonths', min: 0, max: 11 },
                  { sub: 'Days (0–30)',   k: 'expDays',   min: 0, max: 30 },
                ].map(({ sub, k, min, max }) => (
                  <div key={k}>
                    <label style={{ color: '#a0a0b0', fontSize: 11, marginBottom: 6, display: 'block' }}>{sub}</label>
                    <input type="number" min={min} max={max} value={form[k]}
                      onChange={e => setForm(f => ({
                        ...f, [k]: Math.min(max, Number(e.target.value)),
                        ...(k === 'expYears' ? { yearsExperience: Number(e.target.value) } : {}),
                      }))}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                      onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                      onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                    />
                  </div>
                ))}
              </div>
              <p style={{ color: '#a0a0b0', fontSize: 11, marginTop: 6 }}>
                Preview: <strong style={{ color: '#6c63ff' }}>
                  {[
                    form.expYears  > 0 ? `${form.expYears} year${form.expYears !== 1 ? 's' : ''}`    : '',
                    form.expMonths > 0 ? `${form.expMonths} month${form.expMonths !== 1 ? 's' : ''}` : '',
                    form.expDays   > 0 ? `${form.expDays} day${form.expDays !== 1 ? 's' : ''}`       : '',
                  ].filter(Boolean).join(' ') || '0 days'}+
                </strong>
              </p>
            </div>

            {[
              { icon: <FiSmile />, label: 'Happy Clients', k: 'happyClients' },
              { icon: <FiAward />, label: 'Awards Won',    k: 'awardsWon'    },
            ].map(({ icon, label, k }) => (
              <div key={k}>
                <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ color: '#6c63ff' }}>{icon}</span> {label}
                </label>
                <input type="number" min={0} value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                  style={{ width: '100%', boxSizing: 'border-box', background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => (e.target.style.borderColor = '#6c63ff')}
                  onBlur={e => (e.target.style.borderColor = '#2a2a3e')}
                />
              </div>
            ))}

            {status === 'success' && <div style={{ background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>✅ Stats updated!</div>}
            {status === 'error'   && <div style={{ background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>❌ Failed to save.</div>}

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '14px', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <FiSave /> {loading ? 'Saving...' : 'Save Stats'}
            </motion.button>
          </form>
        </div>

        {/* ── Resume Upload Card ──────────────────────────────────────────── */}
        <div style={{ maxWidth: 520, background: '#12121a', border: '1px solid #2a2a3e', borderRadius: 20, padding: 36 }}>
          <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Resume / CV</h2>
          <p style={{ color: '#a0a0b0', fontSize: 13, marginBottom: 24 }}>Upload a PDF — users can download it directly from the Hero section.</p>

          {resume && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0a0a0f', border: '1px solid #2a2a3e', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
              <FiFileText style={{ color: '#6c63ff', fontSize: 22, flexShrink: 0 }} />
              <span style={{ color: '#fff', fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {resume.split('/').pop()}
              </span>
              <a href={`${BASE}${resume}`} target="_blank" rel="noreferrer"
                style={{ color: '#6c63ff', fontSize: 18, display: 'flex', alignItems: 'center' }}>
                <FiExternalLink />
              </a>
            </div>
          )}

          <label style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: resumeUploading ? 'not-allowed' : 'pointer',
            background: resumeUploading ? '#1a1a2e' : '#0a0a0f',
            border: '1px dashed #2a2a3e', borderRadius: 12,
            padding: '14px 16px', color: '#a0a0b0', fontSize: 14,
            opacity: resumeUploading ? 0.6 : 1,
          }}>
            <FiUpload style={{ color: '#6c63ff', fontSize: 18 }} />
            {resumeUploading ? 'Uploading...' : resume ? 'Replace PDF' : 'Upload PDF (max 10MB)'}
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleResumeUpload}
              disabled={resumeUploading}
              style={{ display: 'none' }}
            />
          </label>

          {resumeStatus === 'success' && (
            <div style={{ marginTop: 12, background: '#43e97b20', border: '1px solid #43e97b40', borderRadius: 10, padding: '10px 14px', color: '#43e97b', fontSize: 14 }}>
              ✅ Resume uploaded successfully!
            </div>
          )}
          {resumeStatus === 'notpdf' && (
            <div style={{ marginTop: 12, background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
              ❌ Please select a PDF file (.pdf only).
            </div>
          )}
          {resumeStatus === 'error' && (
            <div style={{ marginTop: 12, background: '#ff658420', border: '1px solid #ff658440', borderRadius: 10, padding: '10px 14px', color: '#ff6584', fontSize: 14 }}>
              ❌ Upload failed. Please try again.
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}
