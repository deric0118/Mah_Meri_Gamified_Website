/* =========================================================================
   CONTENT: all player-facing text (dialogue, museum, folklore, portal).
   Writers (Member 3) can edit this file without touching game logic.
   Sources: team plan PDF ("Spirit of the Mangroves") history section.
   TODO Member 3: run the cultural-accuracy review on every line marked
   "verify", and add real artisan photos / official links.
   ========================================================================= */
(function () {
  const A = window.ASSETS;
  const MOYANG = 'Moyang Tok Naning';

  // Helper: a dialogue line spoken by Moyang
  const m = (text, pose, audioPath) => ({ speaker: MOYANG, text: text, pose: pose || 'speak', audio: audioPath });

  window.CONTENT = {
    actNames: {
      1: 'The Mangrove Swamp',
      2: "The Weaver's Hut",
      3: "The Carver's Bench",
      4: 'The Ceremonial Fire'
    },

    actTitles: {
      1: 'Act I: The Call of the Mangroves',
      2: 'Act II: Weaving the Welcome',
      3: 'Act III: Awakening the Wood',
      4: 'Act IV: The Spirits Dance'
    },

    quests: {
      1: 'Head to the Mangrove Swamp',
      2: "Bring the pandanus to the Weaver's Hut",
      3: "Take the Nyireh Batu wood to the Carver's Bench",
      4: 'Join the Tarian Jo\'oh at the Ceremonial Fire',
      done: 'Journey complete: explore the Spirit Archive'
    },

    lockedMessage: function (n) {
      return 'This path is still quiet. Finish ' + window.CONTENT.actNames[n - 1] + ' first.';
    },

    // Ambient soundscape per screen (see audio.js)
    ambience: { map: 'map', 1: 'mangrove', 2: 'hut', 3: 'bench', 4: 'fire' },

    /* ------------------------------ Cutscene subtitles ------------------------------ */
    // Each string is one on-screen caption. Captions are spread across the
    // video automatically (longer captions stay up longer), so keep each one
    // to roughly one or two lines.
    cutsceneSubtitles: {
      // One array per video, in the same order as ASSETS.cutscenes.opening.
      opening: [
        [ // opening_1.mp4
          'Long ago, on Hari Moyang, our Ancestors’ Day,',
          'our village danced as one, honoring the spirits who guide us,',
          'celebrating life, unity, and heritage under the golden sun.'
        ],
        [ // opening_2.mp4
          'Time moves fast. The fires burn lower, the songs grow quiet.',
          'When a culture fades, a piece of our soul goes silent with it.'
        ],
        [ // opening_3.mp4
          'But heritage does not truly die, it waits to be remembered.',
          'Help me revive the spirit of Hari Moyang before the echoes fade forever.'
        ]
      ],

      // The cutscene that plays after each act's mini-game is finished
      // (ASSETS.cutscenes.actEnd).
      actEnd: {
        1: [ // Swamp
          'Great job, my child. Now, let’s head back before it gets dark.'
        ],
        2: [ // Hut
          'Fascinating, you have done well, my child.'
        ],
        3: [ // Carver
          'The beautiful Moyang Harimau Berantai,',
          'WHAT!? For me?…',
          '…my child, thank you.'
        ],
        4: [ // Ceremonial Fire
          'The spirit of the ancestors, the community awakens once more.',
          'You’ve saved Hari Moyang, thank you so much, my child.'
        ]
      }
    },

    /* ------------------------------ Dialogue ------------------------------ */
    // act1..act4 play inside the game scene when the act opens
    // (see SCENE_INTRO_ACTS in main.js).
    dialogues: {
      prologue: [
        m('Welcome, my child, to Pulau Carey. I am Moyang Tok Naning, a spirit of the ancestors. They have grown quiet… The People of the Forest.', 
          'speak', 'assets/audio/prologue/prologue_1.mp3'),
        m('Hari Moyang, our Ancestor\'s Day, is near. But the threads of our heritage are slipping away, and the crafts we used to offer to the spirits have also been lost.', 
          'stand', 'assets/audio/prologue/prologue_2.mp3'),
        m('My child, you have to walk four ancient paths with me: Gathering, Weaving, Carving, and the Dance. Each to restore a piece of our celebration.', 
          'stand', 'assets/audio/prologue/prologue_3.mp3'),
        m('First, we begin at the Mangrove Swamp. Now, tap the glowing marker on the map.', 
          'stand', 'assets/audio/prologue/prologue_4.mp3')
      ],

      act1: [
        m('Before we craft, we must ask the forest. Gather the coastal pandanus leaves for weaving, and look near the roots for fallen Nyireh Batu wood.',
          'speak', 'assets/audio/act1/act1_dialogue1.mp3'),
        m('Take only what nature provides: three pandanus leaves and two pieces of wood. Look closely, they hide among the roots.', 
          'stand', 'assets/audio/act1/act1_dialogue2.mp3')
      ],
      act1_outro: [
        m('The mangroves have been generous. For generations our people have lived from these coasts and forests as fishermen, gatherers and craftspeople.',
          'speak', 'assets/audio/act1/act1_outro1.mp3'
        ),
        m('Now, quickly, bring the pandanus to the Weaver\'s Hut.', 
          'stand', 'assets/audio/act1/act1_outro2.mp3')
      ],

      act2: [
        m('I have dried up the pandanus leaves and coloured them with red and black.', 
          'speak', 'assets/audio/act2/act2_dialogue1.mp3'),
        m('Interlock the natural and dyed strips to form the kelarai motif. First, a Tempok to guard your spirit, then a Sungu basket to hold our offerings.', 
          'stand', 'assets/audio/act2/act2_dialogue2.mp3')
      ],
      act2_switch: [
        m('The Tempok is finished! Now the Sungu basket. Its thorny points protect the rice seeds. This pattern also uses a dark-dyed strip.', 
          'stand', 'assets/audio/act2/act2_switch.mp3')
      ],
      act2_outro: [
        m('Kelarai patterns are more than decoration: they welcome guests and protect the harvest.', 
          'speak', 'assets/audio/act2/act2_outro1.mp3'),
        m('Now take the Nyireh Batu wood to the Carver\'s Bench.', 
          'stand', 'assets/audio/act2/act2_outro2.mp3')
      ],

      act3: [
        m('Mah Meri carvers are known around the world. Every figure tells the story of a spirit: of the forest, the sea, or our ancestors.', 
          'speak', 'assets/audio/act3/act3_dialogue1.mp3'),
        m('First, learn the carvings. Then we will release a spirit from the wood.', 
          'speak', 'assets/audio/act3/act3_dialogue2.mp3'),
        m('There are 16 cards in total, holding 8 pairs of sacred carvings. Choose two, unveil their forms, and learn the hidden knowledge of the ancestors.', 
          'stand', 'assets/audio/act3/act3_dialogue3.mp3')
      ],
      act3_chisel: [
        m('You know the carvings now. Take up the pahat, the carver\'s chisel.',
          'speak', 'assets/audio/act3/act3_chisel1.mp3'
        ),
        m('Do not force the wood. Drag across the block to chisel gently, and release the spirit waiting inside.', 
          'stand', 'assets/audio/act3/act3_chisel2.mp3')
      ],
      act3_outro: [
        m('Now that we\'ve done the carving.',
          'speak', 'assets/audio/act3/act3_outro1.mp3'),
        m('My child, you are more than ready. It\'s time to join our people at the Ceremonial Fire for the Tarian Jo\'oh.', 
          'stand', 'assets/audio/act3/act3_outro2.mp3')
      ],

      act4: [
        m('The crafts are ready! The dancers wear the carved masks and woven headbands, and the tuntung bamboo stampers are calling.',
          'speak', 'assets/audio/act4/act4_dialogue1.mp3'
        ),
        m('Strike the tuntung to the rhythm of the Tarian Jo\'oh. Fill the Spirit Harmony before the song ends!', 
          'stand', 'assets/audio/act4/act4_dialogue2.mp3')
      ],

      ending: [
        m('Everything you gathered, wove and carved now rests in the Spirit Archive. Open the Museum to learn the real history behind each piece.',
          'speak', 'assets/audio/ending/ending1.mp3'
        ),
        m('Remember: our heritage is living, not only virtual. Visit the Mah Meri on Pulau Carey and support the artisans who keep these crafts alive.', 
          'stand', 'assets/audio/ending/ending2.mp3')
      ]
    },

    /* ------------------------------ Act I ------------------------------ */
    act1Facts: {
      leaf: [
        'Pandanus (mengkuang) leaves are softened, dried and split into strips for weaving.',
        'The Mah Meri also weave with nipah palm leaves gathered along the coast.',
        'Woven leaf crafts are made for both daily life and ceremonies.'
      ],
      wood: [
        'Nyireh Batu is a dense, reddish hardwood from the mangroves, the carver\'s favourite timber.',
        'Hard Nyireh Batu wood lasts for generations, so the spirits carved in it endure.'
      ]
    },

    /* ------------------------------ Act III ------------------------------ */
    // In-game notes for each carving card. verify (Member 3)
    cards: {
      fish:     { name: 'Ikan (Fish)',         note: 'The Mah Meri are also called Orang Laut, "people of the sea". Sea creatures appear often in their carvings.' },
      frogs:    { name: 'Katak (Frogs)',       note: 'Creatures of the swamp and the rain. Carvings honour the spirits of the animals that share the mangrove.' },
      lintah:   { name: 'Lintah (Leech)',      note: 'Even the smallest wetland creatures have a place in Mah Meri carving, because every living thing has a soul.' },
      man:      { name: 'Human Figure',        note: 'Many carvings show people and ancestors, keeping the memory of the Moyang alive.' },
      mask:     { name: 'Topeng (Mask)',       note: 'Spirit masks come alive in the Tarian Topeng (Mask Dance), when performers invite ancestral spirits to the celebration.' },
      skeleton: { name: 'Skeleton Figure',     note: 'A reminder of the ancestors who have passed on, honoured each year on Hari Moyang.' },
      snake:    { name: 'Ular (Snake)',        note: 'Snakes live among the mangrove roots and appear in many spirit stories of the forest.' },
      shell:    { name: 'Siput (Sea Shell)',   note: 'A spiky shell from the shore: a symbol of the coastal life of the Mah Meri.' }
    },

    // Folklore subtitles shown while chiselling (0 / 25 / 50 / 75 / 100 %). verify (Member 3)
    folklore: [
      'The Mah Meri believe all of nature has a soul: the trees, the sea, the animals and the wind. The spirits of the ancestors are called Moyang.',
      'A carver does not invent a spirit. Elders say the spirit is already living inside the wood, and the carver\'s hands simply set it free.',
      'This is Moyang Harimau Berantai, the Chained Tiger. Elders tell that its chain binds the tiger\'s fierce power, so its strength guards the village instead of harming it.',
      'We carve from Nyireh Batu, a dense, reddish hardwood from the mangroves, strong enough to hold a spirit for generations.',
      'The spirit is free! Carvings like this are used in prayers and rituals, and shared through stories so they are never forgotten.'
    ],

    /* ------------------------------ Rewards ------------------------------ */
    rewards: {
      1: {
        title: 'Resources Gathered',
        text: '5/5 collected. Pandanus leaves and Nyireh Batu wood have been added to the Spirit Archive. The Weaver\'s Hut is now open.',
        images: [A.act1.leaves[0], A.act1.wood[0]]
      },
      2: {
        title: 'Tempok & Sungu Woven',
        text: 'Your kelarai patterns hold true. Both woven crafts rest in the Spirit Archive. The Carver\'s Bench is now open.',
        images: [A.act2.tempok, A.act2.sungu]
      },
      3: {
        title: 'The Chained Tiger Awakens',
        text: 'You matched all eight carvings and released Moyang Harimau Berantai from the wood. The Ceremonial Fire is now lit.',
        images: [A.act3.carving]
      },
      4: {
        title: 'Spirit Harmony 100%',
        text: 'The Tarian Jo\'oh is complete and the ancestors have joined the dance. The full Spirit Archive and the Support the Artisans portal are unlocked.',
        images: [A.act4.tuntung[0], A.act3.carving, A.act2.sungu]
      }
    },

    /* ------------------------------ Spirit Archive ------------------------------ */
    // act: 0 = always unlocked; otherwise unlocked when that act is completed.
    museum: [
      {
        id: 'moyang', act: 0, name: 'Moyang: The Ancestral Spirits', img: A.moyang.stand,
        history: 'The Mah Meri ("People of the Forest") are an Orang Asli people of the Senoi group. Their ancestors are linked to early Austro-Asiatic migrants who brought agriculture to the Malay Peninsula. Today most Mah Meri live in five villages on Pulau Carey, Selangor. Because they have long been coastal fishermen, they are also called Orang Laut, "people of the sea".',
        myth: 'The Mah Meri practise animism: forests, seas and every natural element possess souls. Ancestral spirits, the Moyang, are honoured every year on Hari Moyang (Ancestor\'s Day), when communities pray with shamans for blessings.'
      },
      {
        id: 'pandanus', act: 1, name: 'Pandanus Leaves', img: A.act1.leaves[0],
        history: 'Pandanus and mengkuang leaves, together with nipah palm, are gathered from the forest and the coast. The leaves are softened, dried, split into strips and often dyed before weaving into mats, baskets and ceremonial headgear.',
        myth: 'Because plants are believed to have souls, gatherers take only what they need from the forest. It is a quiet agreement between people and nature.'
      },
      {
        id: 'nyireh', act: 1, name: 'Nyireh Batu Wood', img: A.act1.wood[0],
        history: 'Nyireh Batu is a dense, reddish hardwood from the mangrove forests. Its strength and fine grain make it the traditional timber for Mah Meri masks and statues.',
        myth: 'Carvers say the spirit already lives inside the wood. Choosing the right piece of Nyireh Batu is the first step in meeting that spirit.'
      },
      {
        id: 'tempok', act: 2, name: 'Tempok & Kelarai Weave', img: A.act2.tempok,
        history: 'The tempok is a traditional, origami-like woven headgear worn during rituals. Its folded pandanus strips form kelarai: geometric motifs made by interlacing natural and dyed strips.',
        myth: 'Kelarai patterns carry meaning: some welcome guests and ancestral spirits, others protect the harvest. Wearing the tempok guards the dancer\'s spirit during ceremonies.'
      },
      {
        id: 'sungu', act: 2, name: 'Sungu Basket', img: A.act2.sungu,
        history: 'The sungu is a distinctive Mah Meri basket woven with thorn-like points. Traditionally it held and protected rice seeds.',
        myth: 'Its thorns are said to guard the seeds, and the offerings placed inside, from harm until the next harvest.'
      },
      {
        id: 'harimau', act: 3, name: 'Moyang Harimau Berantai', img: A.act3.carving,
        history: 'Mah Meri woodcarving is internationally renowned and recognised by UNESCO. Master carvers shape hardwoods and softwoods into expressive masks and statues of deities, flora, fauna and spirits, which are used in prayer rituals and storytelling.',
        myth: 'The Chained Tiger Spirit is one of the best-known Mah Meri carvings. Its chain binds a fierce power so that it protects the community. (verify: Member 3)'
      },
      {
        id: 'carvings', act: 3, name: 'Carving Motifs', img: A.act3.cards.mask, gallery: true,
        history: 'Mah Meri carvings show the living world of Pulau Carey: fish and shells from the sea; frogs, snakes and leeches from the swamp; and human and ancestral figures.',
        myth: 'Every figure is linked to a spirit. Carvings are not only art: they are used in rituals and told as stories so the spirits are remembered.'
      },
      {
        id: 'jooh', act: 4, name: 'Tarian Jo\'oh', img: A.act4.bg,
        history: 'The Tarian Jo\'oh (Jungle Dance) and the Tarian Topeng (Mask Dance) bring the masks and woven headgear to life. Dancers move to the beat of bamboo stampers (tuntung), drums and gongs during celebrations such as Hari Moyang.',
        myth: 'During the dances, masked performers playfully interact with the community to invite the ancestral spirits to join the celebration.'
      }
    ],

    /* ------------------------------ Support portal ------------------------------ */
    // TODO Member 3: replace these search links with verified official links
    // (artisan shop, cultural village booking contact, preservation NGO).
    portal: [
      {
        icon: '🧺', title: 'Purchase Authentic Crafts',
        text: 'Buy woven baskets, tempok and wood carvings made by Mah Meri artisans, so the income goes to the makers.',
        cta: 'Find artisan crafts',
        url: 'https://www.mmcv.org.my/souvenir-shop/'
      },
      {
        icon: '🛶', title: 'Book a Pulau Carey Tour',
        text: 'Visit the Mah Meri Cultural Village on Pulau Carey, Selangor, to watch carvers and weavers at work and see the dances live.',
        cta: 'View tour packages',
        url: 'https://www.mmcv.org.my/tour-packages/'
      },
      {
        icon: '📖', title: 'Learn more about Mah Meri Culture',
        text: 'Read the story of the Mah Meri people, their beliefs, carvings, weaving and dances, from the Mah Meri Cultural Village on Pulau Carey.',
        cta: 'Visit MMCV About Us',
        url: 'https://www.mmcv.org.my/about-us/'
      }
    ]
  };
})();
