<script lang="ts">
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { Card, Button, Modal, ProgressBar } from '$lib/components/ui';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import {
    getAllSettings,
    getSessions,
    getStreakInfo
  } from '$lib/db';
  import {
    getWeeklySummary,
    getCategoryBreakdown,
    getExerciseBreakdown,
    calculateImprovementTrend
  } from '$lib/engine/statistics';
  import { getSRStats } from '$lib/engine/spaced-repetition';
  import { browser } from '$app/environment';
  import type { Language, Session, AppSettings } from '$lib/types';

  let loading = $state(true);
  let settings = $state<AppSettings | null>(null);
  let overallAccuracy = $state(0);
  let totalSessions = $state(0);
  let totalWords = $state(0);
  let categoryBreakdown = $state<{ category: string; accuracy: number; attempts: number }[]>([]);
  let exerciseBreakdown = $state<{ exercise: string; accuracy: number; attempts: number }[]>([]);
  let recentSessions = $state<Session[]>([]);
  let showClearModal = $state(false);

  // Word mastery from SR
  let wordsMastered = $state(0);
  let wordsInProgress = $state(0);
  let wordsNew = $state(0);

  // Streak
  let streakCurrent = $state(0);
  let streakLongest = $state(0);

  async function loadData() {
    if (!browser) return;
    const s = await getAllSettings();
    settings = s;

    // Weekly summary
    const weekly = await getWeeklySummary(s.language);
    overallAccuracy = weekly.overallAccuracy;
    totalSessions = weekly.totalSessions;
    totalWords = weekly.wordsPracticed;

    // Category breakdown
    categoryBreakdown = await getCategoryBreakdown(s.language);

    // Exercise breakdown
    exerciseBreakdown = await getExerciseBreakdown(s.language);

    // Recent sessions
    recentSessions = await getSessions(s.language, 10);

    // SR stats for word mastery
    const srStats = await getSRStats(s.language);
    wordsMastered = srStats.mastered;
    wordsInProgress = srStats.learning;
    wordsNew = srStats.new;

    // Streak
    const streakInfo = await getStreakInfo();
    streakCurrent = streakInfo.current;
    streakLongest = streakInfo.longest;

    loading = false;
  }

  onMount(loadData);

  function formatAccuracy(acc: number): string {
    return `${Math.round(acc)}%`;
  }

  function formatDate(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function accuracyColor(acc: number): string {
    if (acc >= 80) return 'var(--success)';
    if (acc >= 50) return 'var(--warning)';
    return 'var(--error)';
  }

  function getExerciseName(type: string): string {
    return `exercises.${type.replace(/-/g, '_')}.name`;
  }

  async function handleClearData() {
    if (!browser) return;
    const { db } = await import('$lib/db/database');
    await db.attempts.clear();
    await db.sessions.clear();
    await db.spacedRepetition.clear();
    showClearModal = false;
    await loadData();
  }

  async function handleExport() {
    if (!browser) return;
    const { db } = await import('$lib/db/database');
    const data = {
      attempts: await db.attempts.toArray(),
      sessions: await db.sessions.toArray(),
      spacedRepetition: await db.spacedRepetition.toArray(),
      settings: await db.settings.toArray(),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habla-anomia-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!browser) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const { db } = await import('$lib/db/database');
        if (data.attempts) await db.attempts.bulkAdd(data.attempts);
        if (data.sessions) await db.sessions.bulkAdd(data.sessions);
        if (data.spacedRepetition) await db.spacedRepetition.bulkAdd(data.spacedRepetition);
        if (data.settings) {
          for (const s of data.settings) {
            await db.settings.put(s);
          }
        }
        await loadData();
      } catch (e) {
        console.error('Import failed:', e);
      }
    };
    input.click();
  }
</script>

<svelte:head>
  <title>{$t('progress.title')} · {$t('app.name')}</title>
</svelte:head>

