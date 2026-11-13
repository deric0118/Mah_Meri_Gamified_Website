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
  const m = (text, pose) => ({ speaker: MOYANG, text: text, pose: pose || 'speak' });

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

    /* ------------------------------ Dialogue ------------------------------ */
    dialogues: {
      prologue: [
        m('Welcome, traveller, to Pulau Carey. I am Moyang Tok Naning, a spirit of the ancestors. The pathways of the Mah Meri, the People of the Forest, have grown quiet.'),
        m('Hari Moyang, our Ancestor\'s Day, is near. But the ceremonial crafts we offer to the spirits have been lost, and the threads of our heritage are slipping away.'),
        m('Walk four ancient paths with me: Gathering, Weaving, Carving, and the Dance. Each one restores a piece of our celebration.'),
        m('Begin at the Mangrove Swamp. Tap the glowing marker on the map.', 'stand')
      ],

      act1: [
        m('Before we craft, we must ask the forest. Gather the coastal pandanus leaves for weaving, and look near the roots for fallen Nyireh Batu wood.'),
        m('Take only what nature provides: three pandanus leaves and two pieces of wood. Look closely, they hide among the roots.', 'stand')
      ],
      act1_outro: [
        m('The mangroves have been generous. For generations our people have lived from these coasts and forests as fishermen, gatherers and craftspeople.'),
        m('Bring the pandanus to the Weaver\'s Hut.', 'stand')
      ],

      act2: [
        m('In the Weaver\'s Hut, pandanus leaves are softened, dried, split into strips and dyed.'),
        m('Interlock the natural and dyed strips to form the kelarai motif. First, a Tempok to guard your spirit, then a Sungu basket to hold our offerings.', 'stand')
      ],
      act2_switch: [
        m('The Tempok is finished! Now the Sungu basket. Its thorny points protect the rice seeds. This pattern also uses a dark-dyed strip.')
      ],
      act2_outro: [
        m('Beautiful. Kelarai patterns are more than decoration: they welcome guests and protect the harvest.'),
        m('Now take the Nyireh Batu wood to the Carver\'s Bench.', 'stand')
      ],

      act3: [
        m('Mah Meri carvers are known around the world. Every figure tells the story of a spirit: of the forest, the sea, or our ancestors.'),
        m('First, learn the carvings. Find the matching pairs on the bench. Then we will release a spirit from the wood.', 'stand')
      ],
      act3_chisel: [
        m('You know the carvings now. Take up the pahat, the carver\'s chisel.'),
        m('Do not force the wood. Drag across the block to chisel gently, and release the spirit waiting inside.', 'stand')
      ],
      act3_outro: [
        m('Moyang Harimau Berantai, the Chained Tiger, stands awake again.'),
        m('Everything is ready. Join our people at the Ceremonial Fire for the Tarian Jo\'oh.', 'stand')
      ],

      act4: [
        m('The crafts are ready! The dancers wear the carved masks and woven headbands, and the tuntung bamboo stampers are calling.'),
        m('Strike the tuntung to the rhythm of the Tarian Jo\'oh. Fill the Spirit Harmony before the song ends!', 'stand')
      ],

      ending: [
        m('Listen! The ancestors are dancing with us. The spirit of the community awakens once more.'),
        m('Everything you gathered, wove and carved now rests in the Spirit Archive. Open the Museum to learn the real history behind each piece.'),
        m('Remember: our heritage is living, not only virtual. Visit the Mah Meri on Pulau Carey and support the artisans who keep these crafts alive.', 'stand')
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
        url: 'https://www.google.com/search?q=Mah+Meri+handicraft+Pulau+Carey+buy'
      },
      {
        icon: '🛶', title: 'Book a Pulau Carey Tour',
        text: 'Visit the Mah Meri Cultural Village on Pulau Carey, Selangor, to watch carvers and weavers at work and see the dances live.',
        cta: 'Open in Google Maps',
        url: 'https://www.google.com/maps/search/?api=1&query=Mah+Meri+Cultural+Village+Pulau+Carey'
      },
      {
        icon: '🌱', title: 'Donate to Preservation',
        text: 'Support organisations that protect Orang Asli heritage, land rights and education for the next generation of artisans.',
        cta: 'Find preservation groups',
        url: 'https://www.google.com/search?q=Orang+Asli+Mah+Meri+heritage+preservation+donate'
      }
    ]
  };
})();
