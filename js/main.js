// Progressive State Manager 
const gameState = {
  currentAct: 0, 
  completedActs: [],
  collectedItems: { leaves: 0, wood: 0 },
  isFinishedGame: false
};

// Global Scripted Dialogue Data (Member 2 typewriter inputs)
const dialogues = {
  prologue: [
    { speaker: "Moyang Tok Naning", text: "Welcome, traveler. The pathways of our ancestors on Carey Island have grown quiet... The threads of our heritage are slipping away.", avatar: "assets/images/moyang_token.png" },
    { speaker: "Moyang Tok Naning", text: "To restore our people's harmony, you must walk four ancient paths: Gathering, Weaving, Carving, and Raising our tribal rhythms.", avatar: "assets/images/moyang_token.png" },
    { speaker: "Moyang Tok Naning", text: "Let us start by venturing to our Mangrove Swamp to gather natural materials.", avatar: "assets/images/moyang_token.png" }
  ],
  act1: [
    { speaker: "Moyang Tok Naning", text: "This is our natural life line. Seek out wild Pandanus leaves and the dense, sacred Nyireh Batu wood from our wet soil.", avatar: "assets/images/moyang_token.png" }
  ],
  act2: [
    { speaker: "Elder Weaver", text: "Ah, you bring pandanus. Now, watch patiently. Soften, dye, and interlace them—follow the patterns to craft the ceremonial headband.", avatar: "assets/images/elder_weaver.png" }
  ],
  act3: [
    { speaker: "Moyang Tok Naning", text: "Let us make the spirits visible. Pick up your tools at the workbench and carve the ancestral facial spirit masks to connect our history.", avatar: "assets/images/moyang_token.png" }
  ],
  act4: [
    { speaker: "Moyang Tok Naning", text: "Look upon Carey Island at dusk. Wear your mask and head band proudly. Let your movements synchronize with the heartbeat of the jongkong drums!", avatar: "assets/images/moyang_token.png" }
  ],
  ending: [
    { speaker: "Moyang Tok Naning", text: "The community spirit awakens once more! Look what your hands and heart have brought back to life.", avatar: "assets/images/moyang_token.png" },
    { speaker: "Moyang", text: "Remember, our living history continues beyond these virtual scenes. Visit Carey Island’s Mah Meri Cultural Village to experience this together.", avatar: "assets/images/moyang_token.png" }
  ]
};

let dialogueSequence = [];
let dialogueIndex = 0;
let typewriterTimer = null;
let currentActiveView = "title-screen";
let audioEnabled = false;

// SOUND SYSTEM (Web audio API fallback)
const bgm = document.getElementById('bgm-player');
const clickSound = document.getElementById('sfx-click');
const spiritSound = document.getElementById('sfx-spirit');

// Wait for the DOM to load before attaching event listeners
document.addEventListener("DOMContentLoaded", () => {
  const bgVideo = document.getElementById('bg-video');
  const startBtn = document.getElementById('btn-start-invisible');

  if (bgVideo && startBtn) {
    // Listen for the video to finish playing
    bgVideo.addEventListener('ended', () => {
      // Remove the 'hidden' class to make the button clickable
      startBtn.classList.remove('hidden');
    });
  }
});

document.getElementById('btn-audio-toggle').addEventListener('click', () => {
  audioEnabled = !audioEnabled;
  if (audioEnabled) {
    bgm.play().catch(e => console.log("Audio waiting for touch event..."));
    document.getElementById('btn-audio-toggle').innerText = "🔊 Sound On";
  } else {
    bgm.pause();
    document.getElementById('btn-audio-toggle').innerText = "🔇 Muted";
  }
});

function playSFX(clip) {
  if (audioEnabled && clip) {
    clip.currentTime = 0;
    clip.play();
  }
}

// ROUTING & SCENE SWITCHING
function showView(viewId) {
  playSFX(clickSound);
  document.querySelectorAll('.view').forEach(view => {
    view.classList.add('hidden');
  });
  const nextView = document.getElementById(viewId);
  nextView.classList.remove('hidden');
  currentActiveView = viewId;

  // Toggle HUD display conditions
  if (viewId === "title-screen") {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('btn-map').classList.add('hidden');
  } else {
    document.getElementById('hud').classList.remove('hidden');
    if (viewId === "map-screen") {
      document.getElementById('btn-map').classList.add('hidden');
    } else {
      document.getElementById('btn-map').classList.remove('hidden');
    }
  }
}

function startGame() {
  showView('map-screen');
  // Auto Start Overworld Prologue Dialogue
  startDialogueSeq(dialogues.prologue, () => {
    // Show map after initial speaking, highlight Act 1
    document.getElementById('quest-text').innerText = "Head to the Mangrove Swamp";
  });
}

function returnToMap() {
  showView('map-screen');
}

