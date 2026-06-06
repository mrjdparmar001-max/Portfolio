import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProjects, createProject, updateProject, deleteProject, uploadImage } from '../api/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiUpload } from 'react-icons/fi';

const BASE = 'http://https://portfolio-w9xn.onrender.com';
const empty = { title: '', description: '', techStack: '', liveUrl: '', githubUrl: '', image: '', category: 'Web', featured: false };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => getProjects().then(r => setProjects(r.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(empty); setEditing(null); setImgFile(null); setImgPreview(''); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ ...p, techStack: p.techStack?.join(', ') || '' });
    setEditing(p._id);
    setImgFile(null);
    setImgPreview(p.image ? (p.image.startsWith('http') ? p.image : BASE + p.image) : '');
    setShowForm(true);
  };

  const handleImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
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
        imageUrl = res.data.url;
        setUploading(false);
      }
      const data = { ...form, image: imageUrl, techStack: form.techStack.split(',').map(s => s.trim()).filter(Boolean) };
      if (editing) await updateProject(editing, data);
      else await createProject(data);
      setShowForm(false);
      load();
    } catch {
      alert('Error saving project');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    await deleteProject(id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Projects</h2>
          <p style={{ color: '#a0a0b0' }}>{projects.length} projects total</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openAdd}
          style={{
            background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
            border: 'none', borderRadius: 12, padding: '12px 24px',
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          <FiPlus /> Add Project
        </motion.button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {projects.map((p, i) => (
          <motion.div
            key={p._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: '#1a1a2e', border: '1px solid #2a2a3e',
              borderRadius: 16, overflow: 'hidden',
            }}
          >
            <div style={{ height: 140, background: '#12121a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              {p.image
                ? <img src={p.image.startsWith('http') ? p.image : BASE + p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : '💻'}
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{p.title}</h3>
                {p.featured && <span style={{ background: '#6c63ff20', color: '#6c63ff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Featured</span>}
              </div>
              <p style={{ color: '#a0a0b0', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>{p.description?.slice(0, 80)}...</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => openEdit(p)}
                  style={{ background: '#6c63ff20', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#6c63ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
                >
                  <FiEdit2 /> Edit
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => handleDelete(p._id)}
                  style={{ background: '#ff658420', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#ff6584', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}
                >
                  <FiTrash2 /> Delete
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000, padding: 20,
            }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 40 }}
              style={{
                background: '#1a1a2e', border: '1px solid #2a2a3e',
                borderRadius: 24, padding: 40, width: '100%', maxWidth: 560,
                maxHeight: '90vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>
                  {editing ? 'Edit Project' : 'Add New Project'}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowForm(false)}
                  style={{ background: '#2a2a3e', border: 'none', borderRadius: 8, padding: 8, color: '#a0a0b0', cursor: 'pointer', fontSize: 18 }}
                >
                  <FiX />
                </motion.button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'title', placeholder: 'Project Title', required: true },
                  { key: 'liveUrl', placeholder: 'Live URL' },
                  { key: 'githubUrl', placeholder: 'GitHub URL' },
                  { key: 'techStack', placeholder: 'Tech Stack (comma separated)' },
                ].map(({ key, placeholder, required }) => (
                  <input
                    key={key}
                    required={required}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={inputStyle}
                  />
                ))}

                {/* Image Upload */}
                <div>
                  <label style={{ color: '#a0a0b0', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Project Image</label>
                  {imgPreview && (
                    <div style={{ marginBottom: 10, borderRadius: 10, overflow: 'hidden', height: 160, background: '#12121a' }}>
                      <img src={imgPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    background: '#12121a', border: '1px dashed #2a2a3e', borderRadius: 10,
                    padding: '12px 14px', color: '#a0a0b0', fontSize: 14,
                  }}>
                    <FiUpload style={{ color: '#6c63ff', fontSize: 18 }} />
                    {imgFile ? imgFile.name : 'Click to upload image'}
                    <input type="file" accept="image/*" onChange={handleImgChange} style={{ display: 'none' }} />
                  </label>
                </div>
                <textarea
                  required
                  placeholder="Description"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  style={inputStyle}
                >
                  {['Web', 'Mobile', 'Backend', 'UI/UX'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#a0a0b0', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={e => setForm({ ...form, featured: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#6c63ff' }}
                  />
                  Mark as Featured
                </label>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    background: 'linear-gradient(135deg, #6c63ff, #ff6584)',
                    border: 'none', borderRadius: 12, padding: '14px',
                    color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 8,
                  }}
                >
                  <FiCheck /> {uploading ? 'Uploading...' : loading ? 'Saving...' : editing ? 'Update Project' : 'Add Project'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputStyle = {
  background: '#12121a', border: '1px solid #2a2a3e',
  borderRadius: 10, padding: '12px 14px',
  color: '#fff', fontSize: 14, outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};
