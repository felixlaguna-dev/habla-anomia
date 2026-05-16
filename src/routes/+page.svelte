<script lang="ts">
  import { t } from '$lib/i18n';
  import Card from '$lib/components/ui/Card.svelte';
  import LargeButton from '$lib/components/ui/LargeButton.svelte';
  import { getSessions, getDailyStats } from '$lib/db/sessions';
  import { getRecentAttempts } from '$lib/db/attempts';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let totalSessions = $state(0);
  let todaySessions = $state(0);
  let accuracy = $state(0);

  const exerciseTypes = [
    { type: 'picture-naming', icon: '🖼️', color: '#3b82f6', key: 'picture_naming' },
    { type: 'semantic-features', icon: '🧠', color: '#8b5cf6', key: 'semantic_features' },
    { type: 'phonological-cueing', icon: '🔤', color: '#06b6d4', key: 'phonological_cueing' },
    { type: 'category-sorting', icon: '📂', color: '#f59e0b', key: 'category_sorting' },
    { type: 'generative-naming', icon: '💡', color: '#10b981', key: 'generative_naming' },
    { type: 'word-matching', icon: '🔗', color: '#ef4444', key: 'word_matching' },
    { type: 'sentence-completion', icon: '📝', color: '#6366f1', key: 'sentence_completion' },
    { type: 'opposites-synonyms', icon: '🔄', color: '#ec4899', key: 'opposites_synonyms' }
  ];

  onMount(async () => {
    try {
      const sessions = await getSessions();
      totalSessions = sessions.length;

      const today = new Date().toISOString().split('T')[0];
      const stats = await getDailyStats(today);
      todaySessions = stats.total;
      accuracy = stats.accuracy;

      if (totalSessions > 0 && accuracy === 0) {
        const recent = await getRecentAttempts(100);
        const correct = recent.filter(a => a.correct).length;
        accuracy = Math.round((correct / recent.length) * 100);
      }
    } catch (e) {
      console.warn('Failed to load stats:', e);
    }
  });
</script>

<div class="dashboard">
  <header class="dashboard-header">
    <h1 class="app-title">{$t('app.name')}</h1>
    <p class="app-subtitle">{$t('app.tagline')}</p>
  </header>

  <section class="stats-grid">
    <Card>
      <div class="stat">
        <span class="stat-number">{totalSessions}</span>
        <span class="stat-label">{$t('dashboard.words_practiced')}</span>
      </div>
    </Card>
    <Card>
      <div class="stat">
        <span class="stat-number">{todaySessions}</span>
        <span class="stat-label">{$t('dashboard.today_practice')}</span>
      </div>
    </Card>
    <Card>
      <div class="stat">
        <span class="stat-number">{accuracy}%</span>
        <span class="stat-label">{$t('dashboard.accuracy')}</span>
      </div>
    </Card>
  </section>

  <section class="exercises-section">
    <h2 class="section-title">{$t('exercises.title')}</h2>
    <div class="exercise-grid">
      {#each exerciseTypes as exercise}
        <LargeButton
          onclick={() => goto(`/exercises/${exercise.type}`)}
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
</style>
