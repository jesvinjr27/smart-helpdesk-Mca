import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getArticlesApi,
  createArticleApi,
  getCategoriesApi,
  triggerKnowledgeIngestApi,
  getKnowledgeIngestStatusApi,
  searchKnowledgeApi,
} from '../../api';

export const KnowledgeBasePage = () => {
  const { hasRole } = useAuth();
  const canManageArticles = hasRole(['AGENT', 'LEAD', 'ORG_ADMIN', 'SYS_ADMIN']);

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);

  // Read Article Modal
  const [activeArticle, setActiveArticle] = useState(null);

  // New Article Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newCatId, setNewCatId] = useState('');
  const [newVisibility, setNewVisibility] = useState('PUBLIC');
  const [newTags, setNewTags] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);

  // Ingestion status
  const [ingesting, setIngesting] = useState(false);
  const [ingestMsg, setIngestMsg] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [artResp, catResp] = await Promise.all([
        getArticlesApi({ category_id: selectedCategory || undefined }),
        getCategoriesApi(),
      ]);
      setArticles(artResp.data);
      setCategories(catResp.data);
      if (catResp.data.length > 0 && !newCatId) {
        setNewCatId(catResp.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load KB data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const handleSemanticSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const resp = await searchKnowledgeApi({
        query: searchQuery,
        top_k: 4,
      });
      setSearchResults(resp.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCreateArticle = async (e) => {
    e.preventDefault();
    setSavingArticle(true);
    try {
      await createArticleApi({
        title: newTitle,
        content: newContent,
        summary: newSummary || undefined,
        category_id: newCatId,
        visibility: newVisibility,
        tags: newTags
          ? newTags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewContent('');
      setNewSummary('');
      setNewTags('');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create article');
    } finally {
      setSavingArticle(false);
    }
  };

  const handleTriggerIngest = async () => {
    setIngesting(true);
    setIngestMsg('Triggering background vector embedding...');
    try {
      const resp = await triggerKnowledgeIngestApi({ rebuild_index: true });
      const jobId = resp.data.job_id;

      // Poll status
      const interval = setInterval(async () => {
        try {
          const statusResp = await getKnowledgeIngestStatusApi(jobId);
          if (statusResp.data.status === 'COMPLETED') {
            clearInterval(interval);
            setIngesting(false);
            setIngestMsg(`Success: ${statusResp.data.message}`);
            setTimeout(() => setIngestMsg(''), 5000);
          } else if (statusResp.data.status === 'FAILED') {
            clearInterval(interval);
            setIngesting(false);
            setIngestMsg(`Failed: ${statusResp.data.message}`);
          }
        } catch (e) {
          clearInterval(interval);
          setIngesting(false);
        }
      }, 1000);
    } catch (err) {
      setIngesting(false);
      alert('Failed to trigger ingestion');
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h4 className="fw-bold mb-1">Knowledge Base & Verified Solutions</h4>
          <p className="text-muted text-sm mb-0">
            Browse verified technical troubleshooting articles and IT setup documentation.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {canManageArticles && (
            <>
              <button
                onClick={handleTriggerIngest}
                disabled={ingesting}
                className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                title="Embeds approved articles into FAISS vector index"
              >
                {ingesting ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="bi bi-arrow-repeat"></i>
                )}
                <span>Sync Vector Store</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Create Article</span>
              </button>
            </>
          )}
        </div>
      </div>

      {ingestMsg && (
        <div className="alert alert-info py-2 small d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-info-circle-fill"></i>
          <span>{ingestMsg}</span>
        </div>
      )}

      {/* Semantic Search Header */}
      <div className="card shadow-sm border-0 bg-primary text-white p-4 mb-4 rounded-4">
        <h5 className="fw-bold mb-2 text-center">Search Knowledge Base with Semantic AI</h5>
        <p className="text-center text-white-50 small mb-3">
          Our vector engine searches concepts, symptoms, and error codes across all verified articles.
        </p>
        <form onSubmit={handleSemanticSearch} className="mx-auto" style={{ maxWidth: '640px' }}>
          <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden bg-white">
            <span className="input-group-text bg-white border-0 ps-3">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0"
              placeholder="e.g. How to connect to Eduroam Wi-Fi or reset password..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-dark px-4 fw-medium">
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Semantic Search Results (if triggered) */}
      {searchResults && (
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h6 className="fw-bold mb-0 text-primary">
              <i className="bi bi-stars me-1"></i>Semantic AI Results ({searchResults.length})
            </h6>
            <button
              onClick={() => setSearchResults(null)}
              className="btn btn-sm btn-link text-decoration-none"
            >
              Clear Search
            </button>
          </div>
          <div className="row g-3">
            {searchResults.length === 0 ? (
              <div className="col-12">
                <div className="card p-3 text-center text-muted">
                  No matching chunks found above similarity threshold.
                </div>
              </div>
            ) : (
              searchResults.map((sr) => (
                <div key={sr.chunk_id} className="col-md-6">
                  <div className="card h-100 shadow-sm border-primary border-opacity-25 p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-primary text-white text-xs">
                        Match Score: {Math.round(sr.similarity_score * 100)}%
                      </span>
                      <span className="badge bg-light text-muted border text-xs">
                        {sr.visibility}
                      </span>
                    </div>
                    <h6 className="fw-bold mb-1 text-dark">{sr.article_title}</h6>
                    <p className="text-xs text-secondary mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                      {sr.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Category Pills Filter */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('')}
          className={`btn btn-sm rounded-pill px-3 ${
            selectedCategory === '' ? 'btn-primary' : 'btn-outline-secondary'
          }`}
        >
          All Categories
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`btn btn-sm rounded-pill px-3 ${
              selectedCategory === c.id ? 'btn-primary' : 'btn-outline-secondary'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : articles.length === 0 ? (
        <div className="card p-5 text-center text-muted shadow-sm">
          <i className="bi bi-journal-x fs-1 text-secondary d-block mb-2"></i>
          No knowledge articles found in this category.
        </div>
      ) : (
        <div className="row g-4">
          {articles.map((art) => (
            <div key={art.id} className="col-md-6 col-lg-4">
              <div
                className="card h-100 shadow-sm cursor-pointer hover-shadow transition"
                onClick={() => setActiveArticle(art)}
              >
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-dark border text-xs">
                      {art.category_name || 'General'}
                    </span>
                    <span className="text-xs text-muted">
                      <i className="bi bi-eye me-1"></i>
                      {art.view_count} views
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark mb-2">{art.title}</h6>
                  <p className="text-xs text-secondary flex-grow-1 line-clamp-3 mb-3">
                    {art.summary || art.content.slice(0, 120) + '...'}
                  </p>
                  <div className="d-flex flex-wrap gap-1">
                    {art.tags?.slice(0, 3).map((tg, i) => (
                      <span key={i} className="badge bg-secondary-subtle text-secondary text-xs">
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Read Article Modal */}
      {activeArticle && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <div>
                  <span className="badge bg-primary-subtle text-primary text-xs mb-1">
                    {activeArticle.category_name || 'General'}
                  </span>
                  <h5 className="modal-title fw-bold">{activeArticle.title}</h5>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setActiveArticle(null)}
                ></button>
              </div>
              <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
                <div className="text-sm text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                  {activeArticle.content}
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveArticle(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom py-3">
                <h5 className="modal-title fw-bold">Create Knowledge Article</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateArticle}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Article Title</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. How to configure GlobalProtect VPN"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <label className="form-label text-sm fw-semibold">Category</label>
                      <select
                        required
                        className="form-select"
                        value={newCatId}
                        onChange={(e) => setNewCatId(e.target.value)}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-sm-6">
                      <label className="form-label text-sm fw-semibold">Visibility</label>
                      <select
                        className="form-select"
                        value={newVisibility}
                        onChange={(e) => setNewVisibility(e.target.value)}
                      >
                        <option value="PUBLIC">Public (Visible to all users & students)</option>
                        <option value="INTERNAL">Internal (Only agents & leads)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Brief Summary</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="One-sentence description for search preview"
                      value={newSummary}
                      onChange={(e) => setNewSummary(e.target.value)}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">
                      Article Content (Markdown supported)
                    </label>
                    <textarea
                      rows={8}
                      required
                      className="form-control"
                      placeholder="### Prerequisites&#10;1. Step one...&#10;2. Step two..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-2">
                    <label className="form-label text-sm fw-semibold">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="vpn, security, network"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={savingArticle} className="btn btn-primary">
                    {savingArticle ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
