function getForcedDay() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramDay = urlParams.get('day');

  if (paramDay !== null && !isNaN(paramDay)) {
    const forcedDay = parseInt(paramDay);
    if (forcedDay >= 0 && forcedDay <= 6) {
      localStorage.setItem('FORCED_DAY', forcedDay);
      return forcedDay;
    }
  }

  const storedDay = localStorage.getItem('FORCED_DAY');
  if (storedDay !== null && !isNaN(storedDay)) {
    return parseInt(storedDay);
  }

  return new Date().getDay(); // fallback to actual day
}

const today = getForcedDay();

function rotateInnerRing() {
  const ring = document.querySelector('#inner-ring');
  const currentTransform = ring.getAttribute('transform') || "rotate(0, 0, 0)";
  const currentAngle = parseFloat(currentTransform.match(/rotate\(([-\d.]+),/)[1]) || 0;
  const newAngle = currentAngle + (360 / 26);
  ring.setAttribute('transform', `rotate(${newAngle}, 0, 0)`);
}

const puzzles = [
  'PETCO PARK OPENED IN TWO THOUSAND FOUR',
  'THE SWINGING FRIAR USED TO BE IN THE STANDS WITH FANS',
  'THE PADRES WERE FOUNDED IN NINETEEN SIXTY NINE',
  "THE SWINGING FRIAR IS ONE OF MLB'S FEW HUMAN MASCOTS",
  'SAN DIEGO LOVES BASEBALL'
];

function getDailyKey() {
  const todayStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash % 25) + 1;
}

function displayCipherKey() {
  const shift = getDailyKey();
  const from = String.fromCharCode(((65 + shift - 65) % 26) + 65);
  document.getElementById('cipher-key').textContent = `Today's Cipher Key: ${from} = A`;
}

function caesarEncrypt(text, shift) {
  return text.split('').map(c => {
    if (c >= 'A' && c <= 'Z') {
      return String.fromCharCode((c.charCodeAt(0) - 65 + shift) % 26 + 65);
    }
    return c;
  }).join('');
}

function displayPuzzle() {
  const shift = getDailyKey();

  if (today >= 1 && today <= 5) {
    const puzzle = caesarEncrypt(puzzles[today - 1], shift);
    document.getElementById('daily-puzzle').textContent = puzzle;
  } else {
    document.getElementById('daily-puzzle').innerHTML = "Come back Monday to Friday for a new cipher puzzle!";
  }
}

function autoSizeInputToPuzzle() {
  const input = document.getElementById('user-answer');

  if (today >= 1 && today <= 5) {
    const answerLength = puzzles[today - 1].length;
    const width = Math.max(250, answerLength * 8);
    input.style.width = `${width}px`;
  } else {
    input.style.width = "250px";
  }
}

function checkAnswer() {
  const input = document.getElementById('user-answer').value.trim().toUpperCase();
  const shift = getDailyKey();
  const successMessages = [
    "💥 It’s outta here! Home run!",
    "📣 The crowd goes wild! You nailed it!",
    "🧒 Atta kid! Great read on that cipher.",
    "⚾ Like Tony Gwynn in the clutch — perfect!",
    "🕵️‍♂️ Cipher cracked. The Friar approves."
  ];
  const feedbackElement = document.getElementById('feedback-reaction');

  // clear any previous animation styles
  feedbackElement.style.animation = '';
  void feedbackElement.offsetWidth; // force reflow to restart animations

  if (today >= 1 && today <= 5) {
    const correct = puzzles[today - 1];

    if (input === correct) {
      // play cheer sound only once
      const cheer = document.getElementById('cheer-sound');
      if (cheer.paused) {
        cheer.play();
      }

      const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
      feedbackElement.innerHTML = randomSuccess;
      feedbackElement.style.color = "#ffffff";
      feedbackElement.style.display = "block";
      feedbackElement.style.animation = 'popEffect 0.5s ease-out forwards';

      // reset popup visibility timer
      if (window._feedbackTimer) {
        clearTimeout(window._feedbackTimer);
      }
      window._feedbackTimer = setTimeout(() => {
        feedbackElement.style.display = "none";
      }, 3000);
    } else {
      feedbackElement.innerHTML = "❌ Not quite. Try again!";
      feedbackElement.style.color = "#c0392b";
      feedbackElement.style.display = "block";
      feedbackElement.style.animation = 'shakeEffect 0.5s ease-out forwards';

      // reset error visibility timer
      if (window._feedbackTimer) {
        clearTimeout(window._feedbackTimer);
      }
      window._feedbackTimer = setTimeout(() => {
        feedbackElement.style.animation = '';
        feedbackElement.style.display = "none";
      }, 2000);
    }
  } else {
    feedbackElement.style.display = "none";
  }
}

