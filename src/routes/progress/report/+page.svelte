<script lang="ts">
  import { t, locale } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { Button, AccuracyChart } from '$lib/components/ui';
  import { getAllSettings, getStreakInfo, getAccuracyOverTime } from '$lib/db';
  import { getDistinctWordsPracticed } from '$lib/db/attempts';
  import { getSummary, getCategoryBreakdown, getExerciseBreakdown } from '$lib/engine/statistics';
  import { getSRStats } from '$lib/engine/spaced-repetition';
  import { browser } from '$app/environment';
  import type { AppSettings } from '$lib/types';
  import {
    formatAccuracy,
    accuracyColor,
    formatDate,
    getExerciseName
  } from '$lib/utils/progress-helpers';

  // 30-day window for the summary section.
  // To extend beyond 30 days, change REPORT_DAYS here and adjust the
  // date-range label in the i18n key (report_date_range / report_summary).
  const REPORT_DAYS = 30;

  let loading = $state(true);
  let settings = $state<AppSettings | null>(null);

  // 30-day summary
  let totalSessions = $state(0);
  let distinctWords = $state(0);
  let overallAccuracy = $state(0);
  let streakCurrent = $state(0);

  // 14-day chart
  let accuracyOverTime = $state<Array<{ date: string; accuracy: number; correct: number; total: number }>>([]);

  // Breakdowns
  let categoryBreakdown = $state<{ category: string; accuracy: number; attempts: number }[]>([]);
  let exerciseBreakdown = $state<{ exercise: string; accuracy: number; attempts: number }[]>([]);

  // Word mastery
  let wordsMastered = $state(0);
  let wordsInProgress = $state(0);
  let wordsNew = $state(0);

  let hasData = $derived(totalSessions > 0 || categoryBreakdown.length > 0 || exerciseBreakdown.length > 0);

  async function loadData() {
    if (!browser) return;
    const s = await getAllSettings();
    settings = s;

    // All queries are independent — run them concurrently
    const [summary, distinct, accuracy, catBrk, exBrk, srStats, streakInfo] = await Promise.all([
      getSummary(s.language, REPORT_DAYS),
      getDistinctWordsPracticed(REPORT_DAYS, s.language),
      getAccuracyOverTime(14, s.language),
      getCategoryBreakdown(s.language),
      getExerciseBreakdown(s.language),
      getSRStats(s.language),
      getStreakInfo()
    ]);

    totalSessions = summary.totalSessions;
    overallAccuracy = summary.overallAccuracy;
    distinctWords = distinct;
    accuracyOverTime = accuracy;

    // Category breakdown: weakest first (therapists act on problem areas)
    categoryBreakdown = catBrk.slice().sort((a, b) => a.accuracy - b.accuracy);
    exerciseBreakdown = exBrk;

    wordsMastered = srStats.mastered;
    wordsInProgress = srStats.learning;
    wordsNew = srStats.new;

    streakCurrent = streakInfo.current;

    loading = false;
  }

  onMount(loadData);

  function reportStartDate(): Date {
    const d = new Date();
    d.setDate(d.getDate() - REPORT_DAYS + 1);
    return d;
  }
</script>

<svelte:head>
  <title>{$t('progress.report_title')} · {$t('app.name')}</title>
</svelte:head>

