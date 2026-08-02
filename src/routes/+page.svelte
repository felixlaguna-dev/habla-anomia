<script lang="ts">
  import { t } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import { ExerciseIcon, CategoryIcon } from '$lib/components/ui';
  import { getSessions, completedTypesToday } from '$lib/db/sessions';
  import { getAllSettings, getStreakInfo } from '$lib/db';
  import { getCategoriesWithEnoughWords, awaitSeedReady, DRILLABLE_CATEGORY_MIN } from '$lib/db/words';
  import { getSRStats } from '$lib/engine/spaced-repetition';
  import { getAccuracyByExercise, getTodaysFailures } from '$lib/db/attempts';
  import { getWeakCategories } from '$lib/engine/session-generator';
  import { EXERCISE_REGISTRY, EXERCISE_TYPES, getExerciseMeta, TTS_REQUIRED_EXERCISES, type ExerciseMeta } from '$lib/exercises/registry';
  import { SpeechSynthesisService } from '$lib/speech/speech-synthesis';
  import { scrollAffordance } from '$lib/utils/scroll-affordance';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { Language, Category, ExerciseType } from '$lib/types';

  let accuracy = $state(0);
  let streakCurrent = $state(0);
  let dueCount = $state(0);
  let language = $state<Language>('es');
  let practiceCategories: Category[] = $state([]);
  let todayFailuresCount = $state(0);
  let loading = $state(true);
  let loadError = $state(false);
  let hasAnyCompletedSession = $state(false);

  // Weakest category label for computed plan reasons
  let weakestCategory = $state<Category | null>(null);

  // Daily plan recommendations
  interface PlanItem {
    type: ExerciseType;
    meta: ExerciseMeta;
    reason: string;
  }

  let dailyPlan = $state<PlanItem[]>([]);

  // Exercise types completed today (from sessions with ended_at set today).
  let completedTodayTypes = $state<Set<ExerciseType>>(new Set());

  // How many of today's plan items are done — derived from the plan + types.
  let todayCompleted = $derived(
    dailyPlan.filter(item => completedTodayTypes.has(item.type)).length
  );

  // Next uncompleted plan item — the hero CTA target.
  let nextPlanItem = $derived(
    dailyPlan.find(item => !completedTodayTypes.has(item.type))
  );

  // Category row scroll affordance
  let categoryRowEl = $state<HTMLElement | null>(null);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  function handleScrollChange(left: boolean, right: boolean) {
    canScrollLeft = left;
    canScrollRight = right;
  }

  const ttsSupported = SpeechSynthesisService.isSupported();

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return $t('dashboard.welcome.morning');
    if (hour >= 12 && hour < 20) return $t('dashboard.welcome.afternoon');
    return $t('dashboard.welcome.evening');
  }

  function getGreetingEmoji(): string {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '☀️';
    if (hour >= 12 && hour < 20) return '👋';
    return '🌙';
  }

  onMount(async () => {
    try {
      const settings = await getAllSettings();
      language = settings.language;

      await awaitSeedReady();

      const [streakInfo, sessions, srStats, cats, failures, exerciseAccuracies, weakCats] = await Promise.all([
        getStreakInfo(),
        getSessions(language, 100),
        getSRStats(language),
        getCategoriesWithEnoughWords(language, DRILLABLE_CATEGORY_MIN, true),
        getTodaysFailures(language),
        getAccuracyByExercise(language),
        getWeakCategories(language, 1)
      ]);

      streakCurrent = streakInfo.current;
      dueCount = srStats.due;
      practiceCategories = cats;
      todayFailuresCount = [...failures.values()].reduce((sum, words) => sum + words.length, 0);

      completedTodayTypes = completedTypesToday(sessions);

      const completed = sessions.filter(s => s.ended_at);
      hasAnyCompletedSession = completed.length > 0;
      if (completed.length > 0) {
        const recent10 = completed.slice(0, 10);
        accuracy = Math.round(recent10.reduce((sum, s) => sum + s.accuracy, 0) / recent10.length);
      }

      // Weakest category from getWeakCategories (sorted ascending with tie-breaking)
      if (weakCats.length > 0) {
        weakestCategory = weakCats[0];
      }

      buildDailyPlan(exerciseAccuracies);

    } catch (e) {
      console.warn('Failed to load stats:', e);
      loadError = true;
    } finally {
      loading = false;
    }
  });

  /**
   * Compute a truthful reason for recommending an exercise, based on real data:
   * - Never tried → "Nuevo para ti"
   * - SR words due → "N palabras para repasar"
   * - Otherwise → "Refuerza: <weakest category>" (or "Seguir practicando" fallback)
   */
  function computeReason(type: ExerciseType, hasAttempts: boolean): string {
    if (!hasAttempts) return $t('dashboard.new_for_you');
    if (dueCount > 0) return $t('dashboard.review_due_words', { count: String(dueCount) });
    if (weakestCategory) return $t('dashboard.reinforce_category', { category: $t(`categories.${weakestCategory}`) });
    return $t('dashboard.keep_practicing');
  }

  function buildDailyPlan(exerciseAccuracies: Array<{ exercise_type: ExerciseType; accuracy: number; correct: number; total: number }>) {
    const plan: PlanItem[] = [];

    const availableTypes = ttsSupported
      ? EXERCISE_TYPES
      : EXERCISE_TYPES.filter((t) => !TTS_REQUIRED_EXERCISES.includes(t));

    const triedTypes = new Set(exerciseAccuracies.map(ea => ea.exercise_type));

    let selectedTypes: ExerciseType[];

    if (exerciseAccuracies.length === 0) {
      selectedTypes = availableTypes.slice(0, 3);
    } else {
      // Prioritise untried types first, then weakest among tried
      const untried = availableTypes.filter(t => !triedTypes.has(t));
      const triedSorted = [...exerciseAccuracies]
        .filter(ea => availableTypes.includes(ea.exercise_type))
        .sort((a, b) => a.accuracy - b.accuracy)
        .map(ea => ea.exercise_type);

      selectedTypes = [...untried, ...triedSorted].slice(0, 3);
    }

    for (const type of selectedTypes) {
      const meta = getExerciseMeta(type);
      if (!meta) continue;
      plan.push({
        type,
        meta,
        reason: computeReason(type, triedTypes.has(type))
      });
    }

    dailyPlan = plan;
  }

  function startExercise(type: string) {
    goto(`${base}/exercises/${type}`);
  }

  function scrollCategoryRow() {
    const el = categoryRowEl;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }
