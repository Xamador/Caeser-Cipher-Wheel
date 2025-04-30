// ────────────────────────────────────────────────────
// 📦 Supabase client init — replace with your own creds
// ────────────────────────────────────────────────────
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL  = 'https://gbkhmqevevsdegzvmieg.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia2htcWV2ZXZzZGVnenZtaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2NzE5MzUsImV4cCI6MjA2MTI0NzkzNX0.hu4Nx9KZ4XMGzfki_FGLFNsNp6nvCnwm6ZDJ_uPhotQ';
const supabase      = createClient(SUPABASE_URL, SUPABASE_ANON);

// ────────────────────────────────────────────────────
// 🔄 Fetch + mark-used (via date_used) from Supabase
// ────────────────────────────────────────────────────
async function fetchPuzzleFromSupabase(theme) {
  // Normalize theme to match your DB (e.g. "Lightning", "Padres")
  const stripped = theme.replace(/^theme-/, '');
  const dbTheme = stripped.charAt(0).toUpperCase() + stripped.slice(1).toLowerCase();
  const today   = new Date().toISOString().slice(0,10);

  // Fetch one unused puzzle for this theme
  let { data, error } = await supabase
    .from('puzzles')
    .select('id, puzzle_data')
    .eq('theme', dbTheme)
    .is('date_used', null)
    .limit(1);

  if (error) throw error;
  if (!data || data.length === 0) throw new Error(`No unused puzzles for ${dbTheme}`);

  const { id, puzzle_data } = data[0];

  // Mark it used by setting date_used = today
  await supabase
    .from('puzzles')
    .update({ date_used: today })
    .eq('id', id);

  return puzzle_data;
}

// ──────────────────────────────────────────────────────────────────────────────────────────────────────
// 🌐 displayPuzzle with fallback to defaults
// ────────────────────────────────────────────────────
const DB_THEMES = ['theme-lightning', 'theme-padres'];
async function displayPuzzle(theme) {
  let puzzleText;

  if (DB_THEMES.includes(theme)) {
    try {
      puzzleText = await fetchPuzzleFromSupabase(theme);
    } catch {
      puzzleText = getDailyPuzzle(theme);
    }
  } else {
    puzzleText = getDailyPuzzle(theme);
  }

  const shift     = getDailyKey();
  const encrypted = caesarEncrypt(puzzleText, shift);
  document.getElementById('daily-puzzle').textContent = encrypted;
}

// ─────────────────────────────────────────────────
// 🎨 Theme-specific labels, emoji, button text, cursors
// ─────────────────────────────────────────────────
const themeTextMap = {
  'theme-standard': 'Standard',
  'theme-space':    'Space',
  'theme-ocean':    'Ocean',
  'theme-science':  'Science',
  'theme-forest':   'Forest',
  'theme-animal':   'Animal',
  'theme-lightning':'Tampa Bay Lightning',
  'theme-padres':   'San Diego Padres',
};

const themeEmojiMap = {
  'theme-lightning':'🥅',
  'theme-padres':   '🧢',
};

const themeSpinTextMap = {
  'theme-lightning':'🏒 GO BOLTS GO! 🏒',
  'theme-padres':   '⚾ Swing Batter Batter ⚾',
};

const themeCursorMap = {
  'theme-lightning':'assets/cursor/hockey-stick/hockey-stick.png',
  'theme-padres':   'assets/cursor/baseball-bat/baseball-bat-64px.png',
};
function updateEmoji(theme) {
  document.getElementById('emoji-center')
          .textContent = themeEmojiMap[theme] || '';
}

function updateCurveText(theme) {
  document.querySelector('.svg-curve textPath')
          .textContent = themeTextMap[theme] || 'Standard';
}

function updateSpinButton(theme) {
  document.querySelector('.spin-button')
          .textContent = themeSpinTextMap[theme] || 'Spin the Wheel';
}

function updateCursor(theme) {
  const cursorUrl = themeCursorMap[theme];
  // build the cursor value (falls back to auto)
  const cursorValue = cursorUrl
    ? `url('${cursorUrl}') 0 0, auto`
    : 'auto';

  // 1) Global page cursor
  document.body.style.cursor = cursorValue;

  // 2) Override buttons (inline style > stylesheet)
  document.querySelectorAll('button').forEach(btn => {
    btn.style.cursor = cursorValue;
  });
}