<section class="report-page">
  <!-- Toolbar (screen only) -->
  <div class="report-toolbar no-print">
    <Button variant="secondary" onclick={() => goto(`${base}/progress`)}>
      ← {$t('progress.report_back')}
    </Button>
    {#if !loading && hasData}
      <Button onclick={() => window.print()}>
        🖨️ {$t('progress.report_print')}
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="report-header">
      <div class="skeleton" style="width: 60%; height: 2rem;" aria-hidden="true"></div>
      <div class="skeleton" style="width: 40%; height: 1rem;" aria-hidden="true"></div>
    </div>
    <div class="skeleton" style="width: 90%; height: 6rem;" aria-hidden="true"></div>
  {:else if !hasData}
    <div class="report-empty">
      <span class="report-empty-icon">📋</span>
      <p>{$t('progress.report_empty')}</p>
      <Button onclick={() => goto(`${base}/exercises`)}>
        {$t('common.start')}
      </Button>
    </div>
  {:else}
    <!-- Header -->
    <header class="report-header">
      <h1 class="report-app-name">{$t('app.name')}</h1>
      <h2 class="report-doc-title">{$t('progress.report_title')}</h2>
      <p class="report-date-range">
        {$t('progress.report_date_range', {
          start: formatDate(reportStartDate(), $locale, true),
          end: formatDate(new Date(), $locale, true)
        })}
      </p>
    </header>

    <!-- 30-day summary -->
    <section class="report-section">
      <h3 class="report-section-title">{$t('progress.report_summary')}</h3>
      <div class="summary-grid">
        <div class="summary-cell">
          <span class="summary-value">{totalSessions}</span>
          <span class="summary-label">{$t('progress.report_sessions')}</span>
        </div>
        <div class="summary-cell">
          <span class="summary-value">{distinctWords}</span>
          <span class="summary-label">{$t('progress.report_words_practiced')}</span>
        </div>
        <div class="summary-cell">
          <span class="summary-value" style="color: {accuracyColor(overallAccuracy)}">
            {formatAccuracy(overallAccuracy)}
          </span>
          <span class="summary-label">{$t('progress.report_accuracy')}</span>
        </div>
        <div class="summary-cell">
          <span class="summary-value">🔥 {streakCurrent}</span>
          <span class="summary-label">{$t('progress.report_streak')}</span>
        </div>
      </div>
    </section>

    <!-- 14-day accuracy chart -->
    {#if accuracyOverTime.some(d => d.total > 0)}
      <section class="report-section">
        <AccuracyChart data={accuracyOverTime} locale={$locale} printable />
      </section>
    {/if}

    <!-- Accuracy by exercise -->
    {#if exerciseBreakdown.length > 0}
      <section class="report-section report-table-section">
        <h3 class="report-section-title">{$t('progress.report_by_exercise')}</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>{$t('progress.report_exercise_header')}</th>
              <th class="num-col">{$t('progress.report_accuracy_header')}</th>
              <th class="num-col">{$t('progress.report_attempts_header')}</th>
            </tr>
          </thead>
          <tbody>
            {#each exerciseBreakdown as item}
              <tr>
                <td>{$t(getExerciseName(item.exercise))}</td>
                <td class="num-col" style="color: {accuracyColor(item.accuracy)}">
                  {formatAccuracy(item.accuracy)}
                </td>
                <td class="num-col">{item.attempts}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}

    <!-- Accuracy by category (weakest first) -->
    {#if categoryBreakdown.length > 0}
      <section class="report-section report-table-section">
        <h3 class="report-section-title">{$t('progress.report_by_category')}</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th>{$t('progress.report_category_header')}</th>
              <th class="num-col">{$t('progress.report_accuracy_header')}</th>
              <th class="num-col">{$t('progress.report_attempts_header')}</th>
            </tr>
          </thead>
          <tbody>
            {#each categoryBreakdown as item}
              <tr>
                <td>{$t(`categories.${item.category}`) || item.category}</td>
                <td class="num-col" style="color: {accuracyColor(item.accuracy)}">
                  {formatAccuracy(item.accuracy)}
                </td>
                <td class="num-col">{item.attempts}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </section>
    {/if}

    <!-- Word mastery -->
    <section class="report-section">
      <h3 class="report-section-title">{$t('progress.report_word_mastery')}</h3>
      <div class="mastery-grid">
        <div class="mastery-cell">
          <span class="mastery-value" style="color: var(--success)">{wordsMastered}</span>
          <span class="mastery-label">{$t('progress.report_mastered')}</span>
        </div>
        <div class="mastery-cell">
          <span class="mastery-value" style="color: var(--warning)">{wordsInProgress}</span>
          <span class="mastery-label">{$t('progress.report_learning')}</span>
        </div>
        <div class="mastery-cell">
          <span class="mastery-value" style="color: var(--primary)">{wordsNew}</span>
          <span class="mastery-label">{$t('progress.report_new')}</span>
        </div>
      </div>
    </section>

    <!-- Generated note -->
    <footer class="report-footer">
      {$t('progress.report_generated_on', {
        date: formatDate(new Date(), $locale, true),
        app: $t('app.name')
      })}
    </footer>
  {/if}
</section>

<style>
  .report-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-xl);
  }

  /* Toolbar */
  .report-toolbar {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  /* Header */
  .report-header {
    text-align: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: var(--space-md);
  }

  .report-app-name {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-dim);
    letter-spacing: 0.5px;
    margin: 0;
  }

  .report-doc-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
    margin: var(--space-xs) 0;
  }

  .report-date-range {
    font-size: var(--font-size-base);
    color: var(--text-dim);
    margin: 0;
  }

  /* Sections */
  .report-section {
    padding: var(--space-md) 0;
  }

  .report-section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text);
    margin-bottom: var(--space-sm);
  }

  /* Summary grid */
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-sm);
  }

  .summary-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .summary-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--text);
  }

  .summary-label {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    text-align: center;
  }

  /* Tables */
  .report-table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-base);
  }

  .report-table th {
    text-align: left;
    padding: var(--space-sm);
    border-bottom: 2px solid var(--border);
    font-weight: 600;
    color: var(--text);
  }

  .report-table td {
    padding: var(--space-sm);
    border-bottom: 1px solid var(--border);
    color: var(--text);
  }

  .report-table .num-col {
    text-align: right;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  .report-table-section {
    page-break-inside: avoid;
  }

  .report-table tbody tr {
    page-break-inside: avoid;
  }

  /* Word mastery */
  .mastery-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-sm);
  }

  .mastery-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-md);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .mastery-value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
  }

  .mastery-label {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    text-align: center;
  }

  /* Footer */
  .report-footer {
    margin-top: var(--space-lg);
    padding-top: var(--space-md);
    border-top: 1px solid var(--border);
    font-size: var(--font-size-sm);
    color: var(--text-muted);
    text-align: center;
  }

  /* Empty state */
  .report-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: var(--space-md);
    padding: var(--space-xl);
    color: var(--text-dim);
  }

  .report-empty-icon {
    font-size: 3rem;
  }

  /* Tablet: 4-column summary */
  @media (min-width: 768px) {
    .summary-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-md);
    }

    .report-doc-title {
      font-size: var(--font-size-3xl);
    }

    .summary-value {
      font-size: var(--font-size-3xl);
    }

    .report-table th,
    .report-table td {
      padding: var(--space-md);
    }
  }

  /* ─── PRINT ────────────────────────────────────────────────── */

  @media print {
    /* Force white background + black text regardless of theme */
    .report-page,
    .report-page * {
      background: white !important;
      color: black !important;
      border-color: #999 !important;
    }

    /* A4 page margins */
    @page {
      size: A4;
      margin: 1.5cm;
    }

    .report-page {
      padding: 0;
      gap: var(--space-md);
    }

    /* Hide interactive elements */
    .no-print {
      display: none !important;
    }

    /* Header: accent the rule line */
    .report-header {
      border-bottom: 2px solid #333 !important;
    }

    /* Tables: avoid row splits across pages */
    .report-table th {
      border-bottom: 2px solid #333 !important;
    }

    .report-table td {
      border-bottom: 1px solid #ccc !important;
    }

    /* Summary cards: minimal borders for print */
    .summary-cell,
    .mastery-cell {
      border: 1px solid #ccc !important;
    }

    /* Footer */
    .report-footer {
      border-top: 1px solid #ccc !important;
      margin-top: var(--space-md);
    }
  }
</style>
