<script lang="ts">
  import { t } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import LargeButton from '$lib/components/ui/LargeButton.svelte';
  import { getSessions } from '$lib/db/sessions';
  import { getAllSettings, getStreakInfo } from '$lib/db';
  import { getSRStats, getDueWords } from '$lib/engine/spaced-repetition';
  import { getWeakCategories } from '$lib/engine/session-generator';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import type { Language } from '$lib/types';

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
    type: string;
    icon: string;
    color: string;
    label: string;
    reason: string;
  }

  let dailyPlan = $state<PlanItem[]>([]);

  const exerciseTypes: Record<string, { icon: string; color: string; key: string }> = {
    'picture-naming': { icon: '🖼️', color: '#3b82f6', key: 'picture_naming' },
    'semantic-features': { icon: '🧠', color: '#8b5cf6', key: 'semantic_features' },
    'phonological-cueing': { icon: '🔤', color: '#06b6d4', key: 'phonological_cueing' },
    'category-sorting': { icon: '📂', color: '#f59e0b', key: 'category_sorting' },
    'generative-naming': { icon: '💡', color: '#10b981', key: 'generative_naming' },
    'word-matching': { icon: '🔗', color: '#ef4444', key: 'word_matching' },
    'sentence-completion': { icon: '📝', color: '#6366f1', key: 'sentence_completion' },
    'opposites-synonyms': { icon: '🔄', color: '#ec4899', key: 'opposites_synonyms' }
  };

  function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return ' Buenos días';
    if (hour >= 12 && hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  }

  function getGreetingEmoji(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return '☀️';
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

      // Today's completed sessions
      const today = new Date().toISOString().split('T')[0];
      todayCompleted = sessions.filter(s => {
        const d = s.started_at instanceof Date ? s.started_at : new Date(s.started_at);
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

    // 1. Due SR words → Picture naming (priority)
    if (dueCount > 0) {
      plan.push({
        type: 'picture-naming',
        icon: '🖼️',
        color: '#3b82f6',
        label: $t('exercises.picture_naming.name'),
        reason: $t('dashboard.review_due_words', { count: dueCount })
      });
    }

    // 2. Weakest categories → Semantic features
    const weakCats = await getWeakCategories(language, 2);
    weakCategories = weakCats;
    if (weakCats.length > 0) {
      plan.push({
        type: 'semantic-features',
        icon: '🧠',
        color: '#8b5cf6',
        label: $t('exercises.semantic_features.name'),
        reason: $t('dashboard.practice_weak_category')
      });
    }

    // 3. Phonological cueing (always good for anomia)
    plan.push({
      type: 'phonological-cueing',
      icon: '🔤',
      color: '#06b6d4',
      label: $t('exercises.phonological_cueing.name'),
      reason: $t('dashboard.phonological_practice')
    });

    // 4. Category sorting if not done today
    if (todayCompleted < 2) {
      plan.push({
        type: 'category-sorting',
        icon: '📂',
        color: '#f59e0b',
        label: $t('exercises.category_sorting.name'),
        reason: $t('dashboard.category_practice')
      });
    }

    dailyPlan = plan;
    todayGoal = plan.length;
  }

  function startExercise(type: string) {
    goto(`/exercises/${type}`);
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
        {#each dailyPlan as item, i}
          <Card>
            <div class="plan-item" class:completed={i < todayCompleted}>
              <div class="plan-info">
                <span class="plan-icon" style="background: {item.color}20; color: {item.color}">
                  {item.icon}
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
    <div class="exercise-grid stagger-children">
      {#each Object.entries(exerciseTypes) as [type, exercise]}
        <LargeButton
          onclick={() => startExercise(type)}
          label={$t(`exercises.${exercise.key}.name`)}
        >
          <span class="exercise-icon" style="background: {exercise.color}20; color: {exercise.color}">
            {exercise.icon}
          </span>
        </LargeButton>
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
    font-size: 1.25rem;
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
  }

  .plan-reason {
    font-size: 0.75rem;
    color: var(--text-secondary, #94a3b8);
  }

  .plan-start-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 36px;
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

  /* Exercises */
  .exercises-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .exercise-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }

  .exercise-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: 0.75rem;
    font-size: 1.5rem;
  }

  /* Mobile responsive */
  @media (max-width: 374px) {
    .stats-grid {
      gap: 0.5rem;
    }
    .stat-number {
      font-size: 1.25rem;
    }
    .exercise-grid {
      gap: 0.5rem;
    }
  }
</style>
