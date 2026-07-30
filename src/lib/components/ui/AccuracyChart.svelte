<script lang="ts">
  /**
   * 14-day accuracy bar chart shared by the progress page and the therapist report.
   *
   * `printable` drops CSS transitions (irrelevant on paper) and uses a shorter
   * bar height to save vertical space on A4.
   */
  import { t } from '$lib/i18n';
  import type { Language } from '$lib/types';
  import { calculateImprovementTrend } from '$lib/engine/statistics';
  import {
    accuracyColor,
    formatAccuracy,
    weekdayInitial,
    TREND_ARROWS
  } from '$lib/utils/progress-helpers';

  let {
    data,
    locale,
    printable = false,
    headingLevel = 'h3'
  }: {
    data: Array<{ date: string; accuracy: number; correct: number; total: number }>;
    locale: Language;
    printable?: boolean;
    headingLevel?: 'h2' | 'h3';
  } = $props();

  let trend = $derived(calculateImprovementTrend(data));
  let activeDays = $derived(data.filter(d => d.total > 0).length);
</script>

<div class="chart-wrapper">
  <div class="chart-header">
    <svelte:element this={headingLevel} class="chart-title">
      {$t('progress.accuracy_over_time')}
    </svelte:element>
    {#if activeDays >= 2}
      <span class="trend trend-{trend}">
        <span class="trend-arrow" aria-hidden="true">{TREND_ARROWS[trend]}</span>
        {$t('progress.trend_label')}: {$t(`progress.trend_${trend}`)}
      </span>
    {/if}
  </div>
  <div
    class="chart-bars"
    role="img"
    aria-label={$t('progress.accuracy_over_time')}
  >
    {#each data as day}
      <div class="chart-col">
        <div class="chart-bar-track" class:printable>
          {#if day.total > 0}
            <div
              class="chart-bar"
              class:no-transition={printable}
              style="height: {day.accuracy}%; background: {accuracyColor(day.accuracy)}"
              title={`${day.date} · ${formatAccuracy(day.accuracy)} · ${day.total}`}
            ></div>
          {/if}
        </div>
        <span class="chart-day-label">{weekdayInitial(day.date, locale)}</span>
      </div>
    {/each}
  </div>
</div>

<style>
  .chart-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .chart-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
    flex-wrap: wrap;
  }

  .chart-title {
    font-size: var(--font-size-xl);
    font-weight: 600;
    color: var(--text);
  }

  .chart-bars {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--space-xs);
  }

  .chart-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
    min-width: 0;
  }

  .chart-bar-track {
    width: 100%;
    height: 140px;
    display: flex;
    align-items: flex-end;
    background: var(--surface-3);
    border-radius: 4px 4px 0 0;
  }

  .chart-bar-track.printable {
    height: 100px;
  }

  .chart-bar {
    width: 100%;
    min-height: 4px;
    border-radius: 4px 4px 0 0;
    transition: height var(--transition-slow);
  }

  .chart-bar.no-transition {
    transition: none;
  }

  .chart-day-label {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    text-align: center;
  }

  .trend {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  .trend-arrow {
    font-size: 1.2em;
    line-height: 1;
  }

  .trend-improving { color: var(--success); }
  .trend-stable { color: var(--text-dim); }
  .trend-declining { color: var(--error); }

  /* Tablet: taller bars */
  @media (min-width: 768px) {
    .chart-bar-track:not(.printable) {
      height: 180px;
    }

    .chart-title {
      font-size: var(--font-size-2xl);
    }
  }

  /* Print: force black text + light track regardless of theme */
  @media print {
    .chart-title,
    .chart-day-label,
    .trend {
      color: black !important;
    }

    .chart-bar-track {
      background: #eee !important;
      border: 1px solid #ccc !important;
    }
  }
</style>