// Theme Panel Functionality
const themeTag = document.getElementById('themeTag');
const themePanel = document.getElementById('themePanel');
const themeOptions = document.querySelectorAll('.theme-option');
const closePanel = document.getElementById('closePanel');

let closeTimeout; // Store the timeout ID

function adjustPanelPosition() {
  const panelWidth = themePanel.offsetWidth;
  themePanel.style.left = `-${panelWidth}px`;
  themeTag.style.left = '0';
}

function moveTagWithPanel() {
  const panelWidth = themePanel.offsetWidth;
  themeTag.style.left = `${panelWidth}px`;
}

function openPanel() {
  clearTimeout(closeTimeout);
  themePanel.classList.add('open');
  themePanel.style.left = '0';
  moveTagWithPanel();
}

function closePanelFunction() {
  const panelWidth = themePanel.offsetWidth;
  themePanel.classList.remove('open');
  themePanel.style.left = `-${panelWidth}px`;
  themeTag.style.left = '0';
}

themeTag.addEventListener('mouseenter', openPanel);
themeTag.addEventListener('mouseleave', () => {
  closeTimeout = setTimeout(() => {
    if (!themePanel.matches(':hover')) {
      closePanelFunction();
    }
  }, 7000);
});

themePanel.addEventListener('mouseenter', () => {
  clearTimeout(closeTimeout);
});

themePanel.addEventListener('mouseleave', () => {
  closeTimeout = setTimeout(() => {
    if (!themePanel.matches(':hover') && !themeTag.matches(':hover')) {
      closePanelFunction();
    }
  }, 7000);
});

themeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    const theme = opt.getAttribute('data-theme');
    document.body.className = theme;
    localStorage.setItem('selectedTheme', theme);
    closePanelFunction();
  });
});

closePanel.addEventListener('click', closePanelFunction);

// Close button for the Themes Panel
const closeThemePanelBtn = document.getElementById('close-theme-panel');
closeThemePanelBtn.addEventListener('click', () => {
  closePanelFunction(); // Call the existing function to close the panel
});

const savedTheme = localStorage.getItem('selectedTheme');
if (savedTheme) {
  document.body.className = savedTheme;
}

window.addEventListener('resize', adjustPanelPosition);
window.addEventListener('load', adjustPanelPosition);

// Close button for the How to Play Modal
const closeInfoModalBtn = document.getElementById('close-info-modal');
closeInfoModalBtn.addEventListener('click', () => {
  const infoModal = document.getElementById('info-modal');
  infoModal.style.display = 'none'; // Hide the modal
});

// Optional: Close the How to Play Modal when clicking outside of it
window.addEventListener('click', (event) => {
  const infoModal = document.getElementById('info-modal');
  if (event.target === infoModal) {
    infoModal.style.display = 'none';
  }
});

window.onload = function () {
  displayCipherKey();
  displayPuzzle();
  autoSizeInputToPuzzle();

  document.getElementById('info-btn').onclick = () => {
    document.getElementById('info-modal').style.display = 'flex';
  };

  document.querySelector('.close-btn').onclick = () => {
    document.getElementById('info-modal').style.display = 'none';
  };

  window.onclick = function (e) {
    const modal = document.getElementById('info-modal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
};
