<script lang="ts">
  // Renders 2-4 answer options as OptionCards. Card visual state is derived
  // centrally via getCardState so every exercise scores feedback the same way.
  import OptionCard from './OptionCard.svelte';
  import { getCardState, type FeedbackState } from '$lib/utils/exercise-helpers';

  type Props = {
    options: string[];
    feedbackState: FeedbackState;
    selectedIndex: number | null;
    correctIndex: number;
    disabled?: boolean;
    speakEnabled?: boolean;
    isSpeaking?: boolean;
    /** Render options side-by-side (two columns) at >=768px. */
    twoColumns?: boolean;
    onselect: (index: number) => void;
    onspeak?: (text: string) => void;
  };

  let {
    options,
    feedbackState,
    selectedIndex,
    correctIndex,
    disabled = false,
    speakEnabled = false,
    isSpeaking = false,
    twoColumns = false,
    onselect,
    onspeak,
  }: Props = $props();
</script>

<div class="options-grid" class:tablet-2={twoColumns}>
  {#each options as option, i}
    <OptionCard
      text={option}
      state={getCardState(i, feedbackState, selectedIndex, correctIndex)}
      {disabled}
      {speakEnabled}
      {isSpeaking}
      onselect={() => onselect(i)}
      {onspeak}
    />
  {/each}
</div>

<style>
  .options-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm, 8px);
    width: 100%;
  }

  @media (min-width: 768px) {
    .options-grid.tablet-2 {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
