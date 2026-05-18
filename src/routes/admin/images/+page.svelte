<script lang="ts">
  import { WORDS_ES } from '$lib/data/words-es';
  import { onMount } from 'svelte';
  import { resolveImageUrl } from '$lib/utils/paths';

  type WordLike = typeof WORDS_ES[number];

  let allWords = $state<WordLike[]>([...WORDS_ES]);
  let searchQuery = $state('');
  let categoryFilter = $state('all');
  let showDetails = $state<Set<string>>(new Set());
  let imageStatus = $state<Record<string, 'ok' | 'missing' | 'loading'>>({});
  let onlyMissing = $state(false);

  // Get unique categories
  let categories = $derived([...new Set(allWords.map(w => w.category))].sort());

  // Filtered words
  let filtered = $derived(allWords.filter(w => {
    if (categoryFilter !== 'all' && w.category !== categoryFilter) return false;
    if (onlyMissing && imageStatus[w.image_url] === 'ok') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return w.word.includes(q) || w.definition?.toLowerCase().includes(q) || w.id.includes(q);
    }
    return true;
  }));

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

  function statusColor(status: string): string {
    if (status === 'ok') return '#10b981';
    if (status === 'missing') return '#ef4444';
    return '#f59e0b';
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
    <div class="stat" style="color: #10b981"><span class="stat-num">{stats.ok}</span> images OK</div>
    <div class="stat" style="color: #ef4444"><span class="stat-num">{stats.missing}</span> missing</div>
    <div class="stat" style="color: #f59e0b"><span class="stat-num">{stats.loading}</span> loading</div>
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
        <option value={cat}>{cat} ({allWords.filter(w => w.category === cat).length})</option>
      {/each}
    </select>
    <label class="toggle-label">
      <input type="checkbox" bind:checked={onlyMissing} />
      Missing images only
    </label>
  </div>

  <!-- Word grid -->
  <div class="word-grid">
    {#each filtered as word (word.id)}
      <div class="word-card" class:expanded={showDetails.has(word.id)}>
        <div class="card-header" onclick={() => toggleDetails(word.id)} role="button" tabindex="0">
          <div class="image-container">
            <img
              src={resolveImageUrl(word.image_url)}
              alt={word.word}
              loading="lazy"
              class="word-image"
            />
            <span class="status-dot" style="background: {statusColor(imageStatus[word.image_url] || 'loading')}"></span>
          </div>
          <div class="card-info">
            <span class="word-name">{word.word}</span>
            <span class="word-category">{word.category}</span>
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
    margin-bottom: 1rem;
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
    transition: box-shadow 0.15s;
  }

  .word-card:hover {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .word-card.expanded {
    grid-column: 1 / -1;
  }

  .card-header {
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  .image-container {
    position: relative;
    width: 100%;
    aspect-ratio: 1;
    background: #f0f0f0;
    overflow: hidden;
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
</style>
