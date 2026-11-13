/* =========================================================================
   ASSETS: every image / video path used by the game, in one place.
   Keep the exact filename case (.PNG vs .png). Local Windows servers ignore
   case, but GitHub Pages / Netlify / Vercel (Linux) do not.
   ========================================================================= */
(function () {
  const IMG = 'assets/images/';
  const p = (path) => encodeURI(IMG + path);

  const G1 = 'Game 1 Collect Material/';
  const G2 = 'Game 2 Weaving/';
  const G3 = 'Game 3 Card Match Carving/';
  const G4 = 'Game 4 Rhythm Game/';

  window.ASSETS = {
    title: {
      video: p('mainpage_video.mp4'),
      photo: p('mainpage_pic.jpg')
    },
    map: {
      image: p('map_plain.jpg'),
      labelled: p('map.jpg'),
      video: p('Essential/bg_map.mp4')
    },
    moyang: {
      speak: p('Essential/moyang_speaks_1.png'),
      stand: p('Essential/moyang_stands_1.png'),
      stand2: p('Essential/moyang_stands_2.png')
    },
    ui: {
      panel: p('Essential/ui_wood_panel.png'),
      arrow: p('Essential/ui_wood_button.png'),
      table: p('Essential/bg_table.PNG')
    },
    act1: {
      bg: p(G1 + 'bg_mangroves.png'),
      video: p(G1 + 'bg_mangroves.mp4'),
      leaves: [1, 2, 3].map((n) => p(G1 + 'leaf_padanus_' + n + '.png')),
      wood: [1, 2].map((n) => p(G1 + 'wood_nyireh_' + n + '.png'))
    },
    act2: {
      bg: p(G2 + 'bg_weavers_hut.png'),
      video: p(G2 + 'bg_weavers_hut.mp4'),
      tempok: p(G2 + 'game_pandanus.png'),
      sungu: p(G2 + 'game_basket.png')
    },
    act3: {
      table: p('Essential/bg_table.PNG'),
      cardBack: p(G3 + 'card_back.PNG'),
      carving: p(G3 + 'game_carving.PNG'),
      cards: {
        fish: p(G3 + 'card_fish.PNG'),
        frogs: p(G3 + 'card_frogs.PNG'),
        lintah: p(G3 + 'card_lintah.PNG'),
        man: p(G3 + 'card_man.PNG'),
        mask: p(G3 + 'card_mask.PNG'),
        skeleton: p(G3 + 'card_skeleton.PNG'),
        snake: p(G3 + 'card_snake.PNG'),
        shell: p(G3 + 'card_something.PNG')
      }
    },
    act4: {
      bg: p(G4 + 'tarian_jooh.jpg'),
      tuntung: [1, 2, 3].map((n) => p(G4 + 'tuntog_' + n + '.png'))
    }
  };
})();
