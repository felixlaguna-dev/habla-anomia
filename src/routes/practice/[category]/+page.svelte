<script lang="ts">
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { CATEGORIES, type Category } from '$lib/types';
  import { getAllSettings } from '$lib/db';
  import { categoryHasEnoughWords, awaitSeedReady } from '$lib/db/words';
  import { CategoryIcon, Spinner, ExerciseIcon } from '$lib/components/ui';
  import { getExerciseMeta, type ExerciseMeta } from '$lib/exercises/registry';

  let category = $derived($page.params.category as Category);
  let isValid = $derived(CATEGORIES.includes(category));
  // Localized label for the header — only meaningful when the slug is valid,
  // otherwise $t('categories.<slug>') returns the raw key.
  let categoryLabel = $derived(isValid ? $t(`categories.${category}`) : '');

  let available = $state(true);
  let loading = $state(true);

  // Exercises that work well per-category. "Escucha y elige" (listen-and-choose)
  // is intentionally absent — its exercise type does not exist yet; add it here
  // (and to the registry) when it lands.
  const choices = (['picture-naming', 'sentence-completion'] as const)
    .map((type) => getExerciseMeta(type))
    .filter((m): m is ExerciseMeta => m !== undefined);

  onMount(async () => {
    if (!isValid) {
      loading = false;
      return;
    }
    try {
      const settings = await getAllSettings();
      // Wait for the word bank to be seeded so a direct cold navigation to
      // /practice/<cat> doesn't falsely report "not enough words".
      await awaitSeedReady();
      available = await categoryHasEnoughWords(category, settings.language);
    } catch (e) {
      console.warn('Failed to load category:', e);
      available = false;
    } finally {
      loading = false;
    }
  });

  function startChosen(type: string) {
    goto(`${base}/exercises/${type}?category=${category}`);
  }
</script>

<svelte:head>
  <title>{isValid ? `${categoryLabel} · ` : ''}{$t('app.name')}</title>
</svelte:head>

<section class="practice-page">
  <header class="practice-header">
    <button class="back-btn" onclick={() => goto(`${base}/`)} aria-label={$t('common.back')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>
    <div class="header-text">
      {#if isValid}
        <CategoryIcon category={category} size="lg" />
      {/if}
      <div class="header-words">
        <h1 class="practice-title" tabindex="-1">{isValid ? categoryLabel : $t('practice.invalid_category')}</h1>
        {#if isValid}
          <p class="practice-subtitle">{$t('practice.choose_exercise')}</p>
        {/if}
      </div>
    </div>
    <div class="header-spacer"></div>
  </header>

  {#if loading}
    <Spinner />
  {:else if !isValid || !available}
    <div class="state-container">
      <span class="state-icon" aria-hidden="true">🗂️</span>
      <p class="state-message">
        {isValid ? $t('practice.not_available') : $t('practice.invalid_category')}
      </p>
      <button class="primary-btn" onclick={() => goto(`${base}/`)}>
        {$t('practice.back_home')}
      </button>
    </div>
  {:else}
    <div class="choices stagger-children">
      {#each choices as choice (choice.type)}
        <button
          class="choice-card"
          onclick={() => startChosen(choice.type)}
          aria-label={$t(`exercises.${choice.i18nKey}.name`)}
        >
          <span class="choice-icon" style="--ex-color: {choice.color}" aria-hidden="true">
            <ExerciseIcon meta={choice} size={28} />
          </span>
          <span class="choice-text">
            <span class="choice-label">{$t(`exercises.${choice.i18nKey}.name`)}</span>
            <span class="choice-desc">{$t(`practice.${choice.i18nKey}_desc`)}</span>
          </span>
          <span class="choice-arrow" aria-hidden="true">›</span>
        </button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .practice-page {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding-bottom: var(--space-xl);
  }

  .practice-header {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--touch-min);
    height: var(--touch-min);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text);
    cursor: pointer;
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }

  .back-btn:active {
    background: var(--surface-2);
  }

  .header-text {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .header-words {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .practice-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text);
    margin: 0;
    overflow-wrap: break-word;
  }

  .practice-subtitle {
    font-size: var(--font-size-base);
    color: var(--text-dim);
    margin: 0;
  }

  .header-spacer {
    width: var(--touch-min);
    flex-shrink: 0;
  }

  .state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-2xl);
    text-align: center;
    min-height: 40vh;
  }

  .state-icon {
    font-size: 3rem;
    line-height: 1;
  }

  .state-message {
    color: var(--text);
    font-size: var(--font-size-lg);
    font-weight: 600;
  }

  /* Exercise choices */
  .choices {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  .choice-card {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    width: 100%;
    min-height: var(--touch-min);
    padding: var(--space-md) var(--space-lg);
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text);
    font-family: var(--font-family);
    cursor: pointer;
    touch-action: manipulation;
    text-align: left;
    transition: transform var(--transition-fast), background var(--transition-fast);
  }

  .choice-card:active {
    transform: scale(0.98);
    background: var(--surface-2);
  }

  .choice-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--ex-color, var(--primary)) 14%, transparent);
    color: var(--ex-color, var(--primary));
    flex-shrink: 0;
  }

  .choice-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .choice-label {
    font-size: var(--font-size-lg);
    font-weight: 700;
    overflow-wrap: break-word;
  }

  .choice-desc {
    font-size: var(--font-size-sm);
    color: var(--text-dim);
    overflow-wrap: break-word;
  }

  .choice-arrow {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text-dim);
    flex-shrink: 0;
    line-height: 1;
  }

  .primary-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: var(--touch-min);
    padding: var(--space-sm) var(--space-xl);
    background: var(--primary);
    color: #fff;
    border: none;
    border-radius: var(--radius-full);
    font-size: var(--font-size-lg);
    font-weight: 600;
    font-family: var(--font-family);
    cursor: pointer;
    transition: background var(--transition-fast);
  }

  .primary-btn:active {
    background: var(--primary-hover);
  }

  /* Tablet+: side-by-side choices, bigger icons */
  @media (min-width: 768px) {
    .practice-title {
      font-size: var(--font-size-2xl);
    }

    .practice-subtitle {
      font-size: var(--font-size-lg);
    }

    .choices {
      flex-direction: row;
    }

    .choice-card {
      flex-direction: column;
      text-align: center;
      padding: var(--space-xl);
      gap: var(--space-md);
    }

    .choice-icon {
      width: 4rem;
      height: 4rem;
    }

    .choice-label {
      font-size: var(--font-size-xl);
    }

    .choice-desc {
      font-size: var(--font-size-base);
    }

    .choice-arrow {
      display: none;
    }
  }
</style>
