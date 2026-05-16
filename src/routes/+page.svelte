<script lang="ts">
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { getAllSettings, getStreak, getSessions, getAttemptsByDate } from '$lib/db';
  import { Card, Button } from '$lib/components/ui';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import type { Session, AppSettings, Language } from '$lib/types';

  let greeting = $state('');
  let streak = $state(0);
  let lastSession = $state<Session | null>(null);
  let wordsToday = $state(0);
  let accuracyToday = $state(0);
  let settings = $state<AppSettings | null>(null);
  let loading = $state(true);

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'dashboard.welcome.morning';
    if (hour < 20) return 'dashboard.welcome.afternoon';
    return 'dashboard.welcome.evening';
  }

  async function loadData() {
    if (!browser) return;
    const s = await getAllSettings();
    settings = s;

    // Streak
    streak = await getStreak(s.language);

    // Last session
    const sessions = await getSessions(s.language, 1);
    lastSession = sessions.length > 0 ? sessions[0] : null;

    // Today's stats
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayAttempts = await getAttemptsByDate(dateStr, s.language);
    wordsToday = new Set(todayAttempts.map(a => a.word_id)).size;
    const correctToday = todayAttempts.filter(a => a.correct).length;
    accuracyToday = todayAttempts.length > 0
      ? Math.round((correctToday / todayAttempts.length) * 100)
      : 0;

    loading = false;
  }

  onMount(loadData);

  function formatAccuracy(acc: number): string {
    return typeof acc === 'number' ? `${Math.round(acc)}%` : '—';
  }

  function formatDate(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
</script>

<svelte:head>
  <title>{$t('app.name')}</title>
</svelte:head>

{#if loading}
  <div class="loading-container">
    <p class="loading-text">{$t('common.loading')}</p>
  </div>
{:else}
  <section class="dashboard">
    <!-- Greeting -->
    <header class="greeting-section">
      <h1 class="greeting">{$t(getGreeting())}</h1>
      <p class="tagline">{$t('app.tagline')}</p>
    </header>

    <!-- Daily streak -->
    <div class="streak-card">
      <Card>
        <div class="streak-content">
          <span class="fire-icon" aria-hidden="true">🔥</span>
          <div class="streak-info">
            <span class="streak-number">{streak}</span>
            <span class="streak-label">{$t('dashboard.days')}</span>
          </div>
        </div>
        <p class="streak-title">{$t('dashboard.daily_streak')}</p>
      </Card>
    </div>

    <!-- Today's stats -->
    <div class="stats-row">
      <Card>
        <div class="stat-item">
          <span class="stat-value">{wordsToday}</span>
          <span class="stat-label">{$t('dashboard.words_practiced')}</span>
        </div>
      </Card>
      <Card>
        <div class="stat-item">
          <span class="stat-value">{accuracyToday}%</span>
          <span class="stat-label">{$t('dashboard.accuracy')}</span>
        </div>
      </Card>
    </div>

    <!-- Today's Practice -->
    <section class="practice-section">
      <h2 class="section-title">{$t('dashboard.today_practice')}</h2>
      <Card>
        <div class="practice-actions">
          <Button variant="primary" fullWidth onclick={() => goto('/exercises')}>
            {$t('dashboard.quick_start')}
          </Button>
        </div>
      </Card>
    </section>

    <!-- Last session -->
    <section class="last-session-section">
      <h2 class="section-title">{$t('dashboard.last_session')}</h2>
      {#if lastSession}
        <Card>
          <div class="session-info">
            <div class="session-row">
              <span class="session-label">{$t('feedback.score')}</span>
              <span class="session-value">{formatAccuracy(lastSession.accuracy)}</span>
            </div>
            <div class="session-row">
              <span class="session-label">{$t('nav.exercises')}</span>
              <span class="session-value">{lastSession.exercises_completed}</span>
            </div>
            <div class="session-row">
              <span class="session-label">{lastSession.started_at ? formatDate(lastSession.started_at) : ''}</span>
            </div>
          </div>
        </Card>
      {:else}
        <Card>
          <p class="no-session">{$t('dashboard.no_sessions_yet')}</p>
          <Button variant="primary" fullWidth onclick={() => goto('/exercises')}>
            {$t('common.start')}
          </Button>
        </Card>
      {/if}
    </section>
  </section>
{/if}

<style>
  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
  }

  .loading-text {
    color: var(--text-dim);
    font-size: var(--font-size-lg);
  }

  .dashboard {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-xl);
  }

  .greeting-section {
    padding-top: var(--space-sm);
  }

  .greeting {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    color: var(--text);
    margin-bottom: var(--space-xs);
  }

  .tagline {
    color: var(--text-dim);
    font-size: var(--font-size-base);
  }

  /* Streak */
  .streak-content {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .fire-icon {
    font-size: 2.5rem;
    line-height: 1;
  }

  .streak-info {
    display: flex;
    align-items: baseline;
    gap: var(--space-xs);
  }

  .streak-number {
    font-size: var(--font-size-4xl);
    font-weight: 700;
    color: var(--warning);
  }

  .streak-label {
    font-size: var(--font-size-base);
    color: var(--text-dim);
  }

  .streak-title {
    margin-top: var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-sm);
  }

  .stat-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--primary);
  }

  .stat-label {
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

  /* Practice actions */
  .practice-actions {
    padding: var(--space-sm) 0;
  }

  /* Last session */
  .session-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .session-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .session-label {
    color: var(--text-dim);
    font-size: var(--font-size-base);
  }

  .session-value {
    font-weight: 600;
    color: var(--text);
    font-size: var(--font-size-lg);
  }

  .no-session {
    color: var(--text-dim);
    text-align: center;
    margin-bottom: var(--space-md);
    line-height: 1.5;
  }
</style>