</script>

<div class="dashboard">
  <!-- Greeting: one modest line -->
  <header class="dashboard-greeting fade-in">
    <p>{getGreetingEmoji()} {getGreeting()}</p>
  </header>

  {#if loading}
    <div class="hero-skeleton skeleton"></div>
  {:else if loadError}
    <div class="fade-in">
      <Card padding="lg">
        <p class="empty-stats-text">{$t('dashboard.no_sessions_yet')}</p>
      </Card>
    </div>
  {:else if nextPlanItem}
    <!-- Hero card: primary CTA -->
    <div class="hero-card fade-in">
      <Card padding="lg">
        <div class="hero-content">
          <div class="hero-info">
            <span class="hero-icon">
              <ExerciseIcon meta={nextPlanItem.meta} size={32} />
            </span>
            <div class="hero-text">
              <span class="hero-label">{$t('dashboard.continue_with')}</span>
              <span class="hero-exercise">{$t(`exercises.${nextPlanItem.meta.i18nKey}.name`)}</span>
              <span class="hero-reason">{nextPlanItem.reason}</span>
            </div>
          </div>
          <button
            class="hero-btn"
            onclick={() => startExercise(nextPlanItem.type)}
            aria-label="{$t('common.start')}: {$t(`exercises.${nextPlanItem.meta.i18nKey}.name`)}"
          >
            {$t('common.start')}
          </button>
        </div>
      </Card>
    </div>
  {:else}
    <!-- All plan items done -->
    <div class="hero-card hero-done fade-in">
      <Card padding="lg">
        <div class="hero-done-content">
          <span class="hero-done-text">{$t('dashboard.all_done_hero')}</span>
          <button
            class="hero-btn-secondary"
            onclick={() => startExercise(dailyPlan[0]?.type ?? EXERCISE_TYPES[0])}
          >
            {$t('dashboard.keep_practicing')}
          </button>
        </div>
      </Card>
    </div>
  {/if}

  <!-- Stats row -->
  {#if loading}
    <section class="stats-grid">
      {#each { length: 3 } as _}
        <div class="skeleton-card">
          <div class="skeleton-line number"></div>
          <div class="skeleton-line"></div>
        </div>
      {/each}
    </section>
  {:else if !hasAnyCompletedSession}
    <!-- Empty/new-user state -->
    <section class="empty-stats fade-in">
      <p class="empty-stats-text">{$t('dashboard.no_sessions_yet')}</p>
    </section>
  {:else}
    <section class="stats-grid fade-in">
      <Card>
        <div class="stat">
          <span class="stat-number">{todayCompleted}/{dailyPlan.length}</span>
          <span class="stat-label">{$t('dashboard.today_exercises')}</span>
        </div>
      </Card>
      <Card>
        <div class="stat">
          <span class="stat-number">{streakCurrent}</span>
          <span class="stat-label">{$t('dashboard.streak')}</span>
        </div>
      </Card>
      <Card>
        <div class="stat">
          <span class="stat-number">{accuracy}%</span>
          <span class="stat-label">{$t('dashboard.accuracy')}</span>
        </div>
      </Card>
    </section>
  {/if}

  <!-- Today's Plan -->
  <section class="plan-section">
    <h2 class="section-title">📋 {$t('dashboard.daily_plan')}</h2>
    {#if loading}
      <div class="plan-list">
        {#each { length: 3 } as _}
          <div class="skeleton-card">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line"></div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="plan-list stagger-children">
        {#each dailyPlan as item (item.type)}
          {@const isDone = completedTodayTypes.has(item.type)}
          <Card>
            <div class="plan-item" class:completed={isDone}>
              <div class="plan-info">
                <span class="plan-icon">
                  <ExerciseIcon meta={item.meta} size={28} />
                </span>
                <div class="plan-text">
                  <span class="plan-label">{$t(`exercises.${item.meta.i18nKey}.name`)}</span>
                  <span class="plan-reason">{item.reason}</span>
                </div>
              </div>
              <button
                class="plan-start-btn"
                onclick={() => startExercise(item.type)}
                aria-label={isDone
                  ? `${$t(`exercises.${item.meta.i18nKey}.name`)}, ${$t('dashboard.done_today')}`
                  : `${$t('common.start')}: ${$t(`exercises.${item.meta.i18nKey}.name`)}`}
              >
                {isDone ? '✓' : $t('common.start')}
              </button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}

    {#if !loading && todayCompleted >= dailyPlan.length && dailyPlan.length > 0}
      <div class="plan-complete scale-in">
        🎉 {$t('dashboard.all_done_today')}
      </div>
    {/if}
  </section>

  <!-- Review today's failures -->
  {#if !loading && todayFailuresCount > 0}
    <section class="review-failures-section fade-in">
      <Card>
        <button
          class="review-card"
          onclick={() => goto(`${base}/review-failures`)}
          aria-label={$t('dashboard.review_failures_button')}
        >
          <span class="review-card-icon" aria-hidden="true">⚠️</span>
          <div class="review-card-text">
            <span class="review-card-title">
              {$t('dashboard.review_failures_title', { count: String(todayFailuresCount) })}
            </span>
            <span class="review-card-cta">
              {$t('dashboard.review_failures_button')} ({todayFailuresCount}) →
            </span>
          </div>
        </button>
      </Card>
    </section>
  {/if}

  <!-- All Exercises -->
  <section class="exercises-section">
    <h2 class="section-title">{$t('exercises.title')}</h2>
    <div class="exercise-chips stagger-children">
      {#each EXERCISE_REGISTRY as exercise (exercise.type)}
        {@const ttsRequired = !!exercise.requiresTts && !ttsSupported}
        {@const isDone = completedTodayTypes.has(exercise.type)}
        <button
          class="exercise-chip"
          class:disabled={ttsRequired}
          onclick={() => startExercise(exercise.type)}
          disabled={ttsRequired}
          aria-label={isDone
            ? `${$t(`exercises.${exercise.i18nKey}.name`)}, ${$t('dashboard.done_today')}`
            : $t(`exercises.${exercise.i18nKey}.name`)}
          aria-disabled={ttsRequired ? 'true' : undefined}
        >
          <span class="chip-icon">
            <ExerciseIcon meta={exercise} size={24} variant="solid" />
          </span>
          <span class="chip-label">{$t(`exercises.${exercise.i18nKey}.short_name`)}</span>
          {#if ttsRequired}
            <span class="chip-note">{$t('exercises.listen_choose.needs_tts')}</span>
          {/if}
          {#if isDone}
            <span class="chip-done" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </section>

  <!-- Practicar una categoría: drill one semantic field -->
  {#if !loading && practiceCategories.length > 0}
    <section class="category-section fade-in">
      <h2 class="section-title">🗂️ {$t('practice.section_title')}</h2>
      <div class="category-scroll-wrapper">
        <div class="category-row" bind:this={categoryRowEl} use:scrollAffordance={{ onScrollChange: handleScrollChange }}>
          {#each practiceCategories as cat}
            <button
              class="category-tile"
              onclick={() => goto(`${base}/practice/${cat}`)}
              aria-label={$t('practice.section_title') + ': ' + $t(`categories.${cat}`)}
            >
              <CategoryIcon category={cat} size="lg" />
              <span class="category-tile-label">{$t(`categories.${cat}`)}</span>
            </button>
          {/each}
        </div>
        <div class="scroll-fade scroll-fade-left" class:visible={canScrollLeft} aria-hidden="true"></div>
        <div class="scroll-fade scroll-fade-right" class:visible={canScrollRight} aria-hidden="true"></div>
        <button
          class="scroll-arrow"
          class:visible={canScrollRight}
          onclick={scrollCategoryRow}
          aria-label={$t('practice.scroll_right')}
          tabindex={canScrollRight ? 0 : -1}
          aria-hidden={!canScrollRight}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </section>
  {/if}
</div>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Greeting — one modest line */
  .dashboard-greeting {
    padding: 0.5rem 0 0;
  }

  .dashboard-greeting p {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-dim);
    margin: 0;
  }

  /* ─── Hero card ──────────────────────────────────────────────────── */
  .hero-skeleton {
    height: 140px;
    border-radius: var(--radius-lg);
    background: var(--surface);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }

  .hero-card {
    border-left: 4px solid var(--primary);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .hero-info {
    display: flex;
    align-items: center;
    gap: 0.875rem;
  }

  .hero-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    flex-shrink: 0;
  }

  .hero-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .hero-label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-dim);
  }

  .hero-exercise {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text);
    overflow-wrap: break-word;
  }

  .hero-reason {
    font-size: 0.8rem;
    color: var(--text-dim);
    overflow-wrap: break-word;
  }

  .hero-btn {
    width: 100%;
    min-height: 72px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-family);
    font-size: 1.25rem;
    font-weight: 700;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform var(--transition-fast), opacity var(--transition-fast);
  }

  .hero-btn:active {
    opacity: 0.85;
    transform: scale(0.97);
  }

  /* All-done hero */
  .hero-done {
    border-left-color: var(--success);
  }

  .hero-done-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .hero-done-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--success);
    text-align: center;
  }

  .hero-btn-secondary {
    width: 100%;
    min-height: 56px;
    background: var(--surface-2);
    color: var(--text);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-md);
    font-family: var(--font-family);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition: transform var(--transition-fast);
  }

  .hero-btn-secondary:active {
    transform: scale(0.97);
  }

  /* ─── Stats row ──────────────────────────────────────────────────── */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .stat-number {
    font-size: 1.5rem;
    font-weight: 700;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--text-dim);
    text-align: center;
    overflow-wrap: break-word;
  }

  /* Empty/new-user state */
  .empty-stats {
    text-align: center;
    padding: 0.5rem 0;
  }

  .empty-stats-text {
    font-size: 1rem;
    color: var(--text-dim);
    margin: 0;
  }

  /* ─── Section titles ─────────────────────────────────────────────── */
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  /* ─── Plan section ───────────────────────────────────────────────── */
  .plan-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .plan-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .plan-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.5rem 0;
  }

  .plan-item.completed {
    opacity: 0.6;
  }

  .plan-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }

  .plan-icon {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    flex-shrink: 0;
  }

  .plan-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .plan-label {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text);
    overflow-wrap: break-word;
  }

  .plan-reason {
    font-size: 0.75rem;
    color: var(--text-dim);
    overflow-wrap: break-word;
  }

  .plan-start-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    min-width: 56px;
    padding: 0.25rem 0.75rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 2rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: transform var(--transition-fast), opacity var(--transition-fast);
  }

  .plan-start-btn:active {
    opacity: 0.8;
    transform: scale(0.95);
  }

  .plan-item.completed .plan-start-btn {
    background: var(--success);
  }

  .plan-complete {
    text-align: center;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--success);
  }

  /* ─── Exercise chips ─────────────────────────────────────────────── */
  .exercises-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .exercise-chips {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .exercise-chip {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem 0.75rem 1.5rem;
    background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: 2rem;
    color: var(--text);
    font-family: var(--font-family);
    font-size: var(--font-size-base);
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-user-select: none;
    user-select: none;
    min-height: 48px;
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .exercise-chip:active {
    transform: scale(0.95);
    background: var(--surface-3);
  }

  .chip-icon {
    position: absolute;
    top: -10px;
    left: -10px;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
    z-index: 1;
  }

  .chip-label {
    line-height: 1.2;
    white-space: nowrap;
  }

  .exercise-chip.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .exercise-chip.disabled:active {
    transform: none;
  }

  /* Done-today sticker */
  .chip-done {
    position: absolute;
    bottom: -4px;
    right: -4px;
    width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--success);
    color: #fff;
    border: 2px solid var(--bg);
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
    z-index: 2;
    opacity: 0.85;
  }

  .chip-note {
    display: block;
    width: 100%;
    font-size: 0.7rem;
    font-weight: 400;
    color: var(--text-muted, var(--text-dim));
    line-height: 1.2;
    margin-top: 2px;
    text-align: center;
  }

  /* ─── Category tiles ─────────────────────────────────────────────── */
  .category-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .category-scroll-wrapper {
    position: relative;
  }

  .category-row {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding: 0.5rem 0.25rem 0.75rem;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  .scroll-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1.5rem;
    pointer-events: none;
    opacity: 0;
    transition: opacity var(--transition-fast);
    z-index: 1;
  }

  .scroll-fade-left {
    left: 0;
    background: linear-gradient(to right, var(--bg), transparent);
  }

  .scroll-fade-right {
    right: 0;
    background: linear-gradient(to left, var(--bg), transparent);
  }

  .scroll-fade.visible {
    opacity: 1;
  }

  .scroll-arrow {
    position: absolute;
    right: 0;
    top: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--touch-min);
    height: var(--touch-min);
    border: none;
    border-radius: 50%;
    background: var(--primary);
    color: white;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%);
    transition: opacity var(--transition-fast), transform var(--transition-fast);
    z-index: 2;
    box-shadow: var(--shadow-sm);
  }

  .scroll-arrow.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .scroll-arrow:active {
    transform: translateY(-50%) scale(0.92);
  }

  .category-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 6.5rem;
    min-height: var(--touch-min);
    padding: 0.75rem 0.5rem;
    background: var(--surface-2);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text);
    font-family: var(--font-family);
    cursor: pointer;
    touch-action: manipulation;
    scroll-snap-align: start;
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .category-tile:active {
    transform: scale(0.96);
    background: var(--surface-3);
  }

  .category-tile-label {
    font-size: 0.85rem;
    font-weight: 600;
    text-align: center;
    line-height: 1.2;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* ─── Review failures card ───────────────────────────────────────── */
  .review-failures-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .review-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    font-family: var(--font-family);
    text-align: left;
  }

  .review-card-icon {
    font-size: 1.75rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .review-card-text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1;
    min-width: 0;
  }

  .review-card-title {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text);
    overflow-wrap: break-word;
  }

  .review-card-cta {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--warning);
  }

  /* ─── Responsive ─────────────────────────────────────────────────── */

  /* Tablet+: bigger category tiles */
  @media (min-width: 768px) {
    .category-tile {
      min-width: 8rem;
      padding: 1rem 0.75rem;
    }

    .category-tile-label {
      font-size: 1rem;
    }

    .scroll-fade {
      width: 2rem;
    }
  }

  /* 640px+: 4-column exercise grid */
  @media (min-width: 640px) {
    .exercise-chips {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    .exercise-chip {
      padding: 0.6rem 0.75rem 0.6rem 1.25rem;
    }
  }

  /* Tablet (768px+): bigger everything */
  @media (min-width: 768px) {
    .hero-exercise {
      font-size: 1.5rem;
    }

    .hero-icon {
      width: 3.5rem;
      height: 3.5rem;
    }

    .stat-number {
      font-size: 2rem;
    }

    .stat-label {
      font-size: 0.9rem;
    }

    .section-title {
      font-size: 1.5rem;
    }

    .plan-icon {
      width: 3rem;
      height: 3rem;
    }

    .plan-label {
      font-size: 1.15rem;
    }

    .plan-start-btn {
      min-height: 56px;
      font-size: 1rem;
    }

    .exercise-chip {
      min-height: 64px;
      font-size: 1.1rem;
      padding: 1rem 1.5rem;
      border-radius: 2.5rem;
    }

    .chip-icon {
      width: 2.75rem;
      height: 2.75rem;
      top: -12px;
      left: -12px;
    }

    .chip-done {
      width: 1.5rem;
      height: 1.5rem;
      bottom: -6px;
      right: -6px;
    }

    .exercise-chips {
      gap: 1rem;
    }
  }

  /* Landscape tablet: 2-column plan, wider grid */
  @media (min-width: 768px) and (orientation: landscape) {
    .plan-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .plan-item {
      padding: 1rem;
    }

    .exercise-chips {
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    .exercise-chip {
      min-height: 68px;
      font-size: 1.15rem;
    }
  }

  /* Small mobile */
  @media (max-width: 399px) {
    .stats-grid {
      gap: 0.5rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      --card-pad: var(--space-sm) var(--space-xs);
    }
    .stat-number {
      font-size: 1.25rem;
    }
    .exercise-chips {
      gap: 0.6rem;
    }
    .exercise-chip {
      padding: 0.6rem 0.75rem 0.6rem 1.25rem;
      font-size: var(--font-size-sm);
    }
    .chip-icon {
      width: 2.25rem;
      height: 2.25rem;
      top: -8px;
      left: -8px;
    }

    .chip-done {
      width: 1.1rem;
      height: 1.1rem;
      bottom: -3px;
      right: -3px;
      border-width: 1.5px;
    }
  }
</style>
