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
    home: 'M3 12l9-8 9 8m-3 0v7a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1v-7',
    exercises:
      'M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z',
    progress:
      'M3 3v18h18M8 16l3-4 3 2 4-5',
    settings:
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
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
              <path d={iconPaths[item.icon] || ''} />
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
    width: 40px;
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
      width: 40px;
      opacity: 1;
    }
  }

  /* Phone: max-width to keep nav centered */
  @media (max-width: 767px) {
    .nav-list {
      max-width: 768px;
    }
  }

  /* Tablet: taller nav, bigger icons, full-width */
  @media (min-width: 768px) {
    .nav-list {
      height: 72px;
    }

    .icon-wrapper {
      width: 40px;
      height: 40px;
    }

    .nav-link {
      font-size: var(--font-size-base);
    }
  }
</style>
