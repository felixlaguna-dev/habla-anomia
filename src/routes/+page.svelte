<script lang="ts">
  import { t } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import { ExerciseIcon } from '$lib/components/ui';
  import { getSessions } from '$lib/db/sessions';
  import { getAllSettings, getStreakInfo } from '$lib/db';
  import { getSRStats, getDueWords } from '$lib/engine/spaced-repetition';
  import { getWeakCategories } from '$lib/engine/session-generator';
  import { getAccuracyByExercise } from '$lib/db/attempts';
  import { EXERCISE_REGISTRY, getExerciseMeta } from '$lib/exercises/registry';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import type { Language, ExerciseType } from '$lib/types';

  let totalSessions = $state(0);
  let todayCompleted = $state(0);
  let todayGoal = $state(4);
  let accuracy = $state(0);
  let streakCurrent = $state(0);
  let streakLongest = $state(0);
  let dueCount = $state(0);
  let language = $state<Language>('es');
  let weakCategories: string[] = $state([]);
  let loading = $state(true);

  // Daily plan recommendations
  interface PlanItem {
    type: ExerciseType;
    label: string;
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

      // Streak
      const streakInfo = await getStreakInfo();
      streakCurrent = streakInfo.current;
      streakLongest = streakInfo.longest;

      // Sessions count
      const sessions = await getSessions(language, 100);
      totalSessions = sessions.length;

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

      // SR stats
      const srStats = await getSRStats(language);
      dueCount = srStats.due;

      // Build daily plan
      await buildDailyPlan();

    } catch (e) {
      console.warn('Failed to load stats:', e);
    } finally {
      loading = false;
    }
  });

  async function buildDailyPlan() {
    const plan: PlanItem[] = [];
    const allTypes = EXERCISE_REGISTRY.map((e) => e.type);

    // Get exercise accuracy data from past attempts
    const exerciseAccuracies = await getAccuracyByExercise(language);

    let selectedTypes: ExerciseType[];

    if (exerciseAccuracies.length === 0) {
      // New user: show first 3 exercises as defaults
      selectedTypes = allTypes.slice(0, 3);
    } else {
      // Pick the 3 exercise types with lowest accuracy
      // Build a map of exercise_type -> accuracy
      const accMap = new Map<string, number>();
      for (const ea of exerciseAccuracies) {
        accMap.set(ea.exercise_type, ea.accuracy);
      }
      // Sort all types by accuracy (ascending), unpractised types get 0
      selectedTypes = [...allTypes].sort((a, b) => {
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
      'opposites-synonyms': $t('dashboard.practice_weak_category')
    };

    for (const type of selectedTypes) {
      const meta = getExerciseMeta(type);
      if (!meta) continue;
      plan.push({
        type,
        label: $t(`exercises.${meta.i18nKey}.name`),
        reason: reasonMap[type] || $t('dashboard.phonological_practice')
      });
    }

    dailyPlan = plan;
    todayGoal = plan.length;
  }

  function startExercise(type: string) {
    goto(`${base}/exercises/${type}`);
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
          {@const meta = getExerciseMeta(item.type)}
          <Card>
            <div class="plan-item" class:completed={i < todayCompleted}>
              <div class="plan-info">
                <span class="plan-icon" style="--ex-color: {meta?.color}">
                  {#if meta}<ExerciseIcon {meta} size={28} />{/if}
                </span>
                <div class="plan-text">
                  <span class="plan-label">{item.label}</span>
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
          <span class="chip-icon" style="--ex-color: {exercise.color}">
            <ExerciseIcon meta={exercise} size={15} />
          </span>
          <span class="chip-label">{$t(`exercises.${exercise.i18nKey}.short_name`)}</span>
        </button>
      {/each}
    </div>
  </section>
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
    color: var(--accent, #3b82f6);
    margin: 0;
  }

  .app-subtitle {
    font-size: 1rem;
    color: var(--text-secondary, #94a3b8);
    margin: 0.25rem 0 0;
  }

  .streak-badge {
    display: inline-block;
    margin-top: 0.5rem;
    padding: 0.25rem 0.75rem;
    background: linear-gradient(135deg, #ff6b35, #f59e0b);
    color: white;
    border-radius: 2rem;
    font-weight: 700;
    font-size: 0.9rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    overflow: hidden;
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
    color: var(--text-secondary, #94a3b8);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    align-items: center;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--ex-color, var(--primary)) 14%, transparent);
    color: var(--ex-color, var(--primary));
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-reason {
    font-size: 0.75rem;
    color: var(--text-secondary, #94a3b8);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-start-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    min-width: 56px;
    padding: 0.25rem 0.75rem;
    background: var(--accent, #3b82f6);
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
    background: var(--success, #10b981);
  }

  .plan-complete {
    text-align: center;
    padding: 1rem;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--success, #10b981);
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
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 50%;
    background: var(--ex-color, var(--primary));
    color: white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    z-index: 1;
  }

  .chip-label {
    line-height: 1.2;
    white-space: nowrap;
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
      grid-template-columns: repeat(2, 1fr);
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
  @media (max-width: 374px) {
    .stats-grid {
      gap: 0.5rem;
      grid-template-columns: repeat(3, 1fr);
    }
    .stat-number {
      font-size: 1.25rem;
    }
    .stat-label {
      font-size: 0.65rem;
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
