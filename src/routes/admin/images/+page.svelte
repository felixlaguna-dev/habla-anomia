<script lang="ts">
  import { WORDS_ES } from '$lib/data/words-es';
  import { onMount } from 'svelte';
  import { resolveImageUrl } from '$lib/utils/paths';
  import { getWordCategories, type Category } from '$lib/types';

  type WordLike = typeof WORDS_ES[number];

  let allWords = $state<WordLike[]>([...WORDS_ES]);
  let searchQuery = $state('');
  let categoryFilter = $state<Category | 'all'>('all');
  let showDetails = $state<Set<string>>(new Set());
  let imageStatus = $state<Record<string, 'ok' | 'missing' | 'loading'>>({});
  let onlyMissing = $state(false);
  let selected = $state<Set<string>>(new Set());
  let copyFeedback = $state('');

  // Get unique categories (flatten multi-category)
  let categories = $derived([...new Set(allWords.flatMap(w => getWordCategories(w)))].sort());

  // Filtered words
  let filtered = $derived(allWords.filter(w => {
    if (categoryFilter !== 'all' && !getWordCategories(w).includes(categoryFilter)) return false;
    if (onlyMissing && imageStatus[w.image_url] === 'ok') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.word.includes(q) || w.definition?.toLowerCase().includes(q) || w.id.includes(q);
    }
    return true;
  }));

  let selectedCount = $derived(selected.size);

  let stats = $derived({
    total: allWords.length,
    filtered: filtered.length,
    missing: Object.values(imageStatus).filter(s => s === 'missing').length,
    ok: Object.values(imageStatus).filter(s => s === 'ok').length,
    loading: Object.values(imageStatus).filter(s => s === 'loading').length,
  });

  // Check which images actually exist
  onMount(() => {
    for (const w of allWords) {
      imageStatus[w.image_url] = 'loading';
    }

    // Batch check images
    for (const w of allWords) {
      const img = new Image();
      img.onload = () => {
        imageStatus[w.image_url] = 'ok';
        imageStatus = { ...imageStatus }; // trigger reactivity
      };
      img.onerror = () => {
        imageStatus[w.image_url] = 'missing';
        imageStatus = { ...imageStatus };
      };
      img.src = resolveImageUrl(w.image_url);
    }
  });

  function toggleDetails(id: string) {
    const next = new Set(showDetails);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    showDetails = next;
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selected = next;
  }

  function selectAll() {
    const next = new Set<string>();
    for (const w of filtered) next.add(w.word);
    selected = next;
  }

  function selectNone() {
    selected = new Set();
  }

  function handleCheckboxClick(e: MouseEvent, word: string) {
    e.stopPropagation();
    toggleSelect(word);
  }

  function statusColor(status: string): string {
    if (status === 'ok') return 'var(--success)';
    if (status === 'missing') return 'var(--error)';
    return 'var(--warning)';
  }

  async function copySelected() {
    const names = [...selected].sort();
    const text = names.join(', ');
    try {
      await navigator.clipboard.writeText(text);
      copyFeedback = `Copied ${names.length} names!`;
    } catch {
      // Fallback for non-HTTPS
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyFeedback = `Copied ${names.length} names!`;
    }
    setTimeout(() => { copyFeedback = ''; }, 2000);
  }
</script>

<svelte:head>
  <title>📸 Image Review · Habla Anomia</title>
</svelte:head>

