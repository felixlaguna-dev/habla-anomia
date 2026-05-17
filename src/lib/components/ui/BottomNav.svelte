<script lang="ts">
  import { t } from '$lib/i18n';

  type NavItem = {
    path: string;
    labelKey: string;
    icon: string;
  };

  type Props = {
    navItems: NavItem[];
    isActive: (path: string) => boolean;
  };

  let { navItems, isActive }: Props = $props();

  /** Map icon name to SVG path data */
  let iconPaths: Record<string, string> = {
    home: 'M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z',
    exercises:
      'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
    progress:
      'M3 3v18h18M7 16l4-4 4 4 5-6',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7.5-3a7.5 7.5 0 0 1 .1-1.2l-2.1-1.6 2-3.4 2.5.8a7.5 7.5 0 0 1 1-.6L9 3.5h4l.7 2.5a7.5 7.5 0 0 1 1 .6l2.5-.8 2 3.4-2.1 1.6a7.5 7.5 0 0 1 .1 1.2m-15 0a7.5 7.5 0 0 1-.1 1.2l2.1 1.6-2 3.4-2.5-.8a7.5 7.5 0 0 1-1 .6L7 20.5h4l.7-2.5a7.5 7.5 0 0 1 1-.6l2.5.8 2-3.4-2.1-1.6a7.5 7.5 0 0 1 .1-1.2',
  };

  let activeIndex = $derived(
    navItems.findIndex((item) => isActive(item.path))
  );
</script>

<nav class="bottom-nav" aria-label="Main navigation">
  <ol class="nav-list">
    {#each navItems as item, i}
      {@const active = isActive(item.path)}
      <li class="nav-item" class:active>
        <a
          href={item.path}
          aria-current={active ? 'page' : undefined}
          class="nav-link"
        >
          <span class="icon-wrapper" class:active-icon={active}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              {@html iconPaths[item.icon] || ''}
            </svg>
          </span>
          <span class="nav-label">{$t(item.labelKey)}</span>
        </a>
        <!-- Animated active indicator -->
        {#if active}
          <div class="active-indicator" aria-hidden="true"></div>
        {/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: var(--surface);
    border-top: 1px solid var(--border);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    box-shadow: var(--shadow-lg);
  }

  .nav-list {
    display: flex;
    justify-content: space-around;
    align-items: stretch;
    max-width: 768px;
    margin: 0 auto;
    padding: 0;
    list-style: none;
    height: 64px;
  }

  .nav-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  .nav-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    width: 100%;
    min-height: var(--touch-min);
    text-decoration: none;
    color: var(--text-dim);
    font-size: var(--font-size-sm);
    font-family: var(--font-family);
    transition: color var(--transition-fast);
    position: relative;
    touch-action: manipulation;
    -webkit-user-select: none;
    user-select: none;
    padding: 4px 0;
  }

  .nav-link:focus-visible {
    outline: 3px solid var(--primary-light);
    outline-offset: -3px;
    border-radius: var(--radius-sm);
  }

  .nav-item.active .nav-link {
    color: var(--primary);
    font-weight: 600;
  }

  /* Icon wrapper with smooth transition */
  .icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    transition: background var(--transition-normal), transform var(--transition-normal);
  }

  .icon-wrapper.active-icon {
    background: var(--primary);
    color: white;
    transform: scale(1.05);
  }

  .nav-item.active .icon-wrapper svg {
    filter: drop-shadow(0 0 4px var(--primary-light));
  }

  .nav-label {
    line-height: 1.2;
    transition: transform var(--transition-fast);
  }

  /* Animated active indicator — pill under active tab */
  .active-indicator {
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 24px;
    height: 3px;
    background: var(--primary);
    border-radius: var(--radius-full) var(--radius-full) 0 0;
    animation: indicatorSlideIn 0.3s ease both;
  }

  @keyframes indicatorSlideIn {
    from {
      width: 0;
      opacity: 0;
    }
    to {
      width: 24px;
      opacity: 1;
    }
  }

  /* Responsive: larger targets on tablet */
  @media (min-width: 768px) {
    .nav-list {
      height: 72px;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
    }
  }
</style>
