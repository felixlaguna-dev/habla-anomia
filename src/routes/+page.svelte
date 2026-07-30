<script lang="ts">
  import { t } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import { ExerciseIcon, CategoryIcon } from '$lib/components/ui';
  import { getSessions } from '$lib/db/sessions';
  import { getAllSettings, getStreakInfo } from '$lib/db';
  import { getCategoriesWithEnoughWords, awaitSeedReady, DRILLABLE_CATEGORY_MIN } from '$lib/db/words';
  import { getSRStats } from '$lib/engine/spaced-repetition';
  import { getAccuracyByExercise, getTodaysFailures } from '$lib/db/attempts';
  import { EXERCISE_REGISTRY, EXERCISE_TYPES, getExerciseMeta, type ExerciseMeta } from '$lib/exercises/registry';
  import { scrollAffordance } from '$lib/utils/scroll-affordance';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { Language, Category, ExerciseType } from '$lib/types';

  let totalSessions = $state(0);
  let todayCompleted = $state(0);
  let todayGoal = $state(4);
  let accuracy = $state(0);
  let streakCurrent = $state(0);
  let streakLongest = $state(0);
  let dueCount = $state(0);
  let language = $state<Language>('es');
  let practiceCategories: Category[] = $state([]);
  let todayFailuresCount = $state(0);
  let loading = $state(true);

  // Category row scroll affordance — fade + arrow
  let categoryRowEl = $state<HTMLElement | null>(null);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  function handleScrollChange(left: boolean, right: boolean) {
    canScrollLeft = left;
    canScrollRight = right;
  }

  // Daily plan recommendations
  interface PlanItem {
    type: ExerciseType;
    meta: ExerciseMeta;
    reason: string;
  }

  let dailyPlan = $state<PlanItem[]>([]);

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

      // The word-bank query below reads the words table, which is seeded by
      // +layout.svelte on cold starts — wait for it so the category row renders
      // on the very first load instead of staying empty until a route change.
      await awaitSeedReady();

      // Streak, sessions, SR stats, drillable categories and exercise accuracy
      // are independent — fan them out instead of serializing round-trips.
      const [streakInfo, sessions, srStats, cats, failures, exerciseAccuracies] = await Promise.all([
        getStreakInfo(),
        getSessions(language, 100),
        getSRStats(language),
        getCategoriesWithEnoughWords(language, DRILLABLE_CATEGORY_MIN, true),
        getTodaysFailures(language),
        getAccuracyByExercise(language)
      ]);

      streakCurrent = streakInfo.current;
      streakLongest = streakInfo.longest;
      totalSessions = sessions.length;
      dueCount = srStats.due;
      practiceCategories = cats;
      todayFailuresCount = [...failures.values()].reduce((sum, words) => sum + words.length, 0);

      // Today's completed sessions (sessions that actually finished)
      const today = new Date().toISOString().split('T')[0];
      const completedSessions = sessions.filter(s => s.ended_at);
      todayCompleted = completedSessions.filter(s => {
        const d = s.ended_at instanceof Date ? s.ended_at : new Date(s.ended_at!);
        return d.toISOString().split('T')[0] === today;
      }).length;

      // Accuracy from recent sessions
      const completed = sessions.filter(s => s.ended_at);
      if (completed.length > 0) {
        const recent10 = completed.slice(0, 10);
        accuracy = Math.round(recent10.reduce((sum, s) => sum + s.accuracy, 0) / recent10.length);
      }

      // Build daily plan (pass pre-fetched accuracies to avoid a second IDB round-trip)
      buildDailyPlan(exerciseAccuracies);

    } catch (e) {
      console.warn('Failed to load stats:', e);
    } finally {
      loading = false;
    }
  });

  function buildDailyPlan(exerciseAccuracies: Array<{ exercise_type: ExerciseType; accuracy: number; correct: number; total: number }>) {
    const plan: PlanItem[] = [];

    let selectedTypes: ExerciseType[];

    if (exerciseAccuracies.length === 0) {
      // New user: show first 3 exercises as defaults
      selectedTypes = EXERCISE_TYPES.slice(0, 3);
    } else {
      // Pick the 3 exercise types with lowest accuracy
      // Build a map of exercise_type -> accuracy
      const accMap = new Map<string, number>();
      for (const ea of exerciseAccuracies) {
        accMap.set(ea.exercise_type, ea.accuracy);
      }
      // Sort all types by accuracy (ascending), unpractised types get 0
      selectedTypes = [...EXERCISE_TYPES].sort((a, b) => {
        const accA = accMap.get(a) ?? 0;
        const accB = accMap.get(b) ?? 0;
        return accA - accB;
      }).slice(0, 3);
    }

    // Build reason strings for each selected type
    const reasonMap: Record<ExerciseType, string> = {
      'picture-naming': dueCount > 0
        ? $t('dashboard.review_due_words', { count: String(dueCount) })
        : $t('dashboard.phonological_practice'),
      'semantic-features': $t('dashboard.practice_weak_category'),
      'phonological-cueing': $t('dashboard.phonological_practice'),
      'category-sorting': $t('dashboard.category_practice'),
      'generative-naming': $t('dashboard.category_practice'),
      'word-matching': $t('dashboard.phonological_practice'),
      'sentence-completion': $t('dashboard.phonological_practice'),
      'opposites-synonyms': $t('dashboard.practice_weak_category'),
      'odd-one-out': $t('dashboard.category_practice')
    };

    for (const type of selectedTypes) {
      const meta = getExerciseMeta(type);
      if (!meta) continue;
      plan.push({
        type,
        meta,
        reason: reasonMap[type] || $t('dashboard.phonological_practice')
      });
    }

    dailyPlan = plan;
    todayGoal = plan.length;
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
  <!-- Welcome header -->
  <header class="dashboard-header fade-in">
    <p class="welcome-text">{getGreetingEmoji()} {getGreeting()}!</p>
    <h1 class="app-title">{$t('app.name')}</h1>
    <p class="app-subtitle">{$t('app.tagline')}</p>
    {#if streakCurrent > 0}
      <div class="streak-badge glow">
        🔥 {$t('dashboard.streak')}: {streakCurrent} {$t('dashboard.days')}
      </div>
    {/if}
  </header>

  {#if loading}
    <!-- Skeleton loading for stats -->
    <section class="stats-grid">
      {#each { length: 3 } as _}
        <div class="skeleton-card">
          <div class="skeleton-line number"></div>
          <div class="skeleton-line"></div>
        </div>
      {/each}
    </section>
  {:else}
    <!-- Stats grid -->
    <section class="stats-grid fade-in">
      <Card>
        <div class="stat">
          <span class="stat-number">{todayCompleted}/{todayGoal}</span>
          <span class="stat-label">{$t('dashboard.today_exercises')}</span>
        </div>
      </Card>
      <Card>
        <div class="stat">
          <span class="stat-number">{totalSessions}</span>
          <span class="stat-label">{$t('dashboard.words_practiced')}</span>
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
        {#each dailyPlan as item, i (item.type)}
          <Card>
            <div class="plan-item" class:completed={i < todayCompleted}>
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
              >
                {i < todayCompleted ? '✓' : $t('common.start')}
              </button>
            </div>
          </Card>
        {/each}
      </div>
    {/if}

    {#if !loading && todayCompleted >= todayGoal && todayGoal > 0}
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
        <button
          class="exercise-chip"
          onclick={() => startExercise(exercise.type)}
          aria-label={$t(`exercises.${exercise.i18nKey}.name`)}
        >
          <span class="chip-icon">
            <ExerciseIcon meta={exercise} size={15} variant="solid" />
          </span>
          <span class="chip-label">{$t(`exercises.${exercise.i18nKey}.short_name`)}</span>
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

  .dashboard-header {
    text-align: center;
    padding: 1rem 0;
  }

  .welcome-text {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-dim);
    margin: 0 0 0.25rem;
  }

  .app-title {
    font-size: 2rem;
    font-weight: 800;
    color: var(--accent);
    margin: 0;
  }

  .app-subtitle {
    font-size: 1rem;
    color: var(--text-dim);
    margin: 0.25rem 0 0;
  }

  .streak-badge {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: var(--streak-gradient);
    color: white;
    border-radius: 2rem;
    font-weight: 700;
    font-size: 0.9rem;
  }

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

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  /* Plan section */
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

  /* Exercise chips */
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
    padding: 0.75rem 1rem 0.75rem 1.25rem;
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
    top: -8px;
    left: -8px;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    box-shadow: var(--shadow-sm);
    z-index: 1;
  }

  .chip-label {
    line-height: 1.2;
    white-space: nowrap;
  }

  /* Category tiles ("Practicar una categoría") */
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
    padding: 0.5rem 0.25rem 0.75rem; /* room for the focus ring + scroll bar */
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  /* Scroll affordances: edge fade + arrow button */
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
    /* Clamp to 2 lines so tall labels stay tidy inside a fixed-width tile. */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Tablet+: bigger tiles, more visible per row */
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

  /* Tablet+: 4 columns */
  @media (min-width: 640px) {
    .exercise-chips {
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    .exercise-chip {
      padding: 0.6rem 0.75rem 0.6rem 1rem;
    }
  }

  /* Tablet (768px+): bigger everything — fills available width */
  @media (min-width: 768px) {
    .app-title {
      font-size: 2.5rem;
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
      width: 1.8rem;
      height: 1.8rem;
      top: -9px;
      left: -9px;
    }

    .exercise-chips {
      gap: 1rem;
    }
  }

  /* Landscape tablet: 2-column plan, wider exercise grid */
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

  /* Review failures card */
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

  /* Small mobile */
  @media (max-width: 399px) {
    .stats-grid {
      gap: 0.5rem;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      /* Tighten Card padding so stat labels have room to wrap readably */
      --card-pad: var(--space-sm) var(--space-xs);
    }
    .stat-number {
      font-size: 1.25rem;
    }
    .exercise-chips {
      gap: 0.6rem;
    }
    .exercise-chip {
      padding: 0.6rem 0.75rem 0.6rem 1rem;
      font-size: var(--font-size-sm);
    }
    .chip-icon {
      width: 1.4rem;
      height: 1.4rem;
      top: -7px;
      left: -7px;
    }
  }
</style>
