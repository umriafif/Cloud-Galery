function applyTheme(nextTheme) {
  if (nextTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem('theme', nextTheme);
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-theme-toggle]');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  document.querySelectorAll('[data-file-input]').forEach((input) => {
    const label = document.querySelector(`[data-file-label="${input.id}"]`);

    input.addEventListener('change', () => {
      if (!label) {
        return;
      }

      if (!input.files?.length) {
        label.textContent = 'Belum ada file dipilih';
        return;
      }

      label.textContent = `${input.files.length} file siap diunggah`;
    });
  });

  const player = document.querySelector('[data-video-player]');
  const button = document.querySelector('[data-video-toggle]');

  if (player && button) {
    const syncLabel = () => {
      button.textContent = player.paused ? 'Play' : 'Pause';
    };

    button.addEventListener('click', () => {
      if (player.paused) {
        void player.play();
      } else {
        player.pause();
      }
      syncLabel();
    });

    player.addEventListener('play', syncLabel);
    player.addEventListener('pause', syncLabel);
    syncLabel();
  }
});