function rotateInnerRing() {
  const ring = document.querySelector('#inner-ring');
  const currentTransform = ring.getAttribute('transform') || "rotate(0, 0, 0)";
  const currentAngle = parseFloat(currentTransform.match(/rotate\(([-\d.]+),/)[1]) || 0;
  const newAngle = currentAngle + (360 / 26);
  ring.setAttribute('transform', `rotate(${newAngle}, 0, 0)`);
}

const defaultPuzzles = {
  'theme-standard': [
    'OCTOPUSES HAVE THREE HEARTS AND BLUE BLOOD',
    'BANANAS ARE BERRIES BUT STRAWBERRIES AREN\'T',
    'HONEY NEVER SPOILS ARCHAEOLOGISTS FIND IT EDIBLE',
    'WOMBAT POOP IS CUBE SHAPED TO PREVENT ROLLING',
    'SEA OTTERS HOLD HANDS WHILE SLEEPING TO AVOID DRIFTING',
  ],
  'theme-animal': [
    'A GROUP OF FLAMINGOS IS CALLED A FLAMBOYANCE',
    'ELEPHANTS ARE THE ONLY ANIMALS THAT CANNOT JUMP',
    'A SHRIMP\'S HEART IS LOCATED IN ITS HEAD',
    'KANGAROOS CANNOT WALK BACKWARD',
    'THE BLUE WHALE IS THE LARGEST ANIMAL TO EVER EXIST',
  ],
  'theme-forest': [
    'FORESTS COVER ABOUT THIRTY ONE PERCENT OF EARTH\'S LAND AREA',
    'THE AMAZON RAIN FOREST PRODUCES TWENTY PERCENT OF EARTH\'S OXYGEN',
    'MORE THAN HALF OF EARTH\'S SPECIES LIVE IN TROPICAL RAINFORESTS',
    'TREES COMMUNICATE WITH EACH OTHER THROUGH UNDERGROUND FUNGI NETWORKS',
    'SOME TREES CAN LIVE FOR THOUSANDS OF YEARS',
  ],
  'theme-ocean': [
    'THE OCEAN COVERS ABOUT SEVENTY ONE PERCENT OF EARTH\'S SURFACE',
    'MORE THAN EIGHTY PERCENT OF THE OCEAN IS UNEXPLORED',
    'THE DEEPEST PART OF THE OCEAN IS THE MARIANA TRENCH',
    'THE PACIFIC OCEAN IS THE LARGEST OCEAN ON EARTH',
    'BLUE WHALES ARE THE LARGEST ANIMALS TO EVER LIVE',
  ],
  'theme-science': [
    'WATER CAN BOIL AND FREEZE AT THE SAME TIME UNDER CERTAIN CONDITIONS',
    'LIGHTNING IS HOTTER THAN THE SURFACE OF THE SUN',
    'YOUR STOMACH GETS A NEW LINING EVERY FEW DAYS TO PREVENT DIGESTING ITSELF',
    'SOUND TRAVELS FOUR TIMES FASTER IN WATER THAN IN AIR',
    'DNA IN A SINGLE HUMAN CELL WOULD STRETCH ABOUT SIX FEET',
  ],
  'theme-space': [
    'VENUS IS HOTTER THAN MERCURY EVEN THOUGH IT IS FARTHER FROM THE SUN',
    'THE SUN APPEARS WHITE WHEN VIEWED FROM SPACE',
    'JUPITER HAS A STORM CALLED THE GREAT RED SPOT THAT HAS LASTED OVER 300 YEARS',
    'MERCURY IS THE SMALLEST PLANET IN OUR SOLAR SYSTEM',
    'SPUTNIK WAS THE FIRST MAN-MADE SATELLITE TO ORBIT EARTH',
  ],
  'theme-lightning': [
    'THE TAMPA BAY LIGHTNING WERE FOUNDED IN 1992',
    'THE TEAM\'S NICKNAME IS THE BOLTS',
    'TAMPA BAY HAS WON THREE STANLEY CUPS',
    'THE TEAM WON BACK TO BACK CHAMPIONSHIPS IN 2020 AND 2021',
    'THE TEAM\'S COLORS ARE BLUE BLACK AND WHITE',
  ],
  'theme-padres': [
    'PETCO PARK OPENED IN TWO THOUSAND FOUR',
    'THE SWINGING FRIAR USED TO BE IN THE STANDS WITH FANS',
    'THE PADRES WERE FOUNDED IN NINETEEN SIXTY NINE',
    'THE SWINGING FRIAR IS ONE OF MLB\'S FEW HUMAN MASCOTS',
    'SAN DIEGO LOVES BASEBALL',
  ],
};

const defaultSuccessMessages = {
  'theme-standard': [
    '🔥 Nailed it! You\'re on fire!',
    '💪 Correct! You\'re unstoppable!',
    '👍 Well done! Keep it up!',
    '💥 Boom! That\'s the right answer!',
    '👏 Nice job! You\'ve got this down!',
  ],
  'theme-space': [
    '🌌 Stellar work! You’re out of this world!',
    '🚀 Mission accomplished! Cipher decoded.',
    '🌠 Shooting star! You nailed it.',
    '🪐 Orbiting success! Great job.',
    '👨‍🚀 Astronaut-level brilliance! Well done.',
  ],
  'theme-ocean': [
    '🌊 Wave of success! You crushed it.',
    '🐚 Shell yeah! You solved it.',
    '🐳 Whale done! That’s the right answer.',
    '🦀 Crabby no more! You nailed it.',
    '🐠 Swimming in success! Great job.',
  ],
  'theme-science': [
    '🧪 Experiment successful! You solved it.',
    '🔬 Microscopic precision! Well done.',
    '🧬 DNA-level brilliance! Great job.',
    '⚛️ Atomic success! You nailed it.',
    '🥼 Lab coat worthy! Cipher cracked.',
  ],
  'theme-forest': [
    '🌲 Tree-mendous work! You solved it.',
    '🍃 Leaf it to you! Great job.',
    '🦉 Wise as an owl! You nailed it.',
    '🐿️ Squirrel-level focus! Well done.',
    '🌳 Rooted in success! Cipher cracked.',
  ],
  'theme-animal': [
    '🐾 Paws-itively brilliant! You solved it.',
    '🦁 Roaring success! Great job.',
    '🐒 Monkeying around? Not you! Well done.',
    '🐘 Elephant-level memory! You nailed it.',
    '🦊 Foxy thinking! Cipher cracked.',
  ],
  'theme-lightning': [
    '⚡ Bolts strike again! You nailed it!',
    '🧊 Ice in your veins! Clutch solve!',
    '🥅 Vasy would give you the glove tap!',
    '🚨 Goal horn blaring! You crushed it!',
    '🌩️ Thunderstruck! Another puzzle conquered!',
  ],
  'theme-padres': [
    '💥 It’s outta here! Home run!',
    '📣 The crowd goes wild! You nailed it!',
    '🧒 Atta kid! Great read on that cipher.',
    '⚾ Like Tony Gwynn in the clutch — perfect!',
    '🕵️‍♂️ Cipher cracked. The Friar approves.',
  ],
};

function getPuzzleForTheme(theme) {
  return defaultPuzzles[theme] || defaultPuzzles['theme-standard']; // Fallback to 'theme-standard'
}

function getSuccessMessagesForTheme(theme) {
  return defaultSuccessMessages[theme] || defaultSuccessMessages['theme-standard']; // Updated
}

function getDailyPuzzle(theme) {
  const puzzles = getPuzzleForTheme(theme);
  const today = new Date().toISOString().slice(0, 10); // Get today's date as a string
  let hash = 0;

  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }

  const puzzleIndex = Math.abs(hash % puzzles.length);
  return puzzles[puzzleIndex];
}

