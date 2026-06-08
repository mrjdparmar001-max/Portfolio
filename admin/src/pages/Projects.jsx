import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects, createProject, updateProject, deleteProject, uploadImage } from '../api/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUpload, FiExternalLink, FiGithub } from 'react-icons/fi';

// FIX: Use env var properly — no hardcoded broken URL
const BASE = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

// FIX: Robust image URL resolver
function resolveImg(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:')) return url;
  return `${BASE}/${url.replace(/^\//, '')}`;
}

const empty = {
  title: '', description: '', techStack: '',
  liveUrl: '', githubUrl: '', image: '',
  category: 'Web', featured: false,
};

const inputStyle = {
  background: '#12121a',
  border: '1px solid #2a2a3e',
  borderRadius: 10,
  padding: '12px 14px',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default function Projects() {
  const [projects,   setProjects]   = useState([]);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(empty);
  const [loading,    setLoading]    = useState(false);
  const [imgFile,    setImgFile]    = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [imgError,   setImgError]   = useState({});

  const load = () =>
    getProjects()
      .then(r => setProjects(r.data))
      .catch(() => {});

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setForm(empty); setEditing(null);
    setImgFile(null); setImgPreview('');
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({ ...p, techStack: Array.isArray(p.techStack) ? p.techStack.join(', ') : (p.techStack || '') });
    setEditing(p._id);
    setImgFile(null);
    // FIX: use resolveImg so preview works for both relative and absolute URLs
    setImgPreview(p.image ? resolveImg(p.image) : '');
    setShowForm(true);
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    // FIX: createObjectURL gives an immediate local preview — no server round-trip needed
    setImgPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = form.image;

      if (imgFile) {
        setUploading(true);
        const res = await uploadImage(imgFile);
        // FIX: handle both { url } and { path } response shapes
        imageUrl = res.data.url || res.data.path || res.data.filename || '';
        setUploading(false);
      }

      const data = {
        ...form,
        image: imageUrl,
        techStack: form.techStack
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      if (editing) await updateProject(editing, data);
      else         await createProject(data);

      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
      alert('Error saving project. Check console for details.');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    await deleteProject(id);
    load();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Projects</h2>
          <p style={{ color: '#a0a0b0' }}>{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: '12px 24px', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FiPlus /> Add Project
        </motion.button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {projects.map((p, i) => {
          const imgSrc = p.image ? resolveImg(p.image) : '';
          const hasImgErr = imgError[p._id];

          return (
            <motion.div
              key={p._id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 16, overflow: 'hidden' }}
            >
              {/* Thumbnail */}
              <div style={{ height: 160, background: '#12121a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, position: 'relative', overflow: 'hidden' }}>
                {imgSrc && !hasImgErr ? (
                  <img
                    src={imgSrc}
                    alt={p.title}
                    onError={() => setImgError(prev => ({ ...prev, [p._id]: true }))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <span>💻</span>
                    {hasImgErr && <span style={{ fontSize: 11, color: '#ff6584' }}>Image failed to load</span>}
                  </div>
                )}
                {/* Live link shortcut */}
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noreferrer"
                    style={{ position: 'absolute', top: 10, right: 10, background: '#6c63ff', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, textDecoration: 'none' }}>
                    <FiExternalLink />
                  </a>
                )}
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {p.featured && <span style={{ background: '#6c63ff20', color: '#6c63ff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Featured</span>}
                    <span style={{ background: '#ffffff10', color: '#a0a0b0', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{p.category}</span>
                  </div>
                </div>

                <p style={{ color: '#a0a0b0', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                  {p.description?.length > 90 ? p.description.slice(0, 90) + '…' : p.description}
                </p>

                {/* Tech tags */}
                {p.techStack?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {(Array.isArray(p.techStack) ? p.techStack : []).slice(0, 4).map(t => (
                      <span key={t} style={{ background: '#2a2a3e', color: '#a0a0b0', borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button whileHover={{ scale: 1.07 }} onClick={() => openEdit(p)}
                    style={{ background: '#6c63ff20', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#6c63ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                    <FiEdit2 /> Edit
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.07 }} onClick={() => handleDelete(p._id)}
                    style={{ background: '#ff658420', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#ff6584', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600 }}>
                    <FiTrash2 /> Delete
                  </motion.button>
                  {p.githubUrl && (
                    <motion.a whileHover={{ scale: 1.07 }} href={p.githubUrl} target="_blank" rel="noreferrer"
                      style={{ background: '#ffffff10', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#a0a0b0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, textDecoration: 'none' }}>
                      <FiGithub />
                    </motion.a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Modal Form ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 40 }}
              style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 24, padding: '32px 36px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
                  {editing ? 'Edit Project' : 'Add New Project'}
                </h3>
                <motion.button whileHover={{ scale: 1.1 }} onClick={() => setShowForm(false)}
                  style={{ background: '#2a2a3e', border: 'none', borderRadius: 8, padding: 8, color: '#a0a0b0', cursor: 'pointer', fontSize: 18, display: 'flex' }}>
                  <FiX />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                <input required placeholder="Project Title *" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />

                <input placeholder="Live URL" value={form.liveUrl}
                  onChange={e => setForm({ ...form, liveUrl: e.target.value })} style={inputStyle} />

                <input placeholder="GitHub URL" value={form.githubUrl}
                  onChange={e => setForm({ ...form, githubUrl: e.target.value })} style={inputStyle} />

                <input placeholder="Tech Stack (comma separated, e.g. React, Node.js)" value={form.techStack}
                  onChange={e => setForm({ ...form, techStack: e.target.value })} style={inputStyle} />

                {/* ── Image Upload ─────────────────────────────────────────── */}
                <div>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>
                    Project Image
                  </label>

                  {/* FIX: Preview shown immediately from local blob URL */}
                  {imgPreview && (
                    <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', height: 180, background: '#12121a', position: 'relative' }}>
                      <img
                        src={imgPreview}
                        alt="preview"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                      <button type="button" onClick={() => { setImgPreview(''); setImgFile(null); setForm(f => ({ ...f, image: '' })); }}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                        <FiX />
                      </button>
                    </div>
                  )}

                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: '#12121a', border: '2px dashed #2a2a3e', borderRadius: 10, padding: '14px', color: '#a0a0b0', fontSize: 14, transition: 'border-color .2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a3e'}
                  >
                    <FiUpload style={{ color: '#6c63ff', fontSize: 20, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {imgFile ? imgFile.name : (imgPreview ? 'Change image' : 'Click to upload image')}
                    </span>
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
                  </label>

                  {/* FIX: or paste a direct image URL */}
                  <input
                    placeholder="…or paste an image URL directly"
                    value={imgFile ? '' : (form.image || '')}
                    disabled={!!imgFile}
                    onChange={e => {
                      const val = e.target.value;
                      setForm(f => ({ ...f, image: val }));
                      setImgPreview(val);
                    }}
                    style={{ ...inputStyle, marginTop: 8, opacity: imgFile ? 0.4 : 1 }}
                  />
                </div>

                <textarea required placeholder="Description *" rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }} />

                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inputStyle}>
                  {['Web', 'Mobile', 'Backend', 'UI/UX'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a0a0b0', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#6c63ff' }} />
                  Mark as Featured
                </label>

                <motion.button
                  type="submit" disabled={loading}
                  whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
                  style={{ background: 'linear-gradient(135deg,#6c63ff,#ff6584)', border: 'none', borderRadius: 12, padding: 14, color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, opacity: loading ? 0.7 : 1 }}
                >
                  <FiCheck />
                  {uploading ? 'Uploading image…' : loading ? 'Saving…' : editing ? 'Update Project' : 'Add Project'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
