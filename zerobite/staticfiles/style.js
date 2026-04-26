document.addEventListener('DOMContentLoaded', () => {
  const kpiValues = document.querySelectorAll('.kpi-value');

  kpiValues.forEach(el => {
    const target = +el.getAttribute('data-target');
    const duration = 2000; // total duration of animation in ms
    const frameRate = 60; // animation frames per second
    const totalFrames = Math.round(duration / (1000 / frameRate));
    let frame = 0;

    function easeOutQuad(t) {
      return t * (2 - t);
    }

    function updateCount() {
      frame++;
      const progress = easeOutQuad(frame / totalFrames);
      const currentValue = Math.round(target * progress);

      if (target >= 1000000) {
        el.textContent = (currentValue / 1000000).toFixed(1) + 'M';
      } else if (target >= 1000) {
        el.textContent = (currentValue / 1000).toFixed(0) + 'k';
      } else {
        el.textContent = currentValue;
      }

      if (frame < totalFrames) {
        requestAnimationFrame(updateCount);
      } else {
        // Ensure final value exactly matches target
        if (target >= 1000000) {
          el.textContent = (target / 1000000).toFixed(1) + 'M';
        } else if (target >= 1000) {
          el.textContent = (target / 1000).toFixed(0) + 'k';
        } else {
          el.textContent = target;
        }
      }
    }

    updateCount();
  });
});









const lines = [
  'end food waste',
  'reduce hunger',
  'save our planet',
  'share kindness',
  'nourish communities',
  'build a better future'
];

const container = document.getElementById('animatedWords');

let lineIndex = 0;
let wordIndex = 0;

function showNextWord() {
  const words = lines[lineIndex].split(' ');
  
  if (wordIndex < words.length) {
    // Append next word with space
    container.textContent += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
    wordIndex++;
    setTimeout(showNextWord, 500);
  } else {
    // Line finished - hold for 2 seconds then reset and show the next line
    setTimeout(() => {
      container.textContent = '';
      wordIndex = 0;
      lineIndex = (lineIndex + 1) % lines.length;
      showNextWord();
    }, 2000);
  }
}

// Start the animation
if (container) {
  showNextWord();
} else {
  console.error('Animated words container not found');
}