<script lang="ts">
  type Props = {
    value?: string;
    placeholder?: string;
    label?: string;
    type?: string;
    disabled?: boolean;
    error?: string;
    oninput?: (value: string) => void;
    onsubmit?: (value: string) => void;
  };

  let {
    value = '',
    placeholder = '',
    label = '',
    type = 'text',
    disabled = false,
    error = '',
    oninput,
    onsubmit,
  }: Props = $props();

  let internalValue = $state(value);

  // Sync external value changes
  $effect(() => {
    internalValue = value;
  });

  function handleInput(e: Event) {
    const el = e.target as HTMLInputElement;
    internalValue = el.value;
    oninput?.(el.value);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onsubmit?.(internalValue);
    }
  }
</script>

<div style="display:flex;flex-direction:column;gap:6px;">
  {#if label}
    <label
      for={label}
      style="font-size:var(--font-size-base);font-weight:600;color:var(--text);"
    >
      {label}
    </label>
  {/if}
  <input
    id={label || undefined}
    {type}
    {placeholder}
    {disabled}
    value={internalValue}
    oninput={handleInput}
    onkeydown={handleKeydown}
    aria-label={label || placeholder}
    aria-invalid={error ? 'true' : undefined}
    aria-describedby={error ? `${label}-error` : undefined}
    style="
      min-height:56px;width:100%;padding:12px 16px;
      font-size:var(--font-size-lg);font-family:var(--font-family);
      color:var(--text);background:var(--surface);
      border:2px solid {error ? 'var(--error)' : 'var(--border)'};
      border-radius:var(--radius-md);
      outline:none;transition:border-color var(--transition-fast);
      ${disabled ? 'opacity:0.5;pointer-events:none;' : ''}
    "
  />
  {#if error}
    <p id="{label}-error" role="alert" style="font-size:var(--font-size-sm);color:var(--error);margin:0;">
      {error}
    </p>
  {/if}
</div>

<style>
  input:focus {
    border-color: var(--primary) !important;
    box-shadow: 0 0 0 3px var(--primary-light);
  }
</style>