function getDailyKey() {
  const todayStr = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (hash % 25) + 1; // Ensure this returns a valid shift value
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

function autoSizeInputToPuzzle(theme) {
  const input = document.getElementById('user-answer');
  if (!input) {
    return;
  }

  // Get puzzles for the selected theme
  const puzzles = getPuzzleForTheme(theme);
  if (!puzzles || puzzles.length === 0) {
    return;
  }

  // Calculate today's puzzle based on the date
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = today.charCodeAt(i) + ((hash << 5) - hash);
  }
  const puzzleIndex = Math.abs(hash % puzzles.length);
  const todayPuzzle = puzzles[puzzleIndex];

  // Calculate the width based on the puzzle length
  const answerLength = todayPuzzle.length;
  const width = Math.max(250, answerLength * 8);
  input.style.width = `${width}px`;
}

function checkAnswer() {
  const input = document.getElementById('user-answer').value.trim().toUpperCase();
  const theme = document.body.className;
  const todayPuzzle = getDailyPuzzle(theme);
  const feedbackElement = document.getElementById('feedback-reaction');

  // Clear any previous animation styles
  feedbackElement.style.animation = '';
  void feedbackElement.offsetWidth; // Force reflow to restart animations

  if (input === todayPuzzle) {
    // Play success sound
    const successAudio = document.getElementById('theme-success-sound');
    successAudio.play();

    const successMessages = getSuccessMessagesForTheme(theme);
    const randomSuccess = successMessages[Math.floor(Math.random() * successMessages.length)];
    feedbackElement.innerHTML = randomSuccess;
    feedbackElement.style.color = "#ffffff";
    feedbackElement.style.display = "block";
    feedbackElement.style.animation = 'popEffect 0.5s ease-out forwards';

    // Reset popup visibility timer
    if (window._feedbackTimer) {
      clearTimeout(window._feedbackTimer);
    }
    window._feedbackTimer = setTimeout(() => {
      feedbackElement.style.display = "none";
    }, 3000);
  } else {
    // Play wrong answer sound
    playWrongAnswerAudio();

    feedbackElement.innerHTML = "❌ Not quite. Try again!";
    feedbackElement.style.color = "#c0392b";
    feedbackElement.style.display = "block";
    feedbackElement.style.animation = 'shakeEffect 0.5s ease-out forwards';

    // Reset error visibility timer
    if (window._feedbackTimer) {
      clearTimeout(window._feedbackTimer);
    }
    window._feedbackTimer = setTimeout(() => {
      feedbackElement.style.animation = '';
      feedbackElement.style.display = "none";
    }, 2000);
  }
}

