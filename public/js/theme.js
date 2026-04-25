function applyTheme(nextTheme) {
  if (nextTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem('theme', nextTheme);
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const decimals = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(decimals)} ${units[index]}`;
}

function setUploadFeedback(container, type, message) {
  if (!container) {
    return;
  }

  container.classList.remove(
    'hidden',
    'border-emerald-200',
    'bg-emerald-50',
    'text-emerald-800',
    'dark:border-emerald-900',
    'dark:bg-emerald-950/40',
    'dark:text-emerald-200',
    'border-amber-200',
    'bg-amber-50',
    'text-amber-800',
    'dark:border-amber-900',
    'dark:bg-amber-950/40',
    'dark:text-amber-200',
    'border-rose-200',
    'bg-rose-50',
    'text-rose-800',
    'dark:border-rose-900',
    'dark:bg-rose-950/40',
    'dark:text-rose-200'
  );

  const themes = {
    success: ['border-emerald-200', 'bg-emerald-50', 'text-emerald-800', 'dark:border-emerald-900', 'dark:bg-emerald-950/40', 'dark:text-emerald-200'],
    warning: ['border-amber-200', 'bg-amber-50', 'text-amber-800', 'dark:border-amber-900', 'dark:bg-amber-950/40', 'dark:text-amber-200'],
    error: ['border-rose-200', 'bg-rose-50', 'text-rose-800', 'dark:border-rose-900', 'dark:bg-rose-950/40', 'dark:text-rose-200']
  };

  (themes[type] || themes.error).forEach((className) => container.classList.add(className));
  container.textContent = message;
}

function updateFileLabel(input, label) {
  if (!label) {
    return;
  }

  if (!input.files?.length) {
    label.textContent = 'Belum ada file dipilih';
    return;
  }

  const totalSize = Array.from(input.files).reduce((sum, file) => sum + (file.size || 0), 0);
  label.textContent = `${input.files.length} file siap diunggah • ${formatBytes(totalSize)}`;
}

function assignFiles(input, files) {
  if (!input || !files?.length || typeof DataTransfer === 'undefined') {
    return;
  }

  const dataTransfer = new DataTransfer();
  Array.from(files).forEach((file) => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
}

function initializeUploadForms() {
  document.querySelectorAll('[data-upload-form]').forEach((form) => {
    const input = form.querySelector('[data-file-input]');
    const dropzone = form.querySelector('[data-dropzone]');
    const label = input ? document.querySelector(`[data-file-label="${input.id}"]`) : null;
    const progress = form.querySelector('[data-upload-progress]');
    const progressBar = form.querySelector('[data-upload-progress-bar]');
    const progressText = form.querySelector('[data-upload-progress-text]');
    const progressPercent = form.querySelector('[data-upload-progress-percent]');
    const feedback = form.querySelector('[data-upload-feedback]');
    const submitButton = form.querySelector('[data-upload-submit]');

    if (!input) {
      return;
    }

    input.addEventListener('change', () => {
      updateFileLabel(input, label);
      if (feedback) {
        feedback.classList.add('hidden');
      }
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add('dropzone-active');
      });
    });

    ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        if (eventName === 'drop' && event.dataTransfer?.files?.length) {
          assignFiles(input, event.dataTransfer.files);
          updateFileLabel(input, label);
        }
        dropzone.classList.remove('dropzone-active');
      });
    });

    form.addEventListener('submit', (event) => {
      if (typeof XMLHttpRequest === 'undefined' || typeof FormData === 'undefined') {
        return;
      }

      event.preventDefault();

      if (!input.files?.length) {
        setUploadFeedback(feedback, 'error', 'Pilih minimal satu file untuk diunggah.');
        return;
      }

      const xhr = new XMLHttpRequest();
      const formData = new FormData(form);

      submitButton?.setAttribute('disabled', 'disabled');
      submitButton?.classList.add('opacity-70', 'cursor-not-allowed');
      progress?.classList.remove('hidden');
      if (feedback) {
        feedback.classList.add('hidden');
      }

      if (progressBar) {
        progressBar.style.width = '0%';
      }
      if (progressText) {
        progressText.textContent = 'Menyiapkan upload...';
      }
      if (progressPercent) {
        progressPercent.textContent = '0%';
      }

      xhr.open(form.method || 'POST', form.action);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.upload.addEventListener('progress', (progressEvent) => {
        if (!progressEvent.lengthComputable) {
          if (progressText) {
            progressText.textContent = 'Mengunggah file...';
          }
          return;
        }

        const percent = Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100));
        if (progressBar) {
          progressBar.style.width = `${percent}%`;
        }
        if (progressPercent) {
          progressPercent.textContent = `${percent}%`;
        }
        if (progressText) {
          progressText.textContent = `Mengunggah ${formatBytes(progressEvent.loaded)} dari ${formatBytes(progressEvent.total)}`;
        }
      });

      xhr.addEventListener('load', () => {
        submitButton?.removeAttribute('disabled');
        submitButton?.classList.remove('opacity-70', 'cursor-not-allowed');

        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText || '{}');
        } catch (error) {
          payload = null;
        }

        if (progressBar) {
          progressBar.style.width = '100%';
        }
        if (progressPercent) {
          progressPercent.textContent = '100%';
        }

        if (xhr.status >= 200 && xhr.status < 300 && payload) {
          const type = payload.failedCount > 0 ? 'warning' : 'success';
          setUploadFeedback(feedback, type, payload.message || 'Upload selesai.');
          if (progressText) {
            progressText.textContent = payload.message || 'Upload selesai.';
          }
          window.setTimeout(() => {
            window.location.reload();
          }, 900);
          return;
        }

        const message = payload?.message || 'Upload gagal diproses.';
        setUploadFeedback(feedback, 'error', message);
        if (progressText) {
          progressText.textContent = message;
        }
      });

      xhr.addEventListener('error', () => {
        submitButton?.removeAttribute('disabled');
        submitButton?.classList.remove('opacity-70', 'cursor-not-allowed');
        setUploadFeedback(feedback, 'error', 'Koneksi terputus saat upload berlangsung.');
        if (progressText) {
          progressText.textContent = 'Upload gagal.';
        }
      });

      xhr.send(formData);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('[data-theme-toggle]');

  if (toggle) {
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.contains('dark');
      applyTheme(isDark ? 'light' : 'dark');
    });
  }

  initializeUploadForms();

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

function updateFileLabel(input, label) {
  if (!label) {
    return;
  }

  if (!input.files?.length) {
    label.textContent = 'Belum ada file dipilih';
    return;
  }

  const totalSize = Array.from(input.files).reduce((sum, file) => sum + (file.size || 0), 0);
  label.textContent = `${input.files.length} file siap diunggah | ${formatBytes(totalSize)}`;
}

function setInfiniteScrollStatus(container, message, isLoading) {
  if (!container) {
    return;
  }

  container.textContent = message;
  container.classList.toggle('infinite-loading', Boolean(isLoading));
}

function initializeInfiniteScroll() {
  if (typeof IntersectionObserver === 'undefined' || typeof fetch === 'undefined') {
    return;
  }

  document.querySelectorAll('[data-infinite-scroll]').forEach((section) => {
    const grid = section.querySelector('[data-infinite-grid]');
    const sentinel = section.querySelector('[data-infinite-sentinel]');
    const status = section.querySelector('[data-infinite-status]');
    const fallbackLink = section.querySelector('[data-infinite-fallback]');
    const fallbackWrapper = section.querySelector('[data-infinite-fallback-wrapper]');
    const countTargetId = section.dataset.countTarget;
    const countTarget = countTargetId ? document.getElementById(countTargetId) : null;

    if (!grid || !sentinel) {
      return;
    }

    let nextCursor = section.dataset.nextCursor || '';
    let hasMore = section.dataset.hasMore === 'true';
    let isLoading = false;
    let observer;

    if (fallbackWrapper) {
      fallbackWrapper.classList.add('hidden');
    }

    if (!hasMore || !nextCursor) {
      setInfiniteScrollStatus(status, 'Semua media yang tersedia sudah dimuat.', false);
      return;
    }

    const loadNextPage = async () => {
      if (isLoading || !hasMore || !nextCursor) {
        return;
      }

      isLoading = true;
      setInfiniteScrollStatus(status, 'Memuat media berikutnya', true);

      try {
        const url = new URL(section.dataset.endpoint, window.location.origin);
        url.searchParams.set('cursor', nextCursor);

        const response = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        const payload = await response.json();

        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.message || 'Gagal memuat batch media berikutnya.');
        }

        if (payload.html) {
          grid.insertAdjacentHTML('beforeend', payload.html);
        }

        if (countTarget) {
          const currentCount = Number(countTarget.textContent) || 0;
          countTarget.textContent = String(currentCount + (Number(payload.count) || 0));
        }

        nextCursor = payload.nextCursor || '';
        hasMore = Boolean(payload.hasMore && payload.nextCursor);
        section.dataset.nextCursor = nextCursor;
        section.dataset.hasMore = hasMore ? 'true' : 'false';

        if (!hasMore) {
          setInfiniteScrollStatus(status, 'Semua media yang tersedia sudah dimuat.', false);
          observer.disconnect();
          return;
        }

        setInfiniteScrollStatus(status, 'Scroll ke bawah untuk memuat media berikutnya.', false);
      } catch (error) {
        setInfiniteScrollStatus(status, error.message || 'Gagal memuat media berikutnya.', false);

        if (fallbackWrapper && fallbackLink) {
          const retryUrl = new URL(section.dataset.endpoint, window.location.origin);
          if (nextCursor) {
            retryUrl.searchParams.set('cursor', nextCursor);
          }
          fallbackLink.href = retryUrl.toString();
          fallbackWrapper.classList.remove('hidden');
        }
      } finally {
        isLoading = false;
      }
    };

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            void loadNextPage();
          }
        });
      },
      {
        rootMargin: '300px 0px'
      }
    );

    observer.observe(sentinel);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeInfiniteScroll();
});
