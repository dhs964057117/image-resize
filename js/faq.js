// CutImage - FAQ Accordion and Search Controller
(function () {
  'use strict';

  function initFaq() {
    var buttons = document.querySelectorAll('button[aria-controls^="faq-answer-"]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var isExpanded = btn.getAttribute('aria-expanded') === 'true';
        var targetId = btn.getAttribute('aria-controls');
        var answer = document.getElementById(targetId);
        var arrow = btn.querySelector('svg') || btn.querySelector('span.shrink-0');

        // Toggle current
        if (isExpanded) {
          btn.setAttribute('aria-expanded', 'false');
          if (answer) {
            answer.classList.add('max-h-0', 'opacity-0');
            answer.classList.remove('max-h-[800px]', 'opacity-100');
          }
          if (arrow) {
            arrow.style.transform = 'rotate(0deg)';
          }
        } else {
          btn.setAttribute('aria-expanded', 'true');
          if (answer) {
            answer.classList.remove('max-h-0', 'opacity-0');
            answer.classList.add('max-h-[800px]', 'opacity-100');
          }
          if (arrow) {
            arrow.style.transform = 'rotate(180deg)';
          }
        }
      });
    });

    // Search filter
    var searchInput = document.querySelector('input[placeholder*="Search for questions"]');
    if (searchInput) {
      searchInput.addEventListener('input', function (e) {
        var query = (e.target.value || '').trim().toLowerCase();
        var items = document.querySelectorAll('.bg-surface-container-lowest.border.border-outline-variant.rounded-xl.overflow-hidden');

        var visibleCount = 0;
        items.forEach(function (item) {
          var text = item.textContent.toLowerCase();
          if (!query || text.indexOf(query) !== -1) {
            item.style.display = '';
            visibleCount++;
          } else {
            item.style.display = 'none';
          }
        });

        // Check if no results
        var noResult = document.getElementById('faq-no-results');
        if (!noResult) {
          noResult = document.createElement('div');
          noResult.id = 'faq-no-results';
          noResult.className = 'text-center py-12 text-on-surface-variant hidden';
          noResult.innerHTML = '<p class="text-[18px] font-medium">No matching questions found.</p><p class="text-[14px] mt-2">Try searching for different keywords like "compress", "PNG", "SVG", or "privacy".</p>';
          var container = document.querySelector('section.px-margin-x-sm .max-w-\\[768px\\]') || document.querySelector('main');
          if (container) container.appendChild(noResult);
        }

        if (visibleCount === 0 && query) {
          noResult.classList.remove('hidden');
        } else {
          noResult.classList.add('hidden');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFaq);
  } else {
    initFaq();
  }
})();