// MAP STATE CONTROLS
function trySelectAct(actNum) {
  if (actNum === 1 || gameState.completedActs.includes(actNum - 1)) {
    gameState.currentAct = actNum;
    startActIntro(actNum);
  } else {
    alert("This location on the ancestor path is still quiet. Complete prior parts first!");
  }
}

function startActIntro(actNum) {
  let dialogueData = dialogues[`act${actNum}`];
  startDialogueSeq(dialogueData, () => {
    launchMiniGame(actNum);
  });
}

function launchMiniGame(actNum) {
  showView('game-stage-screen');
  const miniGameTitle = document.getElementById('mini-game-title');
  const mockText = document.querySelector('#game-content-mock p');

  if (actNum === 1) {
    miniGameTitle.innerText = "Act I: Mangrove Swamps (Gathering)";
    mockText.innerText = "Guide around with arrow keys / tap items to harvest wild Pandanus leaves and Nyireh wood.";
  } else if (actNum === 2) {
    miniGameTitle.innerText = "Act II: Weaver's Hut (Headband Weaving)";
    mockText.innerText = "Interlace natural and dyed split fibers in the checker pattern accurately!";
  } else if (actNum === 3) {
    miniGameTitle.innerText = "Act III: Carver's Bench (Spirit Mask)";
    mockText.innerText = "Chisel out the traditional contours to reveal standard ancestral expression features.";
  } else if (actNum === 4) {
    miniGameTitle.innerText = "Act IV: Ceremonial Grounds (Tarian Jo'oh)";
    mockText.innerText = "Strike steps matching rhythm points at dusk alongside the standard tribal community dancers!";
  }
}

// Simulates progress when player completes (Member 1 triggers completion callback)
function simulateGameComplete() {
  playSFX(spiritSound);
  const act = gameState.currentAct;
  if (!gameState.completedActs.includes(act)) {
    gameState.completedActs.push(act);
  }
  
  // Transition unlocking sequences
  if (act === 4) {
    startDialogueSeq(dialogues.ending, () => {
       showView('map-screen');
       openPortal(); // Display real-world tour calling dialog
    });
  } else {
    // Unlock and prompt returning to mapping hub
    gameState.currentAct = act + 1;
    updateMapPins();
    showView('map-screen');
    document.getElementById('quest-text').innerText = `Completed Act ${act}. Go to Act ${act + 1}!`;
  }
}

function updateMapPins() {
  const acts = [1, 2, 3, 4];
  acts.forEach(num => {
    const pin = document.getElementById(`pin-act${num}`);
    pin.className = "map-pin";
    if (gameState.completedActs.includes(num)) {
      pin.classList.add("completed");
    } else if (gameState.completedActs.length === (num - 1)) {
      pin.classList.add("active");
    } else {
      pin.classList.add("locked");
    }
  });
}

// TYPEWRITER ENGINE
function startDialogueSeq(seq, callback) {
  dialogueSequence = seq;
  dialogueIndex = 0;
  document.getElementById('dialogue-overlay').classList.remove('hidden');
  showDialogueLine(callback);
}

function showDialogueLine(callback) {
  if (dialogueIndex >= dialogueSequence.length) {
    document.getElementById('dialogue-overlay').classList.add('hidden');
    if (callback) callback();
    return;
  }
  
  const curLine = dialogueSequence[dialogueIndex];
  document.getElementById('dialogue-speaker').innerText = curLine.speaker;
  document.getElementById('dialogue-avatar-img').src = curLine.avatar;

  // Perform smooth Character Animation effect 
  const textField = document.getElementById('dialogue-textbox');
  textField.innerHTML = "";
  
  let i = 0;
  if (typewriterTimer) clearInterval(typewriterTimer);

  typewriterTimer = setInterval(() => {
    if (i < curLine.text.length) {
      textField.innerHTML += curLine.text.charAt(i);
      i++;
    } else {
      clearInterval(typewriterTimer);
    }
  }, 25); // typing speed logic
}

function skipDialogue() {
  document.getElementById('dialogue-overlay').classList.add('hidden');
  dialogueIndex = dialogueSequence.length;
}

function nextDialogue() {
  dialogueIndex++;
  showDialogueLine();
}

// DRAWER/MODALS POPUPS
function openArchive() { showModal('archive-modal'); }
function closeArchive() { closeModal('archive-modal'); }
function openPortal() { showModal('portal-modal'); }
function closeModal() { closeModal('portal-modal'); }

function showModal(id) {
  playSFX(clickSound);
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function switchMuseumTab(tabKey) {
  // Toggle historical state displays
  document.querySelectorAll('.museum-tabs button').forEach(b => b.classList.remove('active'));
  if (tabKey === 'history') {
     document.getElementById('tab-real').classList.add('active');
  } else {
     document.getElementById('tab-myth').classList.add('active');
  }
}