{#if loading}
  <div class="progress-page">
    <header class="page-header">
      <h1 class="page-title">{$t('progress.title')}</h1>
    </header>

    <!-- Skeleton loading for top stats -->
    <section class="top-stats">
      <div class="skeleton-card">
        <div class="skeleton-line number"></div>
        <div class="skeleton-line"></div>
      </div>
      <div class="skeleton-card">
        <div class="skeleton-line number"></div>
        <div class="skeleton-line"></div>
      </div>
    </section>

    <!-- Skeleton for counters -->
    <section class="counters-section">
      <div class="counters-row">
        {#each { length: 3 } as _}
          <div class="skeleton-card">
            <div class="skeleton-line number"></div>
            <div class="skeleton-line"></div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Skeleton for breakdown -->
    <section class="breakdown-section">
      <div class="skeleton-card">
        <div class="skeleton-line title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line" style="width: 60%"></div>
      </div>
    </section>
  </div>
{:else}
  <section class="progress-page fade-in">
    <header class="page-header">
      <h1 class="page-title">{$t('progress.title')}</h1>
    </header>

    {#if totalSessions === 0 && categoryBreakdown.length === 0}
      <Card>
        <div class="empty-state">
          <span class="empty-emoji">🎯</span>
          <h2 class="empty-title">{$t('progress.empty_title')}</h2>
          <p class="empty-message">{$t('progress.empty_message')}</p>
          <Button onclick={() => goto(`${base}/exercises`)}>
            {$t('common.start')}
          </Button>
        </div>
      </Card>
    {:else}
      <!-- Streak + Overall accuracy row -->
      <section class="top-stats">
        <Card>
          <div class="overall-content">
            <span class="overall-value" style="color: {accuracyColor(overallAccuracy)}">
              {formatAccuracy(overallAccuracy)}
            </span>
            <span class="overall-label">{$t('progress.overall_accuracy')}</span>
          </div>
        </Card>
        <Card>
          <div class="overall-content">
            <span class="streak-value">🔥 {streakCurrent}</span>
            <span class="overall-label">{$t('progress.current_streak')}</span>
            {#if streakLongest > 0}
              <span class="streak-record">🏆 {$t('progress.longest_streak')}: {streakLongest}</span>
            {/if}
          </div>
        </Card>
      </section>

      <!-- Word mastery counters -->
      <section class="counters-section">
        <div class="counters-row">
          <Card>
            <div class="counter-item">
              <span class="counter-value" style="color: var(--success)">{wordsMastered}</span>
              <span class="counter-label">{$t('progress.words_mastered')}</span>
            </div>
          </Card>
          <Card>
            <div class="counter-item">
              <span class="counter-value" style="color: var(--warning)">{wordsInProgress}</span>
              <span class="counter-label">{$t('progress.words_in_progress')}</span>
            </div>
          </Card>
          <Card>
            <div class="counter-item">
              <span class="counter-value" style="color: var(--primary)">{wordsNew}</span>
              <span class="counter-label">{$t('progress.new_words')}</span>
            </div>
          </Card>
        </div>
      </section>

      <!-- Breakdowns: side-by-side on landscape tablet -->
      <div class="breakdowns-row">
        <!-- Accuracy by category -->
        {#if categoryBreakdown.length > 0}
          <section class="breakdown-section">
            <h2 class="section-title">{$t('progress.by_category')}</h2>
            <Card>
              <div class="breakdown-list">
                {#each categoryBreakdown as item}
                  <div class="breakdown-item">
                    <div class="breakdown-header">
                      <span class="breakdown-name">{$t(`categories.${item.category}`) || item.category}</span>
                      <span class="breakdown-value" style="color: {accuracyColor(item.accuracy)}">
                        {formatAccuracy(item.accuracy)}
                      </span>
                    </div>
                    <div class="breakdown-bar-bg">
                      <div
                        class="breakdown-bar"
                        style="width: {item.accuracy}%; background: {accuracyColor(item.accuracy)}"
                      ></div>
                    </div>
                    <span class="breakdown-attempts">{item.attempts} {$t('progress.attempts').toLowerCase()}</span>
                  </div>
                {/each}
              </div>
            </Card>
          </section>
        {/if}

        <!-- Accuracy by exercise -->
        {#if exerciseBreakdown.length > 0}
          <section class="breakdown-section">
            <h2 class="section-title">{$t('progress.by_exercise')}</h2>
            <Card>
              <div class="breakdown-list">
                {#each exerciseBreakdown as item}
                  <div class="breakdown-item">
                    <div class="breakdown-header">
                      <span class="breakdown-name">{$t(getExerciseName(item.exercise))}</span>
                      <span class="breakdown-value" style="color: {accuracyColor(item.accuracy)}">
                        {formatAccuracy(item.accuracy)}
                      </span>
                    </div>
                    <div class="breakdown-bar-bg">
                      <div
                        class="breakdown-bar"
                        style="width: {item.accuracy}%; background: {accuracyColor(item.accuracy)}"
                      ></div>
                    </div>
                    <span class="breakdown-attempts">{item.attempts} {$t('progress.attempts').toLowerCase()}</span>
                  </div>
                {/each}
              </div>
            </Card>
          </section>
        {/if}
      </div>

      <!-- Session history -->
      {#if recentSessions.length > 0}
        <section class="history-section">
          <h2 class="section-title">{$t('progress.session_history')}</h2>
          <div class="history-list">
            {#each recentSessions as session}
              <Card>
                <div class="history-item">
                  <div class="history-info">
                    <span class="history-date">
                      {session.started_at ? formatDate(session.started_at) : ''}
                    </span>
                    <span class="history-exercises">
                      {#if session.exercise_types && session.exercise_types.length > 0}
                        {#each session.exercise_types as etype, i}
                          {#if i > 0}, {/if}
                          {$t(getExerciseName(etype))}
                        {/each}
                      {:else}
                        {session.exercises_completed} {$t('nav.exercises').toLowerCase()}
                      {/if}
                    </span>
                  </div>
                  <span class="history-accuracy" style="color: {accuracyColor(session.accuracy)}">
                    {formatAccuracy(session.accuracy)}
                  </span>
                </div>
              </Card>
            {/each}
          </div>
        </section>
      {/if}

    {/if}
  </section>
{/if}

{#if showClearModal}
  <Modal onclose={() => (showClearModal = false)}>
    <div class="modal-content">
      <p class="modal-text">{$t('progress.confirm_clear')}</p>
      <div class="modal-actions">
        <Button variant="secondary" onclick={() => (showClearModal = false)}>
          {$t('common.cancel')}
        </Button>
        <Button variant="danger" onclick={handleClearData}>
          {$t('progress.clear_data')}
        </Button>
      </div>
    </div>
  </Modal>
{/if}

<style>
  .progress-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-xl);
  }

  .page-header {
    margin-bottom: var(--space-sm);
  }

  .page-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
  }

  /* Encouraging empty state */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-md);
    padding: var(--space-xl) var(--space-lg);
  }

  .empty-emoji {
    font-size: 3rem;
  }

  .empty-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .empty-message {
    color: var(--text-dim);
    font-size: var(--font-size-base);
    line-height: 1.6;
    margin: 0;
  }

  /* Top stats row */
  .top-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .overall-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-lg) 0;
  }

  .overall-value {
    font-size: var(--font-size-4xl);
    font-weight: 700;
  }

  .overall-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .streak-value {
    font-size: var(--font-size-3xl);
    font-weight: 700;
  }

  .streak-record {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
  }

  /* Counters */
  .counters-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }

  .counter-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm);
  }

  .counter-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }

  .counter-label {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    text-align: center;
  }

  /* Section titles */
  .section-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
    margin-bottom: var(--space-sm);
  }

  /* Breakdown */
  .breakdown-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .breakdown-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .breakdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .breakdown-name {
    font-size: var(--font-size-base);
    color: var(--text);
    font-weight: 500;
    text-transform: capitalize;
  }

  .breakdown-value {
    font-weight: 600;
    font-size: var(--font-size-base);
  }

  .breakdown-bar-bg {
    height: 8px;
    background: var(--surface-3);
    border-radius: 4px;
    overflow: hidden;
  }

  .breakdown-bar {
    height: 100%;
    border-radius: 4px;
    transition: width var(--transition-slow);
  }

  .breakdown-attempts {
    font-size: var(--font-size-sm);
    color: var(--text-muted);
  }

  /* History */
  .history-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .history-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .history-date {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
  }

  .history-exercises {
    font-size: var(--font-size-base);
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-accuracy {
    font-size: var(--font-size-xl);
    font-weight: 700;
    flex-shrink: 0;
    margin-left: var(--space-sm);
  }

  /* Data section */
  /* Modal */
  .modal-content {
    text-align: center;
    padding: var(--space-lg);
  }

  .modal-text {
    font-size: var(--font-size-lg);
    color: var(--text);
    margin-bottom: var(--space-lg);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: center;
  }

  /* Responsive: on small phones make counters 2+1 */
  @media (max-width: 374px) {
    .counters-row {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  /* Tablet: bigger text */
  @media (min-width: 768px) {
    .page-title {
      font-size: var(--font-size-3xl);
    }

    .section-title {
      font-size: var(--font-size-2xl);
    }

    .overall-value {
      font-size: 3rem;
    }

    .streak-value {
      font-size: 2.5rem;
    }

    .overall-label {
      font-size: var(--font-size-lg);
    }

    .counter-value {
      font-size: var(--font-size-3xl);
    }

    .counter-label {
      font-size: var(--font-size-base);
    }

    .breakdown-bar-bg {
      height: 10px;
    }

    .breakdown-name {
      font-size: var(--font-size-lg);
    }

    .breakdown-value {
      font-size: var(--font-size-lg);
    }
  }

  /* Landscape tablet: side-by-side breakdowns */
  @media (min-width: 768px) and (orientation: landscape) {
    .top-stats {
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-md);
    }

    .counters-row {
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-md);
    }

    /* Side-by-side category + exercise breakdowns */
    .breakdowns-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-lg);
    }
  }
</style>
