Fan-Made Demo, Non-Commercial Project.

Inspired by Elden Ring & PVZ & Berserk.

# Zombie Invasion: Infinite Souls

The blessing of the Golden Tree descends upon the lawn, and monsters from the Borderlands erode it wave after wave. Defend your lines or challenge your limits in Endless Mode.

## Background Setting: The power of Borderlands has torn apart dimensions, and the forces of the Dark Ages have invaded the world of Plants and Zombies.

Players must deploy warrior companions on the battlefield, using Golden Tree Blossoms to build defenses against the zombie horde wielding Borderlands weapons.

## Quick Start

- Simply open `index.html` in your browser to play (purely front-end, no back-end required).

- After entering the page, select a mode (Survival / Test), click the grid to summon warriors, and click to collect falling Golden Tree Blossoms.

## Game Modes

- **Survival Mode**: Standard 10 waves preset followed by Endless Mode. Completing the mode unlocks higher difficulties and four times Golden Tree Blossom production.

- **Test Mode**: Unlimited Golden Tree Blossoms, no cooldown, all zombie types spawn within one wave, suitable for testing and experiencing special effects. ## Rounds and Resource Rules

- **Waves**: Default 10 waves; automatically switches to endless mode upon completion. Higher waves result in stronger zombies. Completing a wave rewards Golden Tree Flowers according to the configuration.

- **Golden Tree Flowers**: Base cost 50; drops approximately every 5 seconds (25 points), Melina produces 25 points every 24 seconds, Melina's output four times after wave 10.

- **Summoning and Cooldown**: Costs Golden Tree Flowers and is subject to single-card cooldown (cost and cooldown are ignored in test mode). Turtle Wizard can grant shields to existing warriors.

- **Victory/Defeat**: Defeat occurs when zombies reach the left side; proceed to the next wave after clearing a wave with no surviving zombies; in test mode, "test complete" is determined after generating the configured zombies.

## Warrior Companions (Attributes and Characteristics)

Sunflower (Melina): Economic Core;
Peashooter: Basic Ranged Shot;
Repeater (Forge Knight): Ranged Double Shot, Shield Special Attack activated at ⅔ HP, Sword Special Attack activated at ⅓ HP;
Snowpea (Rani): The freezing attack has a slowing effect. When health is halved, an enhanced freezing attack is launched. Upon death, the charm ring is activated to control three enemy warriors;
Torchwood (Golden Tree): Fire Enhancement;
Cherry Bomb (Midra): Instant high-damage explosion with a 1.5-tile radius;
Spikeweed(Black Knife Tiche): Assassin Master, easily dodges normal attacks, the only warrior who can dodge Crimson Corruption attacks, triggers a high-damage single-enemy attack upon death;
Wallnut(Pot Boy): Meat shield;
Gatlingpea(Maliketh): Ranged 4-shot burst; when health drops to 1/3, a random lava attack is triggered; when health drops to 2/3, a straight-line lava roar attack is triggered.
Pumpkin(Pope Turtle): Shield, worn over an existing warrior, with independent health;
Shovel(Blessing): Recalls a warrior;

## Hostile Zombies (Attributes and Behaviors)

Normal Zombie: Basic melee attack;
Football Zombie (Radagon): Triggers a golden aura ranged attack at half health;
Knight Zombie (Tree Sentinel): Triggers a leaping slash attack in melee and jumps over opponents;
Swordsman Zombie (Guts): Gains a continuous berserk buff by continuously killing warriors in melee combat; triggers a super-sized Dragon Slayer attack at half health;
Bungee Zombie (Godrick): Arrives on a flying dragon, randomly abducted a warrior, and then retreated.;
Gargantuar Zombie (Radahn): Triggers a lightning shockwave at half health, damaging both warriors and zombies;
Valkyrie Zombie (Malenia): Triggers a super-long-range piercing attack in melee; triggers three "Crimson Corruption" explosions below half health;

## Game Architecture

- **Core Loop**: `script.js` defines `PVZGame`, driving warriors, zombies, projectiles, falls, and collisions with a 10ms tick.

- **Mode Branching**: `startGame(mode)` switches between Survival and Test modes, adjusting Golden Tree Blossoms, cooldowns, and waveform configurations.

- **Waveform System**: `waveConfig` presets 10 waves (type, quantity, interval, reward), with endless mode enhancing each wave.

- **Entity System**: Warrior/Zombie data-driven (health, damage, effects), creating corresponding DOM elements and animation classes; special behaviors (jump attack, airdrop stealing, Valkyrie dash/Crimson Corruption, Rataen lightning strike, Maricus lava air raid, etc.) are all implemented in `script.js`.

## Technology Stack

- Pure Front-End: `HTML` + `CSS` + `Vanilla JS`

- Audio and Effects: Local MP3/PNG assets + CSS animations (including `special-effects.css`, `enhance-effects.css`)

- Storage: `localStorage` records the highest wave count

## File Structure

- `index.html`: Page structure, mode selection, plant cards, and HUD.

- `style.css`: Layout, grid, card and life bar styles.

- `script.js`: Core game logic, data configuration, loops, and interactions.

- Resources: PNG/MP3 files in the root directory contain plant, zombie, weapon, effect, and sound assets.

Tools: 
Code: Cursor, Codebuddy (with Claude for initialization, GPT for Small iterations, Gemini for Large-scale iterations such as test mode)
Image: Nano Banana, GPT Image
Background Music: Suno
Sound Effect: Eleven Labs
Image Cutout: Photoshop

## Open Source and Copyright

# License / Disclaimer

This project is licensed under the MIT License.

All images and other assets included in this repository are original placeholder
assets and do not contain or represent any third-party intellectual property.


