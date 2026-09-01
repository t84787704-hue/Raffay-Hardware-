/**
 * Utility to scroll smoothly to any element by ID and trigger a high-visibility 
 * gold pulse highlight animation.
 */
export function scrollAndHighlight(
  elementId: string, 
  options?: { 
    delay?: number; 
    block?: ScrollLogicalPosition;
    retries?: number;
  }
): void {
  const delay = options?.delay ?? 60;
  const block = options?.block ?? 'center';
  const retries = options?.retries ?? 5;

  let attempts = 0;

  function attemptScroll() {
    attempts++;
    // Clear any previous active highlights
    document.querySelectorAll('.search-highlight-target').forEach((el) => {
      el.classList.remove('search-highlight-target');
    });

    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block });
      element.classList.add('search-highlight-target');

      setTimeout(() => {
        element.classList.remove('search-highlight-target');
      }, 2600);
      return;
    }

    if (attempts < retries) {
      setTimeout(attemptScroll, 120);
    }
  }

  setTimeout(attemptScroll, delay);
}