// Theme Panel Functionality
const themeTag = document.getElementById('themeTag');
const themePanel = document.getElementById('themePanel');
const themeOptions = document.querySelectorAll('.theme-option');
const closeThemePanel = document.getElementById('close-theme-panel'); // Updated reference

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

    // Update puzzle and success messages
    displayPuzzle(theme).catch(console.error);

    updateThemeAudio(theme);
    autoSizeInputToPuzzle(theme);

+   // ✨ New: theme-specific UI tweaks
+   updateEmoji(theme);
+   updateCurveText(theme);
+   updateSpinButton(theme);
+   updateCursor(theme);

    closePanelFunction();
  });
});

// Updated to reference close-theme-panel
closeThemePanel.addEventListener('click', closePanelFunction);

window.addEventListener('DOMContentLoaded', () => {
  const defaultTheme = 'theme-standard';
  document.body.className = defaultTheme;
  localStorage.setItem('selectedTheme', defaultTheme);

  displayPuzzle(defaultTheme);
  displayCipherKey();
  autoSizeInputToPuzzle(defaultTheme);

+ // ✨ Run your new UI updates immediately
+ updateEmoji(defaultTheme);
+ updateCurveText(defaultTheme);
+ updateSpinButton(defaultTheme);
+ updateCursor(defaultTheme);
});


window.addEventListener('resize', adjustPanelPosition);
window.addEventListener('load', adjustPanelPosition);

// Close button for the How to Play Modal
const closeInfoModalBtn = document.getElementById('close-info-modal');
closeInfoModalBtn.addEventListener('click', () => {
  const infoModal = document.getElementById('info-modal');
  infoModal.style.display = 'none'; // Hide the modal
});

document.getElementById('close-info-modal').onclick = () => {
  document.getElementById('info-modal').style.display = 'none';
};

// Optional: Close the How to Play Modal when clicking outside of it
window.addEventListener('click', (event) => {
  const infoModal = document.getElementById('info-modal');
  if (event.target === infoModal) {
    infoModal.style.display = 'none';
  }
});

function updateThemeAudio(theme) {
  const successAudioElement = document.getElementById('theme-success-sound');
  const successAudioSource = document.getElementById('theme-success-audio-source');

  const themeAudioMap = {
    'theme-standard': [
      'assets/audio/standard/correct-answers/success.mp3',
      'assets/audio/standard/correct-answers/success2.mp3',
      'assets/audio/standard/correct-answers/success3.mp3',
    ],
    'theme-padres': [
      'assets/audio/padres/correct-answers/cheer.mp3',
    ],
    'theme-lightning': [
      'assets/audio/lightning/correct-answers/horn.mp3',
    ],
  };

  const correctAnswerAudio = themeAudioMap[theme] || themeAudioMap['theme-standard'];
  const randomCorrectAudio = correctAnswerAudio[Math.floor(Math.random() * correctAnswerAudio.length)];

  // Set the audio source for success sounds
  successAudioSource.src = randomCorrectAudio;
  successAudioElement.load();
}

function playWrongAnswerAudio() {
  const wrongAudioElement = document.getElementById('theme-wrong-sound');
  const wrongAudioSource = document.getElementById('theme-wrong-audio-source');

  const wrongAnswerAudio = [
    'assets/audio/wrong-answers/No.mp3',
    'assets/audio/wrong-answers/Try again.mp3',
  ];

  const randomWrongAudio = wrongAnswerAudio[Math.floor(Math.random() * wrongAnswerAudio.length)];

  // Set the audio source for wrong answers
  wrongAudioSource.src = randomWrongAudio;
  wrongAudioElement.load();
  wrongAudioElement.play();
}

window.onload = function () {

  displayCipherKey(); // Ensure this is called
  displayPuzzle(savedTheme); // Display the puzzle
  autoSizeInputToPuzzle(savedTheme); // Adjust input size

  document.getElementById('info-btn').onclick = () => {
    document.getElementById('info-modal').style.display = 'flex';
  };

  document.getElementById('close-info-modal').onclick = () => {
    document.getElementById('info-modal').style.display = 'none';
  };

  window.onclick = function (e) {
    const modal = document.getElementById('info-modal');
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  };
};