<div class="admin-page">
  <header class="admin-header">
    <h1>📸 Image Review</h1>
    <p class="subtitle">Secret admin page — check all word images & properties</p>
  </header>

  <!-- Stats bar -->
  <div class="stats-bar">
    <div class="stat"><span class="stat-num">{stats.total}</span> total</div>
    <div class="stat" style="color: var(--success)"><span class="stat-num">{stats.ok}</span> images OK</div>
    <div class="stat" style="color: var(--error)"><span class="stat-num">{stats.missing}</span> missing</div>
    <div class="stat" style="color: var(--warning)"><span class="stat-num">{stats.loading}</span> loading</div>
    <div class="stat"><span class="stat-num">{stats.filtered}</span> shown</div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <input
      type="text"
      placeholder="Search word, definition, id..."
      bind:value={searchQuery}
      class="search-input"
    />
    <select bind:value={categoryFilter} class="category-select">
      <option value="all">All categories ({allWords.length})</option>
      {#each categories as cat}
        <option value={cat}>{cat} ({allWords.filter(w => getWordCategories(w).includes(cat)).length})</option>
      {/each}
    </select>
    <label class="toggle-label">
      <input type="checkbox" bind:checked={onlyMissing} />
      Missing only
    </label>
  </div>

  <!-- Selection toolbar -->
  <div class="selection-bar">
    <div class="selection-info">
      <strong>{selectedCount}</strong> selected
    </div>
    <div class="selection-actions">
      <button class="sel-btn" onclick={selectAll}>Select all shown</button>
      <button class="sel-btn" onclick={selectNone}>Clear</button>
      <button
        class="sel-btn sel-btn-primary"
        onclick={copySelected}
        disabled={selectedCount === 0}
      >
        {copyFeedback || '📋 Copy names'}
      </button>
    </div>
  </div>

  <!-- Word grid -->
  <div class="word-grid">
    {#each filtered as word (word.id)}
      <div
        class="word-card"
        class:expanded={showDetails.has(word.id)}
        class:selected={selected.has(word.word)}
      >
        <div class="card-header">
          <!-- Checkbox overlay -->
          <button
            class="select-check"
            onclick={(e) => handleCheckboxClick(e, word.word)}
            role="checkbox"
            aria-checked={selected.has(word.word)}
          >
            <span class="checkmark">✓</span>
          </button>

          <div class="image-container" onclick={() => toggleDetails(word.id)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetails(word.id); } }}>
            <img
              src={resolveImageUrl(word.image_url)}
              alt={word.word}
              loading="lazy"
              class="word-image"
            />
            <span class="status-dot" style="background: {statusColor(imageStatus[word.image_url] || 'loading')}"></span>
          </div>
          <div class="card-info" onclick={() => toggleDetails(word.id)} role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleDetails(word.id); } }}>
            <span class="word-name">{word.word}</span>
            <span class="word-category">{getWordCategories(word).join(', ')}</span>
            <span class="word-difficulty">{'⭐'.repeat(word.difficulty)}</span>
          </div>
        </div>

        {#if showDetails.has(word.id)}
          <div class="card-details">
            <table>
              <tbody>
              <tr><th>ID</th><td>{word.id}</td></tr>
              <tr><th>Image URL</th><td><code>{word.image_url}</code></td></tr>
              <tr><th>Status</th><td style="color: {statusColor(imageStatus[word.image_url] || 'loading')}">{imageStatus[word.image_url] || 'unknown'}</td></tr>
              <tr><th>Definition</th><td>{word.definition}</td></tr>
              <tr><th>Difficulty</th><td>{word.difficulty} / 5</td></tr>
              <tr><th>Phonetic</th><td><code>{JSON.stringify(word.phonetic)}</code></td></tr>
              {#if word.features}
                <tr><th>Category</th><td>{word.features.category}</td></tr>
                <tr><th>Function</th><td>{word.features.function}</td></tr>
                <tr><th>Location</th><td>{word.features.location}</td></tr>
                <tr><th>Properties</th><td>{word.features.properties}</td></tr>
                <tr><th>Associations</th><td>{word.features.associations}</td></tr>
              {/if}
              <tr><th>Sentence</th><td>{word.sentence}</td></tr>
              {#if word.opposite}
                <tr><th>Opposite</th><td>{word.opposite}</td></tr>
              {/if}
              {#if word.synonyms?.length}
                <tr><th>Synonyms</th><td>{word.synonyms.join(', ')}</td></tr>
              {/if}
              <tr><th>Tags</th><td>{word.tags?.join(', ')}</td></tr>
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="empty-state">
      <p>No words match your filters.</p>
    </div>
  {/if}

  <!-- Sticky bottom bar when items selected -->
  {#if selectedCount > 0}
    <div class="sticky-bottom">
      <span>{selectedCount} selected</span>
      <button class="sel-btn sel-btn-primary" onclick={copySelected}>
        {copyFeedback || '📋 Copy names to clipboard'}
      </button>
      <button class="sel-btn" onclick={selectNone}>✕ Clear</button>
    </div>
  {/if}
</div>

<style>
  .admin-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 1rem 1rem 6rem;
  }

  .admin-header {
    margin-bottom: 1rem;
  }

  .admin-header h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .subtitle {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
  }

  .stats-bar {
    display: flex;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
    background: var(--surface-2);
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    color: var(--text-dim);
    flex-wrap: wrap;
  }

  .stat-num {
    font-weight: 700;
    color: var(--text);
  }

  .filters {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .search-input {
    flex: 1;
    min-width: 200px;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
  }

  .category-select {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.85rem;
    color: var(--text);
    cursor: pointer;
    white-space: nowrap;
  }

  /* Selection toolbar */
  .selection-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    padding: 0.5rem 0.75rem;
    background: var(--surface-2);
    border-radius: 8px;
    flex-wrap: wrap;
  }

  .selection-info {
    font-size: 0.85rem;
    color: var(--text);
  }

  .selection-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .sel-btn {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    color: var(--text);
    font-size: 0.8rem;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s;
  }

  .sel-btn:hover:not(:disabled) {
    background: var(--surface-2);
  }

  .sel-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .sel-btn-primary {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .sel-btn-primary:hover:not(:disabled) {
    background: var(--primary-hover);
  }

  /* Word grid */
  .word-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  @media (min-width: 768px) {
    .word-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
  }

  .word-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.15s, border-color 0.15s;
    position: relative;
  }

  .word-card:hover {
    box-shadow: var(--shadow-sm);
  }

  .word-card.selected {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent);
  }

  .word-card.expanded {
    grid-column: 1 / -1;
  }

  .card-header {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* Checkbox */
  .select-check {
    position: absolute;
    top: 6px;
    left: 6px;
    z-index: 10;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
  }

  .checkmark {
    width: 22px;
    height: 22px;
    border-radius: 4px;
    border: 2px solid rgba(255,255,255,0.8);
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, border-color 0.15s;
    backdrop-filter: blur(4px);
    color: transparent;
    font-size: 14px;
    font-weight: 700;
  }

  .select-check[aria-checked="true"] .checkmark {
    background: var(--primary);
    border-color: var(--primary);
    color: white;
  }

  .image-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: var(--surface-2);
    overflow: hidden;
    cursor: pointer;
  }

  .word-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid white;
  }

  .card-info {
    padding: 0.4rem 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    cursor: pointer;
  }

  .word-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--text);
  }

  .word-category {
    font-size: 0.7rem;
    color: var(--text-dim);
    text-transform: capitalize;
  }

  .word-difficulty {
    font-size: 0.6rem;
  }

  .card-details {
    padding: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .card-details table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  .card-details th {
    text-align: left;
    padding: 0.25rem 0.5rem 0.25rem 0;
    color: var(--text-dim);
    white-space: nowrap;
    vertical-align: top;
    font-weight: 500;
    width: 1%;
  }

  .card-details td {
    padding: 0.25rem 0;
    color: var(--text);
    word-break: break-word;
  }

  .card-details code {
    font-size: 0.75rem;
    background: var(--surface-2);
    padding: 0.15rem 0.3rem;
    border-radius: 3px;
    word-break: break-all;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: var(--text-dim);
  }

  /* Sticky bottom bar */
  .sticky-bottom {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding: 0.75rem 1rem 5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    z-index: 200;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
    font-size: 0.9rem;
  }
</style>
