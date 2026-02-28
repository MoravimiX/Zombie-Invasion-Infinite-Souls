// 植物大战僵尸游戏主类
class PVZGame {
    constructor() {
        // 获取DOM元素引用
        this.gameGrid = document.getElementById('gameGrid');           // 游戏网格容器
        this.entitiesLayer = document.getElementById('entitiesLayer'); // 实体层容器
        this.sunCountElement = document.getElementById('sunCount');     // 阳光数量显示元素
        this.currentWaveElement = document.getElementById('currentWave'); // 当前波次显示元素
        this.remainingZombiesElement = document.getElementById('remainingZombies'); // 剩余僵尸数量显示元素
        this.highestWaveElement = document.getElementById('highestWave'); // 最高波次记录显示元素
        this.gameStatus = document.getElementById('gameStatus');       // 游戏状态提示容器
        this.statusTitle = document.getElementById('statusTitle');     // 状态标题元素
        this.statusMessage = document.getElementById('statusMessage'); // 状态消息元素
        this.statusBtn = document.getElementById('statusBtn');         // 状态按钮元素
        
        // 游戏控制按钮
        this.startBtn = document.getElementById('startBtn');     // 开始游戏按钮
        this.pauseBtn = document.getElementById('pauseBtn');     // 暂停游戏按钮
        this.restartBtn = document.getElementById('restartBtn'); // 重置游戏按钮
        this.mode = 'survival'; // 默认模式
        
        // 游戏常量配置
        this.ROWS = 5;                              // 游戏网格行数
        this.COLS = 9;                              // 游戏网格列数
        this.CELL_WIDTH = 100 / this.COLS;          // 每个网格单元的宽度百分比
        this.CELL_HEIGHT = 100 / this.ROWS;         // 每个网格单元的高度百分比
        
        // 游戏状态变量
        this.gameState = 'waiting';                 // 游戏当前状态：waiting/playing/paused/victory/defeat
        this.selectedPlant = null;                  // 当前选中的植物类型
        this.selectedTool = null;                   // 当前选中的工具（如铲子）
        this.sunCount = 150;                        // 当前阳光数量
        this.currentWave = 1;                       // 当前波次
        
        // 无限波次与生存模式配置
        this.maxWave = 10;                          // 最大预设波次数
        this.survivalMode = false;                  // 是否进入生存模式
        this.highestWave = parseInt(localStorage.getItem('pvz-highest-wave') || '0'); // 从本地存储获取最高波次记录
        this.totalWaves = this.maxWave;             // 总波次数
        try {
            this.shovelUnlocked = typeof localStorage !== 'undefined' && localStorage.getItem('pvz-shovel-unlocked') === '1';
        } catch (e) {
            this.shovelUnlocked = false;
        }
        
        // 游戏网格数据结构
        this.grid = [];                             // 二维数组存储网格状态
        
        // 游戏对象数组：存储所有游戏实体
        this.plants = [];                           // 植物对象数组
        this.zombies = [];                          // 僵尸对象数组
        this.projectiles = [];                      // 子弹对象数组
        this.suns = [];                             // 阳光对象数组
        this.gatlingLavaFields = [];                // 机枪豌豆熔岩区域
        
        // 定时器和计数器
        this.gameTimer = null;                      // 主游戏循环定时器
        this.sunDropTimer = 0;                      // 阳光掉落计时器
        this.waveTimer = 0;                         // 波次计时器
        this.frameCount = 0;                        // 游戏帧计数器
        this.normalRoarTimer = 0;                   // 普通僵尸咆哮计时器（帧计数，3秒=300帧）
        this.sunflowerBoostUnlocked = false;        // 是否已解锁向日葵双倍产阳
        
        // 波次配置：定义每波的僵尸数量、生成间隔、类型和奖励
        this.waveConfig = {
            1: { zombies: 5, spawnInterval: 400, types: ['normal'], reward: 50 },
            2: { zombies: 8, spawnInterval: 350, types: ['normal', 'football'], reward: 100 },
            3: { zombies: 12, spawnInterval: 300, types: ['normal', 'football', 'swordsman'], reward: 200 },
            4: { zombies: 16, spawnInterval: 280, types: ['normal', 'football', 'swordsman', 'knight'], reward: 300 },
            5: { zombies: 20, spawnInterval: 250, types: ['normal', 'football', 'swordsman', 'knight'], reward: 300 },
            6: { zombies: 25, spawnInterval: 220, types: ['normal', 'football', 'swordsman', 'knight', 'bungee'], reward: 300 },
            7: { zombies: 30, spawnInterval: 200, types: ['normal', 'football', 'swordsman', 'knight', 'bungee'], reward: 300 },
            8: { zombies: 35, spawnInterval: 180, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar'], reward: 500 },
            9: { zombies: 40, spawnInterval: 160, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar', 'valkyrie'], reward: 800 },
            10: { zombies: 50, spawnInterval: 140, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar', 'valkyrie'], reward: 1000 }
        };
        
        // 波次相关计数器
        this.currentWaveZombies = 0;
        this.spawnedZombies = 0;
        this.zombieSpawnTimer = 0;
        
        // 植物类型数据配置
        this.plantTypes = {
            sunflower: { cost: 50, health: 100, cooldown: 750, icon: 'sunflower.png', type: 'producer', sunProduction: 25, productionInterval: 2400 },
            peashooter: { cost: 100, health: 100, cooldown: 750, icon: 'pea_shooter.png', type: 'shooter', damage: 20, shootInterval: 150 },
            repeater: { cost: 200, health: 500, cooldown: 750, icon: 'double_shooter.png', type: 'shooter', damage: 20, shootInterval: 150, projectileCount: 2 },
            snowpea: { cost: 175, health: 225, cooldown: 750, icon: 'ice_shooter.png', type: 'shooter', damage: 20, shootInterval: 150, slowEffect: true, slowDuration: 300, emergencyWeaponDamageMultiplier: 2 },
            torchwood: { cost: 175, health: 100, cooldown: 1500, icon: 'tree_stump.png', type: 'enhancer' },
            cherrybomb: { cost: 150, health: 50, cooldown: 5000, icon: 'cherry_bomb.png', type: 'explosive', damage: 200, range: 1.5 },
            spikeweed: { cost: 100, health: 100, cooldown: 750, icon: 'ground_spikes.png', type: 'ground', damage: 20, attackInterval: 150 },
            wallnut: { cost: 50, health: 400, cooldown: 3000, icon: 'wall_nut.png', type: 'defender' },
            gatlingpea: { cost: 250, health: 400, cooldown: 5000, icon: 'gatling_pea.png', type: 'shooter', damage: 20, shootInterval: 200, projectileCount: 4 },
            pumpkin: { cost: 125, health: 400, cooldown: 3000, icon: 'pumpkin_shell.png', type: 'shield' }
        };
        
        // 僵尸类型数据配置
        this.zombieTypes = {
            normal: { health: 150, speed: 0.01, damage: 20, attackInterval: 100, icon: 'zombie.png', name: '普通僵尸', specialBehavior: null, normalAttackRange: 2 },
            football: { health: 300, speed: 0.01, damage: 30, attackInterval: 120, icon: 'football_zombie.png', name: '足球僵尸', specialBehavior: 'charge', chargeSpeed: 0.03, chargeDistance: 15, hasCharged: false, normalAttackRange: 8 },
            knight: { health: 800, speed: 0.015, damage: 40, attackInterval: 150, icon: 'knight_zombie.png', name: '骑士僵尸', specialBehavior: 'jump', jumpDistance: 30, retreatDistance: 10, jumpTrigger: 1, hasJumped: false, normalAttackRange: 10 },
            swordsman: { health: 600, speed: 0.012, damage: 60, attackInterval: 150, icon: 'swordsman_zombie.png', name: '剑士僵尸', specialBehavior: 'armor', armorHits: 1, currentArmorHits: 1, killCount: 0, baseDamage: 60, baseAttackRange: 5, baseSwordSize: 1.0, hasUsedSpecialAttack: false, normalAttackRange: 5 },
            bungee: { health: 120, speed: 0, damage: 0, attackInterval: 100, icon: 'airdrop_zombie.png', name: '空投僵尸', specialBehavior: 'steal', stealDelay: 500, hasStolen: false },
            gargantuar: { health: 1000, speed: 0.008, damage: 100, attackInterval: 300, icon: 'giant_zombie.png', name: '巨人僵尸', specialBehavior: 'smash', shockwaveDamage: 50, shockwaveRange: 1.5, hasUsedSpecialAttack: false, normalAttackRange: 16 },
            valkyrie: { health: 1600, speed: 0.01, damage: 50, attackInterval: 100, icon: 'valkyrie_zombie.png', name: '女武神僵尸', specialBehavior: 'valkyrie_charge', chargeSpeed: 1.0, scarletRotChargeSpeed: 0.1, chargeDamage: 200, scarletRotThresholds: [0.5, 0.33, 0.25], scarletRotTriggered: [false, false, false], isCharging: false, isScarletRot: false, normalAttackRange: 5 }
        };
        
        this.plantCooldowns = {};
        this.audioCache = {};
        // 集中音量配置：可按文件名调整默认音量（0.0~1.0）
        this.soundVolumes = {
            'airdrop-attack.MP3': 0.3,
            'airdrop-steal.MP3': 0.4,
            'bomb.MP3': 0.8,
            'bubble-pop-click.MP3': 0.3,
            'bubble-pop-float.MP3': 0.25,
            'double-shoot.MP3': 0.45,
            'double-shield-whoosh.MP3': 0.55,
            'double_weapon_whoosh.MP3': 0.55,
            'fire-hit.MP3': 0.55,
            'football-normal-attack.MP3': 0.5,
            'football-special-attack.MP3': 0.5,
            'frozen.MP3': 0.5,
            'ice_weapon_whoosh.MP3': 0.55,
            'gatling-attack.MP3': 0.5,
            'gatling_weapon_whoosh.MP3': 0.55,
            'gatling_roar.MP3': 0.6,
            'giant-attack.MP3': 0.6,
            'giant-normal-attack.MP3': 0.5,
            'giant-special-attack.MP3': 0.65,
            'ice-shoot.MP3': 0.4,
            'knight-normal-attack.MP3': 0.5,
            'knight-special-attack.MP3': 0.5,
            'normal-hit.MP3': 0.5,
            'pea-shoot.MP3': 0.4,
            'plant_zombie_over.MP3': 0.5,
            'planting.MP3': 0.4,
            'spikes-attack01.MP3': 0.45,
            'spikes-attack02.MP3': 0.45,
            'spikes-attack03.MP3': 0.45,
            'spikes_weapon_whoosh.MP3': 0.55,
            'swordsman-normal-attack.MP3': 0.5,
            'swordsman-special-attack.MP3': 0.5,
            'valkyrie-attack.MP3': 0.5,
            'valkyrie-normal-attack.MP3': 0.5,
            'valkyrie-special-attack01.MP3': 0.5,
            'valkyrie-special-attack02.MP3': 0.5,
            'zombie-dead.MP3': 0.5,
            'zombie-eat.MP3': 0.4,
            'zombie-roar.MP3': 0.35,
            'zombie-swallow.mp3': 0.5
        };
        this.init();
    }
    
    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateDisplay();
        this.hideGameStatus();
    }
    
    createGrid() {
        this.gameGrid.innerHTML = '';
        this.grid = [];
        for (let row = 0; row < this.ROWS; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                this.gameGrid.appendChild(cell);
                this.grid[row][col] = {
                    element: cell,
                    plant: null,
                    occupied: false
                };
            }
        }
    }
    
    setupEventListeners() {
        document.querySelectorAll('.plant-card').forEach(card => {
            card.addEventListener('click', () => {
                const plantType = card.dataset.plant;
                this.selectPlant(plantType);
            });
        });
        
        this.gameGrid.addEventListener('click', (e) => {
            if (!e.target.classList.contains('grid-cell')) return;
            const row = parseInt(e.target.dataset.row);
            const col = parseInt(e.target.dataset.col);
            
            if (this.selectedTool) {
                this.useTool(row, col);
            } else if (this.selectedPlant) {
                this.plantSeed(row, col);
            }
        });
        
        this.entitiesLayer.addEventListener('click', (e) => {
            if (e.target.classList.contains('sun')) {
                this.collectSun(e.target);
            }
        });
        
        this.startBtn.addEventListener('click', () => this.showModeSelection());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => {
            // 重开游戏：如有生存BGM则停止并清理
            try {
                if (this.survivalBgm) {
                    this.survivalBgm.pause();
                    this.survivalBgm.currentTime = 0;
                    this.survivalBgm = null;
                }
            } catch (e) {}
            this.restartGame();
        });
        this.statusBtn.addEventListener('click', () => this.handleStatusButton());
        
        const survivalBtnEl = document.getElementById('survivalBtn');
        const testBtnEl = document.getElementById('testBtn');
        survivalBtnEl.addEventListener('mouseenter', () => this.playSound('bubble-pop-float.MP3'));
        testBtnEl.addEventListener('mouseenter', () => this.playSound('bubble-pop-float.MP3'));
        survivalBtnEl.addEventListener('click', () => { this.playSound('bubble-pop-click.MP3'); this.startGame('survival'); 
            // 生存模式开始后：初始化音量并循环播放 BGM
            try {
                if (!this.soundVolumes) this.soundVolumes = {};
                if (this.soundVolumes['wailing-dunes.MP3'] == null) this.soundVolumes['wailing-dunes.MP3'] = 0.25;
                if (!this.survivalBgm) this.survivalBgm = new Audio('wailing-dunes.MP3');
                this.survivalBgm.loop = true;
                this.survivalBgm.volume = this.soundVolumes['wailing-dunes.MP3'];
                this.survivalBgm.currentTime = 0;
                this.survivalBgm.play && this.survivalBgm.play();
            } catch (e) {}
        });
        testBtnEl.addEventListener('click', () => { this.playSound('bubble-pop-click.MP3');
            // 切换到非生存模式：如有生存BGM则停止并清理
            try {
                if (this.survivalBgm) {
                    this.survivalBgm.pause();
                    this.survivalBgm.currentTime = 0;
                    this.survivalBgm = null;
                }
            } catch (e) {}
            this.startGame('test'); });
    }
    
    showModeSelection() {
        const modal = document.getElementById('mode-selection-modal');
        modal.style.display = 'flex';
    }

    hideModeSelection() {
        const modal = document.getElementById('mode-selection-modal');
        modal.style.display = 'none';
    }
    
    selectPlant(plantType) {
        const card = document.querySelector(`[data-plant="${plantType}"]`);
        if (!card) return;
        
        if (plantType === 'shovel') {
            if (!this.canUseShovel() || card.classList.contains('locked')) return;
            document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
            document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('plantable', 'removable'));
            this.selectedPlant = null;
            this.selectedTool = 'shovel';
            card.classList.add('selected');
            this.highlightRemovableArea();
            return;
        }
        
        const plantData = this.plantTypes[plantType];
        if (!plantData) return;
        this.selectedTool = null;
        
        if (this.mode !== 'test') {
            if (this.sunCount < plantData.cost) return;
            if (this.plantCooldowns[plantType] && this.plantCooldowns[plantType] > 0) return;
            if (card.classList.contains('disabled') || card.classList.contains('cooling')) return;
        }
        
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('plantable', 'removable'));
        
        this.selectedPlant = plantType;
        card.classList.add('selected');
        this.highlightPlantableArea();
    }
    
    canUseShovel() {
        return this.mode === 'test' || this.shovelUnlocked;
    }
    
    highlightPlantableArea() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];
                if (!cell) continue;
                cell.element.classList.remove('removable');
                if (!cell.occupied) {
                    cell.element.classList.add('plantable');
                } else {
                    cell.element.classList.remove('plantable');
                }
            }
        }
    }
    
    highlightRemovableArea() {
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = this.grid[row][col];
                if (!cell) continue;
                cell.element.classList.remove('plantable');
                if (cell.occupied) {
                    cell.element.classList.add('removable');
                } else {
                    cell.element.classList.remove('removable');
                }
            }
        }
    }
    
    useTool(row, col) {
        if (this.selectedTool === 'shovel') {
            this.useShovel(row, col);
        }
    }
    
    useShovel(row, col) {
        if (!this.canUseShovel()) return;
        const rowData = this.grid[row];
        if (!rowData) return;
        const cell = rowData[col];
        if (!cell || !cell.plant) return;
        this.removePlant(cell.plant);
        this.highlightRemovableArea();
    }
    
    unlockShovel() {
        if (this.shovelUnlocked) return false;
        this.shovelUnlocked = true;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('pvz-shovel-unlocked', '1');
            }
        } catch (e) {}
        this.updateDisplay();
        return true;
    }
    
    plantSeed(row, col) {
        if (this.gameState !== 'playing' || !this.selectedPlant) return;
        
        const plantData = this.plantTypes[this.selectedPlant];
        if (this.mode !== 'test' && this.sunCount < plantData.cost) return;
        
        if (this.selectedPlant === 'pumpkin') {
            const existingPlant = this.grid[row][col].plant;
            if (existingPlant && existingPlant.shield) return;
            if (this.mode !== 'test') this.sunCount -= plantData.cost;
            if (existingPlant) {
                this.addPumpkinShield(existingPlant);
                this.playSound('planting.MP3');
            } else {
                this.plantNormalSeed(row, col, plantData);
                this.playSound('planting.MP3');
            }
        } else {
            if (this.grid[row][col].occupied) return;
            if (this.mode !== 'test') this.sunCount -= plantData.cost;
            this.plantNormalSeed(row, col, plantData);
            this.playSound('planting.MP3');
        }
        
        if (this.mode !== 'test') {
            this.startPlantCooldown(this.selectedPlant);
        }
        this.clearSelection();
        this.updateDisplay();
    }
    
    plantNormalSeed(row, col, plantData) {
        const plant = {
            type: this.selectedPlant,
            row: row,
            col: col,
            health: plantData.health,
            maxHealth: plantData.health,
            x: col * this.CELL_WIDTH + this.CELL_WIDTH / 2,
            y: row * this.CELL_HEIGHT + this.CELL_HEIGHT / 2,
            lastAction: 0,
            element: null,
            shield: null,
            isExploding: false,
            emergencyWeaponUsed: false,
            doubleShieldUsed: false,
            doubleWeaponUsed: false,
            snowpeaHalfTriggered: false,
            snowpeaDeathTriggered: false,
            gatlingLavaUsed: false
        };
        
        this.grid[row][col].plant = plant;
        this.grid[row][col].occupied = true;
        this.plants.push(plant);
        this.createPlantElement(plant);
        
        if (this.selectedPlant === 'cherrybomb') {
            plant.isExploding = true;
            setTimeout(() => this.explodeCherryBomb(plant), 1000);
        }
    }
    
    addPumpkinShield(plant) {
        const shieldData = this.plantTypes.pumpkin;
        plant.shield = {
            health: shieldData.health,
            maxHealth: shieldData.health,
            element: null
        };
        
        const shieldElement = document.createElement('div');
        shieldElement.className = 'plant-shield';
        const img = document.createElement('img');
        img.src = 'pumpkin_shell.png';
        img.alt = '南瓜套';
        img.style.width = '100%';
        img.style.height = '100%';
        shieldElement.appendChild(img);
        shieldElement.style.left = `${plant.x}%`;
        shieldElement.style.top = `${plant.y}%`;
        shieldElement.style.transform = 'translate(-50%, -50%)';
        shieldElement.style.opacity = '0.3';
        shieldElement.style.zIndex = '16';
        
        this.entitiesLayer.appendChild(shieldElement);
        plant.shield.element = shieldElement;
    }
    
    createPlantElement(plant) {
        const element = document.createElement('div');
        element.className = 'plant';
        const img = document.createElement('img');
        img.src = this.plantTypes[plant.type].icon;
        img.alt = plant.type;
        img.style.width = '100%';
        img.style.height = '100%';
        element.appendChild(img);
        
        element.style.left = `${plant.x}%`;
        element.style.top = `${plant.y}%`;
        element.style.transform = 'translate(-50%, -50%)';
        
        if (plant.type !== 'cherrybomb') {
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthBar.appendChild(healthFill);
            element.appendChild(healthBar);
            plant.healthBar = healthFill;
        }
        
        this.entitiesLayer.appendChild(element);
        plant.element = element;
    }
    
    startPlantCooldown(plantType) {
        const cooldownTime = this.plantTypes[plantType].cooldown;
        this.plantCooldowns[plantType] = cooldownTime;
        
        const card = document.querySelector(`[data-plant="${plantType}"]`);
        const cooldownBar = card.querySelector('.cooldown-bar');
        
        card.classList.add('cooling');
        cooldownBar.style.transform = 'scaleX(1)';
        cooldownBar.style.transition = `transform ${cooldownTime / 1000}s linear`;
        
        setTimeout(() => {
            cooldownBar.style.transform = 'scaleX(0)';
            cooldownBar.style.transition = 'transform 0.1s linear';
            card.classList.remove('cooling');
            this.plantCooldowns[plantType] = 0;
        }, cooldownTime);
    }
    
    clearSelection() {
        this.selectedPlant = null;
        this.selectedTool = null;
        document.querySelectorAll('.plant-card').forEach(c => c.classList.remove('selected'));
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('plantable', 'removable'));
    }
    
    startGame(mode) {
        this.mode = mode;
        this.sunflowerBoostUnlocked = false;
        // 生存模式背景音乐管理：根据模式启动或清理
        try {
            if (!this.soundVolumes) this.soundVolumes = {};
            if (this.soundVolumes['wailing-dunes.MP3'] == null) this.soundVolumes['wailing-dunes.MP3'] = 0.25;
            if (this.mode === 'survival') {
                if (!this.survivalBgm) this.survivalBgm = new Audio('wailing-dunes.MP3');
                this.survivalBgm.loop = true;
                this.survivalBgm.volume = this.soundVolumes['wailing-dunes.MP3'];
                this.survivalBgm.currentTime = 0;
                this.survivalBgm.play && this.survivalBgm.play();
            } else {
                if (this.survivalBgm) {
                    this.survivalBgm.pause && this.survivalBgm.pause();
                    this.survivalBgm.currentTime = 0;
                    this.survivalBgm = null;
                }
            }
        } catch (e) {}
        this.hideModeSelection();

        if (mode === 'test') {
            this.sunCount = 9999;
            this.plantCooldowns = {};
            this.waveConfig = {
                1: { 
                    zombies: 21,
                    spawnInterval: 200,
                    types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar', 'valkyrie'],
                    reward: 0,
                    testMode: true,
                    zombieCount: {
                        'normal': 3, 'football': 3, 'swordsman': 3, 
                        'knight': 3, 'bungee': 3, 'gargantuar': 3, 'valkyrie': 3
                    }
                }
            };
            this.maxWave = 1;
        } else {
            this.sunCount = 150;
            this.maxWave = 10;
            // 如果波形配置因测试模式而更改，则将其重置为默认值。
            this.waveConfig = {
                1: { zombies: 5, spawnInterval: 400, types: ['normal'], reward: 50 },
                2: { zombies: 8, spawnInterval: 350, types: ['normal', 'football'], reward: 100 },
                3: { zombies: 12, spawnInterval: 300, types: ['normal', 'football', 'swordsman'], reward: 200 },
                4: { zombies: 16, spawnInterval: 280, types: ['normal', 'football', 'swordsman', 'knight'], reward: 300 },
                5: { zombies: 20, spawnInterval: 250, types: ['normal', 'football', 'swordsman', 'knight'], reward: 300 },
                6: { zombies: 25, spawnInterval: 220, types: ['normal', 'football', 'swordsman', 'knight', 'bungee'], reward: 300 },
                7: { zombies: 30, spawnInterval: 200, types: ['normal', 'football', 'swordsman', 'knight', 'bungee'], reward: 300 },
                8: { zombies: 35, spawnInterval: 180, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar'], reward: 500 },
                9: { zombies: 40, spawnInterval: 160, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar', 'valkyrie'], reward: 800 },
                10: { zombies: 50, spawnInterval: 140, types: ['normal', 'football', 'swordsman', 'knight', 'bungee', 'gargantuar', 'valkyrie'], reward: 1000 }
            };
        }

        this.gameState = 'playing';
        this.startBtn.classList.add('hidden');
        this.pauseBtn.classList.remove('hidden');
        this.hideGameStatus();
        
        this.currentWave = 1;
        this.initializeWave();
        this.gameTimer = setInterval(() => this.gameLoop(), 10);
    }
    
    initializeWave() {
        let waveData;
        if (this.mode === 'test') {
            waveData = this.waveConfig[this.currentWave];
            this.zombieTypeCounter = {};
            waveData.types.forEach(type => {
                this.zombieTypeCounter[type] = 0;
            });
        } else if (this.currentWave <= this.maxWave) {
            waveData = this.waveConfig[this.currentWave];
        } else {
            const baseWave = this.waveConfig[this.maxWave];
            const difficultyMultiplier = 1 + (this.currentWave - this.maxWave) * 0.2;
            waveData = {
                zombies: Math.floor(baseWave.zombies * difficultyMultiplier),
                spawnInterval: Math.max(100, Math.floor(baseWave.spawnInterval * 0.9)),
                types: baseWave.types,
                reward: Math.floor(baseWave.reward * difficultyMultiplier)
            };
        }
        
        // 缓存当前波次配置，供生成器使用（无尽模式也生效）
        this.currentWaveData = waveData;

        this.currentWaveZombies = waveData.zombies;
        this.spawnedZombies = 0;
        this.zombieSpawnTimer = 0;
        this.updateDisplay();
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        this.frameCount++;
        this.updatePlants();
        this.updateZombies();
        this.updateGatlingLavaFields();
        this.handleNormalZombieRoar();
        this.updateProjectiles();
        this.updateSuns();
        this.spawnZombies();
        this.dropSun();
        this.checkCollisions();
        this.checkWaveComplete();
        this.checkGameOver();
        this.updateCooldowns();
    }
    
    updatePlants() {
        this.plants.forEach(plant => {
            const plantData = this.plantTypes[plant.type];
            
            if (plant.type === 'sunflower') {
                if (this.frameCount - plant.lastAction >= plantData.productionInterval) {
                    this.createSun(plant.x, plant.y, false);
                    plant.lastAction = this.frameCount;
                }
            } 
            else if (['peashooter', 'repeater', 'snowpea', 'gatlingpea'].includes(plant.type)) {
                if (this.frameCount - plant.lastAction >= plantData.shootInterval) {
                    if (this.hasZombieInRow(plant.row)) {
                        this.createProjectile(plant);
                        plant.lastAction = this.frameCount;
                    }
                }
            } 
            else if (plant.type === 'spikeweed') {
                if (this.frameCount - plant.lastAction >= plantData.attackInterval) {
                    this.spikeweedAttack(plant);
                    plant.lastAction = this.frameCount;
                }
            }
            
            if (plant.type === 'snowpea' && !plant.snowpeaHalfTriggered && plant.health > 0 && plant.health <= plant.maxHealth / 2) {
                this.triggerSnowpeaEmergencyWeapon(plant, 'half');
            }
            
            if (plant.type === 'gatlingpea' && !plant.emergencyWeaponUsed && plant.health > 0 && plant.health < (plant.maxHealth * 2) / 3) {
                this.triggerGatlingAirstrike(plant);
            }

            if (plant.type === 'gatlingpea' && !plant.gatlingLavaUsed && plant.health > 0 && plant.health <= plant.maxHealth / 3) {
                this.triggerGatlingLavaField(plant);
            }

            if (plant.type === 'repeater' && !plant.doubleShieldUsed && plant.health > 0 && plant.health < (plant.maxHealth * 2) / 3) {
                this.triggerDoubleShooterShield(plant);
            }
            
            if (plant.type === 'repeater' && !plant.doubleWeaponUsed && plant.health > 0 && plant.health <= plant.maxHealth / 3) {
                this.triggerDoubleShooterWeapon(plant);
            }
            
            if (plant.healthBar) {
                const healthPercent = (plant.health / plant.maxHealth) * 100;
                plant.healthBar.style.width = `${Math.max(0, healthPercent)}%`;
            }
        });
    }
    
    spikeweedAttack(plant) {
        let hit = false;
        this.zombies.forEach(zombie => {
            if (zombie.isConvertedAlly) return;
            const zombieCol = Math.floor(zombie.x / this.CELL_WIDTH);
            if (zombie.row === plant.row && zombieCol === plant.col) {
                zombie.health -= this.plantTypes.spikeweed.damage;
                hit = true;
            }
        });
        if (hit) {
            if (plant.spikeSoundIndex == null) plant.spikeSoundIndex = 0;
            const filenames = ['spikes-attack01.MP3', 'spikes-attack02.MP3', 'spikes-attack03.MP3'];
            const knifeImgs = ['spikes_knife01.png', 'spikes_knife02.png', 'spikes_knife03.png'];
            const currentIndex = plant.spikeSoundIndex;
            this.playSound(filenames[currentIndex]);
            this.playSpikeweedKnifeBurst(plant, knifeImgs[currentIndex]);
            plant.spikeSoundIndex = (currentIndex + 1) % filenames.length;
        }
    }
    
    // Spikeweed三段刀光放大动画
    playSpikeweedKnifeBurst(plant, imgSrc) {
        if (!this._spikeKnifeCssInjected) this.injectSpikeKnifeCss();
        this.createKnifeBurst(imgSrc, plant.x, plant.y);
    }

    injectSpikeKnifeCss() {
        const style = document.createElement('style');
        style.id = 'spike-knife-style';
        style.textContent = `
@keyframes spikeKnifeBurst {
  0% { transform: translate(-50%, -50%) scale(0.2); opacity: 0.85; }
  60% { transform: translate(-50%, -50%) scale(1.0); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
}`;
        document.head.appendChild(style);
        this._spikeKnifeCssInjected = true;
    }

    createKnifeBurst(imgSrc, x, y) {
        const burst = document.createElement('div');
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = 'spikeweed-attack';
        img.style.width = '100%';
        img.style.height = '100%';
        burst.appendChild(img);

        burst.style.position = 'absolute';
        burst.style.width = `${this.CELL_WIDTH}%`;
        burst.style.height = `${this.CELL_HEIGHT}%`;
        burst.style.left = `${x}%`;
        burst.style.top = `${y}%`;
        burst.style.transform = 'translate(-50%, -50%)';
        burst.style.zIndex = '35';
        burst.style.pointerEvents = 'none';
        burst.style.animation = 'spikeKnifeBurst 1000ms ease-out forwards';

        this.entitiesLayer.appendChild(burst);
        burst.addEventListener('animationend', () => {
            if (burst.parentNode) burst.parentNode.removeChild(burst);
        });
    }
    
    triggerSpikeweedDeathSpecial(plant) {
        if (!plant || plant._spikeDeathSpecialUsed) return;
        const aliveZombies = this.zombies.filter(z => !z.isConvertedAlly && z.health > 0);
        if (aliveZombies.length === 0) return;
        plant._spikeDeathSpecialUsed = true;

        const target = aliveZombies[Math.floor(Math.random() * aliveZombies.length)];
        target.health -= 300;
        this.playSound('spikes_weapon_whoosh.MP3');
        this.playSpikeweedDeathSpecialEffect(target);
    }

    playSpikeweedDeathSpecialEffect(zombie) {
        if (!zombie || !zombie.element) return;
        if (!this._spikeDeathSpecialCssInjected) this.injectSpikeDeathSpecialCss();

        const effect = document.createElement('div');
        const img = document.createElement('img');
        img.src = 'spikes_special_knife.png';
        img.alt = 'spikeweed-special-knife';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.pointerEvents = 'none';
        effect.appendChild(img);

        effect.style.position = 'absolute';
        effect.style.left = `${zombie.x}%`;
        effect.style.top = `${zombie.y}%`;
        effect.style.width = `${this.CELL_WIDTH * 1.2}%`;
        effect.style.height = `${this.CELL_HEIGHT * 1.2}%`;
        effect.style.transform = 'translate(-50%, -50%)';
        effect.style.zIndex = '60';
        effect.style.pointerEvents = 'none';
        effect.style.animation = 'spikeDeathSpecial 3000ms cubic-bezier(0.2, 0.8, 0.4, 1) forwards';

        this.entitiesLayer.appendChild(effect);
        effect.addEventListener('animationend', () => {
            if (effect.parentNode) effect.parentNode.removeChild(effect);
        });
    }

    injectSpikeDeathSpecialCss() {
        const style = document.createElement('style');
        style.id = 'spike-death-special-style';
        style.textContent = `
@keyframes spikeDeathSpecial {
  0% { transform: translate(-50%, -50%) scale(0.05); opacity: 0; }
  33% { transform: translate(-50%, -50%) scale(1.6); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0; }
}`;
        document.head.appendChild(style);
        this._spikeDeathSpecialCssInjected = true;
    }
    
    hasZombieInRow(row) {
        return this.zombies.some(zombie => zombie.row === row && zombie.x > 0 && !zombie.isConvertedAlly);
    }
    
    isPlantActive(plant) {
        if (!plant || plant.health <= 0) return false;
        const row = plant.row;
        const col = plant.col;
        if (row == null || col == null) return false;
        if (!this.grid[row] || !this.grid[row][col]) return false;
        return this.grid[row][col].plant === plant;
    }
    
    createProjectile(plant) {
        const plantData = this.plantTypes[plant.type];
        const projectileCount = plantData.projectileCount || 1;
        
        for (let i = 0; i < projectileCount; i++) {
            const projectile = {
                x: plant.x + 3,
                y: plant.y,
                row: plant.row,
                speed: 0.6,
                damage: plantData.damage,
                type: plant.type,
                slowEffect: plantData.slowEffect || false,
                slowDuration: plantData.slowDuration || 0,
                element: null
            };
            
            if (i > 0) {
                projectile.x += i * 8;
            }
            
        const element = document.createElement('div');
        element.className = 'projectile';
        
        if (plant.type === 'snowpea') {
            this.setProjectileTexture(element, 'ice_wave.png');
        } else if (plant.type === 'repeater') {
            this.setProjectileTexture(element, 'double_wave.png');
        } else if (plant.type === 'gatlingpea') {
            this.setProjectileTexture(element, 'gatling_wave.png');
        } else {
            element.classList.add('pea');
        }
            
            element.style.left = `${projectile.x}%`;
            element.style.top = `${projectile.y}%`;
            element.style.transform = 'translate(-50%, -50%)';
            
            this.entitiesLayer.appendChild(element);
            projectile.element = element;
            this.projectiles.push(projectile);
            this.enhanceProjectileWithTorch(projectile);
        }
        if (plant.type === 'peashooter') {
            this.playSound('pea-shoot.MP3');
        } else if (plant.type === 'snowpea') {
            this.playSound('ice-shoot.MP3');
        } else if (plant.type === 'repeater') {
            this.playSound('double-shoot.MP3');
        } else if (plant.type === 'gatlingpea') {
            this.playSound('gatling-attack.MP3');
        }
    }
    
    triggerSnowpeaEmergencyWeapon(plant, triggerType = 'half') {
        if (!plant || plant.type !== 'snowpea') return;
        const type = triggerType === 'death' ? 'death' : 'half';
        if (type === 'half') {
            if (plant.snowpeaHalfTriggered) return;
            plant.snowpeaHalfTriggered = true;
        } else {
            if (plant.snowpeaDeathTriggered) return;
            plant.snowpeaDeathTriggered = true;
        }
        this.playSound('ice_weapon_whoosh.MP3');
        this.createSnowpeaEmergencyWeaponProjectile(plant, type);
    }
    
    createSnowpeaEmergencyWeaponProjectile(plant, triggerType = 'half') {
        const snowpeaConfig = this.plantTypes.snowpea || {};
        const projectile = {
            type: 'snowpea_emergency',
            row: plant.row,
            x: plant.x,
            y: plant.y,
            speed: (3 * this.CELL_WIDTH) / 100,
            damage: (snowpeaConfig.damage || 20) * (snowpeaConfig.emergencyWeaponDamageMultiplier || 2),
            element: null,
            birthFrame: this.frameCount,
            hitZombies: new Set(),
            mode: triggerType === 'death' ? 'convert' : 'freeze',
            maxTargets: triggerType === 'death' ? 3 : Infinity,
            convertedZombies: new Set()
        };
        
        const element = document.createElement('div');
        element.className = 'projectile snowpea-emergency-weapon';
        const img = document.createElement('img');
        if (projectile.mode === 'convert') {
            img.src = 'ice_shooter_ring.png';
        } else {
            img.src = 'ice_shooter_weapon.png';
        }
        img.alt = '寒冰武器';
        element.appendChild(img);
        
        element.style.left = `${projectile.x}%`;
        element.style.top = `${projectile.y}%`;
        element.style.transform = 'translate(-50%, -50%) scale(0.6)';
        element.style.opacity = '0';
        
        this.entitiesLayer.appendChild(element);
        projectile.element = element;
        this.projectiles.push(projectile);
    }

    convertZombieToAlly(zombie) {
        if (!zombie || zombie.isConvertedAlly) return;
        zombie.isConvertedAlly = true;
        zombie.convertEndFrame = this.frameCount + 2000; // 20 seconds at 10ms/frame
        zombie.isAttacking = false;
        zombie.element && zombie.element.classList.remove('attacking');
        zombie.lastAttack = this.frameCount;
        zombie.originalSpeed = zombie.originalSpeed || zombie.speed;
        const img = zombie.element ? zombie.element.querySelector('img') : null;
        zombie.originalImageTransform = zombie.originalImageTransform || (img ? img.style.transform : '');
        if (img) {
            img.style.transform = 'scaleX(-1)';
        }
        // Tint converted allies to pink for the conversion duration
        zombie.convertFilter = 'hue-rotate(310deg) saturate(1.8) brightness(1.05)';
        this.applyZombieFilters(zombie);
    }

    revertConvertedZombie(zombie) {
        if (!zombie || !zombie.isConvertedAlly) return;
        zombie.isConvertedAlly = false;
        zombie.convertEndFrame = null;
        zombie.isAttacking = false;
        zombie.element && zombie.element.classList.remove('attacking');
        zombie.convertFilter = '';
        const img = zombie.element ? zombie.element.querySelector('img') : null;
        if (img) {
            img.style.transform = zombie.originalImageTransform || '';
        }
        zombie.originalImageTransform = '';
        this.applyZombieFilters(zombie);
    }

    findEnemyZombieForConverted(zombie, range) {
        let target = null;
        let minDist = Infinity;
        for (const other of this.zombies) {
            if (!other || other === zombie || other.row !== zombie.row) continue;
            if (other.isConvertedAlly) continue;
            const dist = other.x - zombie.x;
            if (dist >= 0 && dist <= range && dist < minDist) {
                minDist = dist;
                target = other;
            }
        }
        return target;
    }

    findFrontConvertedAllyTarget(zombie, range) {
        let target = null;
        let minDist = Infinity;
        for (const other of this.zombies) {
            if (!other || other === zombie || other.row !== zombie.row) continue;
            if (!other.isConvertedAlly) continue;
            const dist = zombie.x - other.x;
            if (dist >= 0 && dist <= range && dist < minDist) {
                minDist = dist;
                target = other;
            }
        }
        return target;
    }

    updateConvertedAllyZombie(zombie) {
        if (!zombie) return;
        if (zombie.convertEndFrame && this.frameCount >= zombie.convertEndFrame) {
            this.revertConvertedZombie(zombie);
            return;
        }

        const zombieData = this.zombieTypes[zombie.type] || {};
        const attackRange = zombieData.normalAttackRange != null ? zombieData.normalAttackRange : 2;
        const target = this.findEnemyZombieForConverted(zombie, attackRange);
        const emergencyFrozen = zombie.emergencyDebuff && zombie.emergencyFrozen;

        if (target && !emergencyFrozen) {
            zombie.isAttacking = true;
            zombie.element && zombie.element.classList.add('attacking');
            if (this.frameCount - zombie.lastAttack >= (zombieData.attackInterval || 100)) {
                target.health -= zombie.damage;
                zombie.lastAttack = this.frameCount;
                if (target.health <= 0) {
                    const idx = this.zombies.indexOf(target);
                    if (idx > -1) this.removeZombie(idx);
                }
            }
        } else {
            zombie.isAttacking = false;
            zombie.element && zombie.element.classList.remove('attacking');
            let moveSpeed = zombie.speed;
            if (zombie.emergencyDebuff) {
                if (zombie.emergencyFrozen) {
                    moveSpeed = 0;
                } else if (zombie.emergencySlowActive) {
                    moveSpeed *= 0.5;
                }
            }
            zombie.x = Math.min(100, zombie.x + moveSpeed);
            if (zombie.element) {
                zombie.element.style.left = `${zombie.x}%`;
            }
        }

        if (zombie.healthBar) {
            const healthPercent = (zombie.health / zombie.maxHealth) * 100;
            zombie.healthBar.style.width = `${Math.max(0, healthPercent)}%`;
        }
    }
    
    triggerGatlingAirstrike(plant) {
        if (!plant) return;
        plant.emergencyWeaponUsed = true;
        const forwardCols = [];
        for (let c = plant.col + 1; c < this.COLS; c++) {
            forwardCols.push(c);
        }
        const targetCol = forwardCols.length > 0
            ? forwardCols[Math.floor(Math.random() * forwardCols.length)]
            : Math.min(this.COLS - 1, plant.col);
        const targetRow = forwardCols.length > 0
            ? Math.floor(Math.random() * this.ROWS)
            : plant.row;
        const targetX = targetCol * this.CELL_WIDTH + this.CELL_WIDTH / 2;
        const targetY = targetRow * this.CELL_HEIGHT + this.CELL_HEIGHT / 2;
        this.playSound('gatling_weapon_whoosh.MP3');
        this.createGatlingAirstrikeEffect({
            row: targetRow,
            col: targetCol,
            x: targetX,
            y: targetY
        });
    }
    
    createGatlingAirstrikeEffect(target) {
        if (!target) return;
        const drop = document.createElement('div');
        drop.className = 'gatling-airstrike';
        drop.style.left = `${target.x}%`;
        drop.style.top = `${target.y}%`;
        
        const img = document.createElement('img');
        img.src = 'gatling_pea_weapon.png';
        img.alt = '机枪豌豆应急武器';
        drop.appendChild(img);
        
        this.entitiesLayer.appendChild(drop);
        
        const handleImpact = () => {
            if (drop._impactHandled) return;
            drop._impactHandled = true;
            if (drop.parentNode) {
                drop.parentNode.removeChild(drop);
            }
            this.createGatlingImpactIndicator(target);
            this.resolveGatlingAirstrikeDamage(target);
        };
        
        drop.addEventListener('animationend', handleImpact, { once: true });
        setTimeout(handleImpact, 1100);
    }
    
    createGatlingImpactIndicator(target) {
        if (!target) return;
        const indicator = document.createElement('div');
        indicator.className = 'gatling-airstrike-impact';
        indicator.style.width = `${this.CELL_WIDTH * 3}%`;
        indicator.style.height = `${this.CELL_HEIGHT * 3}%`;
        indicator.style.left = `${target.x}%`;
        indicator.style.top = `${target.y}%`;
        indicator.style.transform = 'translate(-50%, -50%)';
        this.entitiesLayer.appendChild(indicator);
        
        const cleanup = () => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        };
        indicator.addEventListener('animationend', cleanup, { once: true });
        setTimeout(cleanup, 1500);
    }
    
    resolveGatlingAirstrikeDamage(target) {
        if (!target) return;
        const minRow = Math.max(0, target.row - 1);
        const maxRow = Math.min(this.ROWS - 1, target.row + 1);
        const minCol = Math.max(0, target.col - 1);
        const maxCol = Math.min(this.COLS - 1, target.col + 1);
        this.zombies.forEach(zombie => {
            if (!zombie) return;
            if (zombie.isConvertedAlly) return;
            if (zombie.row < minRow || zombie.row > maxRow) return;
            const zombieCol = Math.max(0, Math.min(this.COLS - 1, Math.floor(zombie.x / this.CELL_WIDTH)));
            if (zombieCol < minCol || zombieCol > maxCol) return;
            zombie.health -= 100;
            this.applyGatlingBurn(zombie);
        });
    }

    triggerGatlingLavaField(plant) {
        if (!plant || plant.gatlingLavaUsed) return;
        plant.gatlingLavaUsed = true;
        this.playSound('gatling_roar.MP3');
        const delayMs = 2000;
        setTimeout(() => {
            if (!this.isPlantActive(plant)) return;
            const startCol = Math.max(0, Math.min(this.COLS - 1, plant.col));
            const endCol = this.COLS - 1;
            const field = this.createGatlingLavaField(plant.row, startCol, endCol);
            if (field) {
                this.gatlingLavaFields.push(field);
            }
        }, delayMs);
    }

    createGatlingLavaField(row, startCol, endCol) {
        if (row == null) return null;
        const clampedStart = Math.max(0, startCol);
        const clampedEnd = Math.min(this.COLS - 1, endCol);
        const field = {
            row,
            startCol: clampedStart,
            endCol: clampedEnd,
            damagePerTick: 60,
            nextTickFrame: this.frameCount + this.secondsToFrames(1),
            endFrame: this.frameCount + this.secondsToFrames(5),
            overlays: []
        };
        for (let c = clampedStart; c <= clampedEnd; c++) {
            const cell = this.grid[row] && this.grid[row][c];
            if (!cell || !cell.element) continue;
            const overlay = this.buildGatlingLavaOverlay();
            cell.element.appendChild(overlay);
            field.overlays.push(overlay);
        }
        return field;
    }

    buildGatlingLavaOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'gatling-lava';
        const positions = [
            { left: 28, top: 32, scale: 1.0, opacity: 0.9 },
            { left: 55, top: 55, scale: 1.1, opacity: 0.85 },
            { left: 72, top: 30, scale: 0.95, opacity: 0.8 }
        ];
        positions.forEach(pos => {
            const img = document.createElement('img');
            img.src = 'gatling_wave.png';
            img.alt = 'gatling lava wave';
            img.style.left = `${pos.left}%`;
            img.style.top = `${pos.top}%`;
            img.style.transform = `translate(-50%, -50%) scale(${pos.scale})`;
            img.style.opacity = pos.opacity != null ? pos.opacity : 0.85;
            overlay.appendChild(img);
        });
        return overlay;
    }

    updateGatlingLavaFields() {
        if (!this.gatlingLavaFields || this.gatlingLavaFields.length === 0) return;
        for (let i = this.gatlingLavaFields.length - 1; i >= 0; i--) {
            const field = this.gatlingLavaFields[i];
            if (!field) {
                this.gatlingLavaFields.splice(i, 1);
                continue;
            }
            if (this.frameCount >= field.endFrame) {
                this.clearGatlingLavaField(field);
                this.gatlingLavaFields.splice(i, 1);
                continue;
            }
            if (this.frameCount >= field.nextTickFrame) {
                this.applyGatlingLavaDamage(field);
                field.nextTickFrame += this.secondsToFrames(1);
            }
        }
    }

    applyGatlingLavaDamage(field) {
        if (!field) return;
        this.zombies.forEach(zombie => {
            if (!zombie || zombie.isConvertedAlly) return;
            if (zombie.row !== field.row) return;
            const zombieCol = Math.max(0, Math.min(this.COLS - 1, Math.floor(zombie.x / this.CELL_WIDTH)));
            if (zombieCol < field.startCol || zombieCol > field.endCol) return;
            zombie.health -= field.damagePerTick;
        });
    }

    clearGatlingLavaField(field) {
        if (!field || !field.overlays) return;
        field.overlays.forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
    }

    triggerDoubleShooterShield(plant) {
        if (!plant || plant.doubleShieldUsed) return;
        plant.doubleShieldUsed = true;
        const frontCol = plant.col + 1;
        const shieldCol = Math.max(0, Math.min(this.COLS - 1, frontCol));
        const shieldRow = plant.row;
        const shieldX = shieldCol * this.CELL_WIDTH + this.CELL_WIDTH / 2;
        const shieldY = shieldRow * this.CELL_HEIGHT + this.CELL_HEIGHT / 2;
        this.playSound('double-shield-whoosh.MP3');
        this.createDoubleShooterShieldEffect({
            row: shieldRow,
            col: shieldCol,
            x: shieldX,
            y: shieldY
        });
        this.applyDoubleShooterShieldImpact(shieldRow, shieldCol);
    }

    triggerDoubleShooterWeapon(plant) {
        if (!plant || plant.doubleWeaponUsed) return;
        plant.doubleWeaponUsed = true;
        const chargeDelay = 1500;
        const swingDuration = 500;
        setTimeout(() => {
            if (!this.isPlantActive(plant)) return;
            this.playSound('double_weapon_whoosh.MP3');
            this.createDoubleWeaponSwingEffect(plant);
            setTimeout(() => {
                if (!this.isPlantActive(plant)) return;
                this.createDoubleWeaponAfterimage(plant);
                this.resolveDoubleWeaponImpact(plant);
            }, swingDuration);
        }, chargeDelay);
    }
    
    createDoubleWeaponSwingEffect(plant) {
        if (!plant) return;
        const swing = document.createElement('div');
        swing.className = 'double-weapon-spin';
        swing.style.left = `${plant.x}%`;
        swing.style.top = `${plant.y}%`;
        swing.style.width = `${this.CELL_WIDTH * 3}%`;
        swing.style.height = `${this.CELL_HEIGHT * 3}%`;
        const img = document.createElement('img');
        img.src = 'double_shooter_weapon.png';
        img.alt = '双发武器';
        swing.appendChild(img);
        this.entitiesLayer.appendChild(swing);
        const cleanup = () => {
            swing.removeEventListener('animationend', cleanup);
            if (swing.parentNode) swing.parentNode.removeChild(swing);
        };
        swing.addEventListener('animationend', cleanup);
        setTimeout(cleanup, 800);
    }
    
    createDoubleWeaponAfterimage(plant) {
        if (!plant) return;
        const rings = document.createElement('div');
        rings.className = 'double-weapon-rings';
        rings.style.left = `${plant.x}%`;
        rings.style.top = `${plant.y}%`;
        rings.style.width = `${this.CELL_WIDTH * 3}%`;
        rings.style.height = `${this.CELL_HEIGHT * 3}%`;
        const outerRing = document.createElement('div');
        outerRing.className = 'double-weapon-ring outer';
        const innerRing = document.createElement('div');
        innerRing.className = 'double-weapon-ring inner';
        rings.appendChild(outerRing);
        rings.appendChild(innerRing);
        this.entitiesLayer.appendChild(rings);
        const cleanup = () => {
            rings.removeEventListener('animationend', cleanup);
            if (rings.parentNode) rings.parentNode.removeChild(rings);
        };
        rings.addEventListener('animationend', cleanup);
        setTimeout(cleanup, 2200);
    }
    
    resolveDoubleWeaponImpact(plant) {
        if (!plant) return;
        const row = plant.row;
        const col = plant.col;
        if (row == null || col == null) return;
        // Expand to a 5x5 area (25 cells) around the plant for phase-two special attack
        const minRow = Math.max(0, row - 2);
        const maxRow = Math.min(this.ROWS - 1, row + 2);
        const minCol = Math.max(0, col - 2);
        const maxCol = Math.min(this.COLS - 1, col + 2);
        this.zombies.forEach(zombie => {
            if (!zombie) return;
            if (zombie.isConvertedAlly) return;
            if (zombie.row < minRow || zombie.row > maxRow) return;
            const zombieCol = Math.max(0, Math.min(this.COLS - 1, Math.floor(zombie.x / this.CELL_WIDTH)));
            if (zombieCol < minCol || zombieCol > maxCol) return;
            zombie.health -= 100;
            this.pushZombieBackOneCell(zombie);
        });
    }

    createDoubleShooterShieldEffect(target) {
        if (!target) return;
        const shield = document.createElement('div');
        shield.className = 'double-shield-effect';
        shield.style.left = `${target.x}%`;
        shield.style.top = `${target.y}%`;
        shield.style.width = `${this.CELL_WIDTH * 3}%`;
        shield.style.height = `${this.CELL_HEIGHT * 3}%`;
        const img = document.createElement('img');
        img.src = 'double_shooter_shield.png';
        img.alt = '双发盾牌';
        shield.appendChild(img);
        this.entitiesLayer.appendChild(shield);
        const handleAnimationEnd = (evt) => {
            if (evt.animationName === 'doubleShieldFade' && shield.parentNode) {
                shield.parentNode.removeChild(shield);
            }
        };
        shield.addEventListener('animationend', handleAnimationEnd);
        setTimeout(() => {
            if (shield.parentNode) {
                shield.parentNode.removeChild(shield);
            }
        }, 4000);
    }

    applyDoubleShooterShieldImpact(row, col) {
        const minRow = Math.max(0, row - 1);
        const maxRow = Math.min(this.ROWS - 1, row + 1);
        const minCol = Math.max(0, col - 1);
        const maxCol = Math.min(this.COLS - 1, col + 1);
        this.zombies.forEach(zombie => {
            if (!zombie) return;
            if (zombie.isConvertedAlly) return;
            if (zombie.row < minRow || zombie.row > maxRow) return;
            const zombieCol = Math.max(0, Math.min(this.COLS - 1, Math.floor(zombie.x / this.CELL_WIDTH)));
            if (zombieCol < minCol || zombieCol > maxCol) return;
            this.pushZombieBackOneCell(zombie);
        });
    }

    pushZombieBackOneCell(zombie) {
        if (!zombie) return;
        const knockback = this.CELL_WIDTH;
        zombie.x = Math.min(100, zombie.x + knockback);
        zombie.isAttacking = false;
        if (zombie.element) {
            zombie.element.style.left = `${zombie.x}%`;
            zombie.element.classList.remove('attacking');
        }
    }
    
    applyGatlingBurn(zombie) {
        if (!zombie) return;
        const durationFrames = this.secondsToFrames(30);
        const tickInterval = this.secondsToFrames(1);
        zombie.gatlingBurnActive = true;
        zombie.gatlingBurnEndFrame = this.frameCount + durationFrames;
        zombie.gatlingBurnNextTickFrame = this.frameCount + tickInterval;
        zombie.gatlingBurnDamagePerTick = 10;
        this.updateZombieStatusFilter(zombie);
    }
    
    updateGatlingBurnStatus(zombie) {
        if (!zombie || !zombie.gatlingBurnActive) return;
        if (zombie.health <= 0 || this.frameCount >= zombie.gatlingBurnEndFrame) {
            zombie.gatlingBurnActive = false;
            zombie.gatlingBurnEndFrame = 0;
            zombie.gatlingBurnNextTickFrame = 0;
            this.updateZombieStatusFilter(zombie);
            return;
        }
        if (!zombie.gatlingBurnNextTickFrame) {
            zombie.gatlingBurnNextTickFrame = this.frameCount + this.secondsToFrames(1);
        }
        if (this.frameCount >= zombie.gatlingBurnNextTickFrame) {
            zombie.health -= zombie.gatlingBurnDamagePerTick || 10;
            zombie.gatlingBurnNextTickFrame += this.secondsToFrames(1);
        }
    }
    
    secondsToFrames(seconds) {
        return Math.round((seconds || 0) * 100);
    }
    
    updateZombieStatusFilter(zombie) {
        if (!zombie) return;
        let filter = '';
        if (zombie.emergencyDebuff) {
            if (zombie.emergencyFrozen) {
                filter = 'hue-rotate(210deg) saturate(1.5)';
            } else if (zombie.emergencySlowActive) {
                filter = 'hue-rotate(180deg)';
            }
        } else if (zombie.gatlingBurnActive) {
            filter = 'hue-rotate(-40deg) saturate(1.6)';
        } else if (zombie.slowed && this.frameCount < zombie.slowEndTime) {
            filter = 'hue-rotate(180deg)';
        }
        zombie.statusFilter = filter;
        this.applyZombieFilters(zombie);
    }
    
    applyZombieFilters(zombie) {
        if (!zombie || !zombie.element) return;
        const filters = [];
        if (zombie.statusFilter) {
            filters.push(zombie.statusFilter);
        }
        if (zombie.enhanceFilter) {
            filters.push(zombie.enhanceFilter);
        }
        if (zombie.convertFilter) {
            filters.push(zombie.convertFilter);
        }
        zombie.element.style.filter = filters.join(' ') || '';
    }
    
    updateSnowpeaEmergencyProjectile(projectile) {
        if (!projectile.element) return;
        const elapsed = this.frameCount - (projectile.birthFrame || 0);
        const scale = Math.min(2, 0.6 + elapsed / 120);
        const opacity = Math.min(1, elapsed / 5);
        projectile.element.style.transform = `translate(-50%, -50%) scale(${scale})`;
        projectile.element.style.opacity = opacity;
    }
    
    setProjectileTexture(element, texture) {
        if (!element) return;
        element.style.backgroundImage = `url('${texture}')`;
        element.style.backgroundSize = 'contain';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
        element.style.backgroundColor = 'transparent';
        element.style.boxShadow = 'none';
    }
    
    enhanceProjectileWithTorch(projectile) {
        const projectileCol = Math.floor(projectile.x / this.CELL_WIDTH);
        
        for (let col = projectileCol; col < this.COLS; col++) {
            const cell = this.grid[projectile.row][col];
            if (cell && cell.plant && cell.plant.type === 'torchwood') {
                projectile.damage *= 1.5;
                if (projectile.element) {
                    projectile.element.classList.remove('pea');
                }
                this.setProjectileTexture(projectile.element, 'fire_wave.png');
                projectile.slowEffect = false;
                projectile.slowDuration = 0;
                projectile.fireEnhanced = true;
                break;
            }
        }
    }
    
    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.x += projectile.speed;
            projectile.element.style.left = `${projectile.x}%`;
            
            if (projectile.type === 'snowpea_emergency') {
                this.updateSnowpeaEmergencyProjectile(projectile);
            }
            
            if (projectile.speed > 0 && projectile.x > 100) {
                this.removeProjectile(i);
            } else if (projectile.speed < 0 && projectile.x < 0) {
                this.removeProjectile(i);
            }
        }
    }
    
    spawnZombies() {
        if (this.spawnedZombies >= this.currentWaveZombies) return;
        
        const waveData = this.currentWaveData || this.waveConfig[this.currentWave <= this.maxWave ? this.currentWave : this.maxWave];
        
        this.zombieSpawnTimer++;
        
        if (this.zombieSpawnTimer >= waveData.spawnInterval) {
            if (this.mode === 'test' && waveData.testMode) {
                this.spawnTestModeZombie(waveData);
            } else {
                const row = Math.floor(Math.random() * this.ROWS);
                const zombieType = waveData.types[Math.floor(Math.random() * waveData.types.length)];
                this.createZombie(row, zombieType);
                this.spawnedZombies++;
            }
            
            this.zombieSpawnTimer = 0;
            this.updateDisplay();
        }
    }

    spawnTestModeZombie(waveData) {
        let zombieTypeToSpawn = null;
        for (const type of waveData.types) {
            if (this.zombieTypeCounter[type] < waveData.zombieCount[type]) {
                zombieTypeToSpawn = type;
                break;
            }
        }
        
        if (zombieTypeToSpawn) {
            const row = Math.floor(Math.random() * this.ROWS);
            this.createZombie(row, zombieTypeToSpawn);
            this.zombieTypeCounter[zombieTypeToSpawn]++;
            this.spawnedZombies++;
        }
    }
    
    createZombie(row, type) {
        const zombieData = this.zombieTypes[type];
        
        let startX = 95;
        let startY = (row + 1) * this.CELL_HEIGHT;
        
        if (type === 'bungee') {
            const backCols = [6, 7, 8];
            const targetCol = backCols[Math.floor(Math.random() * backCols.length)];
            startX = targetCol * this.CELL_WIDTH + this.CELL_WIDTH / 2;
            startY = -10;
        }
        
        const zombie = {
            type: type,
            row: row,
            x: startX,
            y: startY,
            health: zombieData.health,
            maxHealth: zombieData.health,
            speed: zombieData.speed,
            damage: zombieData.damage,
            lastAttack: 0,
            isAttacking: false,
            element: null,
            healthBar: null,
            hasCharged: false,
            hasJumped: false,
            hasStolen: false,
            hasKicked: false,
            currentArmorHits: zombieData.currentArmorHits || 0,
            stealTimer: 0,
            chargeEndTime: 0,
            isCharging: zombieData.isCharging || false,
            isScarletRot: zombieData.isScarletRot || false,
            scarletRotTriggered: Array.isArray(zombieData.scarletRotTriggered) ? [...zombieData.scarletRotTriggered] : [],
            // 剑士僵尸成长机制属性
            killCount: zombieData.killCount || 0,
            baseDamage: zombieData.baseDamage || zombieData.damage,
            baseAttackRange: zombieData.baseAttackRange || 5,
            baseSwordSize: zombieData.baseSwordSize || 1.0,
            currentSwordSize: zombieData.baseSwordSize || 1.0,
            currentAttackRange: zombieData.baseAttackRange || 5,
            hasUsedSpecialAttack: zombieData.hasUsedSpecialAttack || false,
            gatlingBurnActive: false,
            gatlingBurnEndFrame: 0,
            gatlingBurnNextTickFrame: 0,
            gatlingBurnDamagePerTick: 10,
            statusFilter: '',
            enhanceFilter: '',
            convertFilter: '',
            isConvertedAlly: false,
            convertEndFrame: null,
            originalImageTransform: ''
        };
        
        const element = document.createElement('div');
        element.className = 'zombie';
        if (type === 'gargantuar') {
            element.classList.add('gargantuar-zombie');
        }
        if (type === 'knight') {
            element.classList.add('knight-zombie');
        }
        
        const img = document.createElement('img');
        img.src = zombieData.icon;
        img.alt = zombieData.name;
        img.style.width = '100%';
        img.style.height = '100%';
        element.appendChild(img);
        
        element.style.left = `${zombie.x}%`;
        element.style.top = `${zombie.y}%`;
        element.style.transform = 'translate(-50%, -50%)';
        
        if (type === 'bungee') {
            element.classList.add('bungee-drop');
            zombie.y = row * this.CELL_HEIGHT + this.CELL_HEIGHT / 2;
            element.style.top = `${zombie.y}%`;
            // 空投僵尸入场时播放空投音效（仅一次）
            this.playSound('airdrop-attack.MP3');
            setTimeout(() => {
                element.classList.remove('bungee-drop');
            }, 1000);
        }
        
        if (type !== 'bungee') {
            const healthBar = document.createElement('div');
            healthBar.className = 'health-bar';
            const healthFill = document.createElement('div');
            healthFill.className = 'health-fill';
            healthBar.appendChild(healthFill);
            element.appendChild(healthBar);
            zombie.healthBar = healthFill;
        }
        
        this.entitiesLayer.appendChild(element);
        zombie.element = element;
        this.zombies.push(zombie);
    }
    
    updateZombies() {
        for (let i = this.zombies.length - 1; i >= 0; i--) {
            const zombie = this.zombies[i];
            const zombieData = this.zombieTypes[zombie.type];
            this.updateSnowpeaEmergencyStatus(zombie);
            this.updateGatlingBurnStatus(zombie);
            if (zombie.health <= 0) {
                this.removeZombie(i);
                continue;
            }

            if (zombie.isConvertedAlly) {
                this.updateConvertedAllyZombie(zombie);
                if (zombie.health <= 0) {
                    this.removeZombie(i);
                }
                continue;
            }

            // 巨人僵尸特殊攻击：生命值低于一半时触发一次落雷
            if (zombie.type === 'gargantuar') {
                const healthPercent = zombie.health / zombie.maxHealth;
                if (healthPercent <= 0.5 && !zombie.hasUsedSpecialAttack) {
                    zombie.hasUsedSpecialAttack = true; // 立即标记，防止重复触发
                    this.triggerGargantuarSpecialAttack(zombie);
                }
            }

            this.handleZombieSpecialBehavior(zombie, zombieData);

            if (zombie.slowed && this.frameCount >= zombie.slowEndTime) {
                zombie.slowed = false;
                zombie.speed = zombie.originalSpeed;
                this.updateZombieStatusFilter(zombie);
            }

            const currentCol = Math.floor(zombie.x / this.CELL_WIDTH);
            let plant = null;
            let attackRange = 2; // 默认攻击范围
            let attackRangeForCheck = attackRange;
            
            // 剑士僵尸血量检测和特殊攻击触发
            if (zombie.type === 'swordsman') {
                // 检查是否需要触发特殊攻击
                const healthPercent = zombie.health / zombie.maxHealth;
                if (healthPercent <= 0.5 && !zombie.hasUsedSpecialAttack) {
                    this.triggerSwordsmanSpecialAttack(zombie);
                    zombie.hasUsedSpecialAttack = true;
                }
                
                attackRange = zombie.currentAttackRange || 5;
                attackRangeForCheck = attackRange;
                // 在攻击范围内寻找植物
                for (let checkCol = currentCol; checkCol >= Math.max(0, currentCol - Math.ceil(attackRange / this.CELL_WIDTH)); checkCol--) {
                    if (this.grid[zombie.row] && this.grid[zombie.row][checkCol] && this.grid[zombie.row][checkCol].plant) {
                        const plantX = checkCol * this.CELL_WIDTH + this.CELL_WIDTH / 2;
if (zombie.x - plantX <= attackRange) {
    const candidate = this.grid[zombie.row][checkCol].plant;
    if (candidate && candidate.type === 'spikeweed') {
        continue;
    }
    plant = candidate;
    break;
}
                    }
                }
            } else {
                // 其他僵尸使用原有逻辑（改为按 normalAttackRange 进行多格距离判定）
                let found = null;
                const range = (this.zombieTypes[zombie.type].normalAttackRange != null) ? this.zombieTypes[zombie.type].normalAttackRange : 2;
                attackRangeForCheck = range;
                const maxColsLeft = Math.ceil((range + this.CELL_WIDTH / 2) / this.CELL_WIDTH);
                for (let offset = 0; offset <= maxColsLeft; offset++) {
                    const col = currentCol - offset;
                    if (col < 0) break;
                    const cell = this.grid[zombie.row][col];
                    if (!cell || !cell.plant) continue;
                    const candidate = cell.plant;
                    if (candidate.type === 'spikeweed') continue;
                    const centerX = col * this.CELL_WIDTH + this.CELL_WIDTH / 2;
                    const dist = Math.abs(zombie.x - centerX);
                    if (dist <= range) {
                        found = candidate;
                        break;
                    }
                }
                plant = found;
            }

            const allyTarget = this.findFrontConvertedAllyTarget(zombie, attackRangeForCheck);
            const plantCenterX = plant ? (plant.col * this.CELL_WIDTH + this.CELL_WIDTH / 2) : null;
            const plantDistance = plantCenterX != null ? Math.abs(zombie.x - plantCenterX) : Infinity;
            const allyDistance = allyTarget ? Math.abs(zombie.x - allyTarget.x) : Infinity;
            const targetIsAlly = allyTarget && allyDistance <= plantDistance;
            const canAttack = zombie.type === 'swordsman' ? 
                (plant && !plant.isExploding && !zombie.isCharging) :
                (plant && !plant.isExploding && Math.abs(zombie.x - (plant.col * this.CELL_WIDTH + this.CELL_WIDTH / 2)) <= (this.zombieTypes[zombie.type].normalAttackRange != null ? this.zombieTypes[zombie.type].normalAttackRange : 2) && !zombie.isCharging);
            const emergencyFrozen = zombie.emergencyDebuff && zombie.emergencyFrozen;

            const canAttackAlly = targetIsAlly && !zombie.isCharging;

            if (canAttackAlly && !emergencyFrozen) {
                zombie.isAttacking = true;
                zombie.element.classList.add('attacking');

                if (this.frameCount - zombie.lastAttack >= zombieData.attackInterval) {
                    let damage = zombie.damage;

                    if (zombie.type === 'swordsman' && zombie.currentArmorHits > 0) {
                        zombie.currentArmorHits--;
                        damage = 0;
                    }

                    if (zombie.type === 'swordsman') {
                        this.createSwordEffect(zombie);
                        this.playSound('swordsman-normal-attack.MP3');
                    }
                    if (zombie.type === 'gargantuar') {
                        this.createHammerEffect(zombie);
                        this.playSound('giant-attack.MP3');
                    }
                    if (zombie.type === 'football') {
                        this.createGoldenStickEffect(zombie);
                        this.playSound('football-normal-attack.MP3');
                    }
                    if (zombie.type === 'valkyrie') {
                        (function() {
                            const styleId = 'valkyrie-normal-swing-style';
                            if (!document.getElementById(styleId)) {
                                const style = document.createElement('style');
                                style.id = styleId;
                                style.textContent = `
.valkyrie-knife-effect-normal {
    position: absolute;
    z-index: 30;
    pointer-events: none;
    transform-origin: top right;
    animation: valkyrieKnifeSwingNormal 0.3s ease-out forwards;
}
@keyframes valkyrieKnifeSwingNormal {
    0% {
        transform: translate(-50%, -50%) scale(0.8) rotate(-60deg);
        opacity: 1;
    }
    50% {
        transform: translate(-40%, -60%) scale(1.2) rotate(45deg);
        opacity: 1;
    }
    100% {
        transform: translate(-30%, -70%) scale(0.8) rotate(90deg);
        opacity: 0;
    }
}`;
                                document.head.appendChild(style);
                            }
                            const effect = document.createElement('div');
                            effect.className = 'valkyrie-knife-effect-normal';
                            effect.style.left = zombie.element.style.left;
                            effect.style.top = zombie.element.style.top;
                            const img = document.createElement('img');
                            img.src = 'knife.png';
                            img.alt = 'knife';
                            effect.appendChild(img);
                            this.entitiesLayer.appendChild(effect);
                            effect.addEventListener('animationend', () => effect.remove());
                        }).call(this);
                        this.playSound('valkyrie-attack.MP3');
                    }
                    if (zombie.type === 'knight') {
                        this.createKnightHalberdSwingEffect(zombie);
                        this.playSound('knight-normal-attack.MP3');
                    }
                    if (zombie.type === 'normal') {
                        this.playSound('zombie-eat.MP3');
                    }

                    allyTarget.health -= damage;
                    zombie.lastAttack = this.frameCount;

                    if (allyTarget.health <= 0) {
                        const targetIdx = this.zombies.indexOf(allyTarget);
                        if (targetIdx > -1) {
                            this.removeZombie(targetIdx);
                        }
                        zombie.isAttacking = false;
                        zombie.element.classList.remove('attacking');
                    }
                }
            } else if (canAttack && !emergencyFrozen) {
                zombie.isAttacking = true;
                zombie.element.classList.add('attacking');

                if (this.frameCount - zombie.lastAttack >= zombieData.attackInterval) {
                    let damage = zombie.damage;

                    if (zombie.type === 'swordsman' && zombie.currentArmorHits > 0) {
                        zombie.currentArmorHits--;
                        damage = 0;
                    }

                    if (zombie.type === 'swordsman') {
                        this.createSwordEffect(zombie);
                        this.playSound('swordsman-normal-attack.MP3');
                    }
                    if (zombie.type === 'gargantuar') {
                        this.createHammerEffect(zombie);
                        this.playSound('giant-attack.MP3');
                    }
                    if (zombie.type === 'football') {
                        this.createGoldenStickEffect(zombie);
                        this.playSound('football-normal-attack.MP3');
                    }
                    if (zombie.type === 'valkyrie') {
                        // Valkyrie normal attack: independent weapon swing (not reused)
                        (function() {
                            const styleId = 'valkyrie-normal-swing-style';
                            if (!document.getElementById(styleId)) {
                                const style = document.createElement('style');
                                style.id = styleId;
                                style.textContent = `
.valkyrie-knife-effect-normal {
    position: absolute;
    z-index: 30;
    pointer-events: none;
    transform-origin: top right;
    animation: valkyrieKnifeSwingNormal 0.3s ease-out forwards;
}
@keyframes valkyrieKnifeSwingNormal {
    0% {
        transform: translate(-50%, -50%) scale(0.8) rotate(-60deg);
        opacity: 1;
    }
    50% {
        transform: translate(-40%, -60%) scale(1.2) rotate(45deg);
        opacity: 1;
    }
    100% {
        transform: translate(-30%, -70%) scale(0.8) rotate(90deg);
        opacity: 0;
    }
}`;
                                document.head.appendChild(style);
                            }
                            const effect = document.createElement('div');
                            effect.className = 'valkyrie-knife-effect-normal';
                            // 跟随僵尸当前位置（保持与冲刺版参数一致的定位方式）
                            effect.style.left = zombie.element.style.left;
                            effect.style.top = zombie.element.style.top;
                            const img = document.createElement('img');
                            img.src = 'knife.png';
                            img.alt = 'knife';
                            effect.appendChild(img);
                            this.entitiesLayer.appendChild(effect);
                            effect.addEventListener('animationend', () => effect.remove());
                        }).call(this);
                        this.playSound('valkyrie-attack.MP3');
                    }
                    if (zombie.type === 'knight') {
                        this.createKnightHalberdSwingEffect(zombie);
                        this.playSound('knight-normal-attack.MP3');
                    }
                    if (zombie.type === 'normal') {
                        this.playSound('zombie-eat.MP3');
                    }

                    if (plant.shield && plant.shield.health > 0) {
                        plant.shield.health -= damage;
                        if (plant.shield.health <= 0) {
                            this.removeShield(plant);
                        }
                    } else {
                        plant.health -= damage;
                    }
                    zombie.lastAttack = this.frameCount;

                    if (plant.health <= 0) {
                        // 剑士僵尸击败植物时触发成长机制
                        if (zombie.type === 'swordsman') {
                            this.enhanceSwordsmanZombie(zombie);
                        }
                        
                        if (zombie.type === 'normal') {
                            // 普通僵尸吃掉植物：直接消失、无粒子特效，并播放吞咽音效一次
                            this.removePlant(plant, { skipParticles: true, sound: 'zombie-swallow.mp3' });
                        } else {
                            this.removePlant(plant);
                        }
                        zombie.isAttacking = false;
                        zombie.element.classList.remove('attacking');

                        if (zombie.type === 'gargantuar') {
                            this.createShockwave(zombie);
                        }
                    }
                }
            } else {
                zombie.isAttacking = false;
                zombie.element.classList.remove('attacking');

                let moveSpeed = zombie.speed;
                if (zombie.isCharging) {
                    if (zombie.isScarletRot) {
                        moveSpeed = this.zombieTypes[zombie.type].scarletRotChargeSpeed;
                    } else {
                        moveSpeed = this.zombieTypes[zombie.type].chargeSpeed;
                    }
                }

                if (zombie.emergencyDebuff) {
                    if (zombie.emergencyFrozen) {
                        moveSpeed = 0;
                    } else if (zombie.emergencySlowActive) {
                        moveSpeed *= 0.5;
                    }
                }

                if (zombie.type === 'football' && zombie.health <= zombie.maxHealth / 2 && !zombie.hasKicked) {
                    this.footballZombieKick(zombie);
                    zombie.hasKicked = true;
                }

                zombie.x -= moveSpeed;
                zombie.element.style.left = `${zombie.x}%`;
            }

            if (zombie.healthBar) {
                const healthPercent = (zombie.health / zombie.maxHealth) * 100;
                zombie.healthBar.style.width = `${Math.max(0, healthPercent)}%`;
            }

            if (zombie.x <= 0) {
                this.gameOver('defeat');
                return;
            }

            if (zombie.health <= 0) {
                this.removeZombie(i);
            }
        }
    }
    
    removeShield(plant) {
        if (plant.shield && plant.shield.element) {
            plant.shield.element.remove();
            plant.shield = null;
        }
    }
    
    dropSun() {
        this.sunDropTimer++;
        if (this.sunDropTimer >= 500) {
            const x = Math.random() * 80 + 10;
            const y = Math.random() * 80 + 10;
            this.createSun(x, y, true);
            this.sunDropTimer = 0;
        }
    }
    
    createSun(x, y, fromSky) {
        const sunValue = fromSky ? 25 : (this.sunflowerBoostUnlocked ? 100 : 25); // 向日葵在第10波后产4倍阳光
        const sun = {
            x: x,
            y: y,
            fromSky: fromSky,
            collected: false,
            element: null,
            value: sunValue
        };
        
        const element = document.createElement('div');
        element.className = 'sun';
        element.textContent = '';
        element.style.left = `${x}%`;
        element.style.top = `${y}%`;
        element.style.transform = 'translate(-50%, -50%)';
        
        this.entitiesLayer.appendChild(element);
        sun.element = element;
        this.suns.push(sun);
        
        setTimeout(() => {
            if (!sun.collected) {
                this.removeSun(sun);
            }
        }, 8000);
    }
    
    updateSuns() {
        // No specific update logic needed, handled by click
    }
    
    handleNormalZombieRoar() {
        const hasNormal = this.zombies.some(z => z.type === 'normal');
        if (hasNormal) {
            this.normalRoarTimer++;
            if (this.normalRoarTimer >= 300) {
                this.playSound('zombie-roar.MP3');
                this.normalRoarTimer = 0;
            }
        } else {
            this.normalRoarTimer = 0;
        }
    }
    
    // --- 声音播放工具 ---
    playSound(filename) {
        const resolveVolume = (name) => {
            if (this.soundVolumes && this.soundVolumes[name] != null) return this.soundVolumes[name];
            const lower = name.toLowerCase();
            for (const key in (this.soundVolumes || {})) {
                if (key.toLowerCase() === lower) return this.soundVolumes[key];
            }
            return 0.8;
        };

        const candidates = this._buildSoundCandidates(filename);
        const tryNext = (index) => {
            if (index >= candidates.length) return;
            const src = candidates[index];
            let audio = this.audioCache && this.audioCache[src];
            const volume = resolveVolume(filename);
            if (!audio) {
                audio = new Audio(src);
                audio.preload = 'auto';
                audio.volume = volume;
                if (this.audioCache) this.audioCache[src] = audio;
            }
            // 每次播放前覆盖音量，支持运行时调整
            audio.volume = volume;
            const onError = () => {
                audio.removeEventListener('error', onError);
                tryNext(index + 1);
            };
            audio.addEventListener('error', onError, { once: true });
            const p = audio.play();
            if (p && typeof p.then === 'function') {
                p.catch(() => {});
            }
        };
        tryNext(0);
    }

    _buildSoundCandidates(filename) {
        const list = [];
        const push = (s) => { if (s && !list.includes(s)) list.push(s); };

        push(filename);
        const dot = filename.lastIndexOf('.');
        if (dot !== -1) {
            const base = filename.slice(0, dot);
            const ext = filename.slice(dot + 1);
            push(`${base}.${ext.toUpperCase()}`);
            push(`${base}.${ext.toLowerCase()}`);
        } else {
            push(`${filename}.mp3`);
            push(`${filename}.MP3`);
        }
        push(filename.toLowerCase());
        return list;
    }
    
    collectSun(element) {
        const sun = this.suns.find(s => s.element === element);
        if (sun && !sun.collected) {
            sun.collected = true;
            const sunValue = (typeof sun.value === 'number') ? sun.value : 25;
            if (this.mode !== 'test') {
                this.sunCount += sunValue;
            }
            this.removeSun(sun);
            this.updateDisplay();
        }
    }
    
    checkCollisions() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (projectile.type === 'football') {
                for (let j = this.plants.length - 1; j >= 0; j--) {
                    const plant = this.plants[j];
                    
if (plant.row === projectile.row && Math.abs(plant.x - projectile.x) < 5) {
    if (plant.type === 'spikeweed') {
        continue;
    }

    let damage = projectile.damage;
    
    if (plant.shield && plant.shield.health > 0) {
        plant.shield.health -= damage;
        if (plant.shield.health <= 0) this.removeShield(plant);
    } else {
        plant.health -= damage;
        if (plant.health <= 0) this.removePlant(plant);
    }
    
    this.removeProjectile(i);
    break;
}
                }
            } else if (projectile.type === 'snowpea_emergency') {
                const hitRange = Math.max(4, this.CELL_WIDTH * 0.5);
                if (!projectile.hitZombies) {
                    projectile.hitZombies = new Set();
                }
                const isConvertMode = projectile.mode === 'convert';
                if (isConvertMode && !projectile.convertedZombies) {
                    projectile.convertedZombies = new Set();
                }
                let projectileRemoved = false;
                for (let j = this.zombies.length - 1; j >= 0; j--) {
                    const zombie = this.zombies[j];
                    if (zombie.isConvertedAlly) continue;
                    if (zombie.row === projectile.row && Math.abs(zombie.x - projectile.x) < hitRange) {
                        if (isConvertMode) {
                            const maxTargets = projectile.maxTargets != null ? projectile.maxTargets : 2;
                            if (!projectile.convertedZombies.has(zombie) && projectile.convertedZombies.size < maxTargets) {
                                projectile.convertedZombies.add(zombie);
                                this.convertZombieToAlly(zombie);
                                if (projectile.convertedZombies.size >= maxTargets) {
                                    this.removeProjectile(i);
                                    projectileRemoved = true;
                                    break;
                                }
                            }
                        } else if (!projectile.hitZombies.has(zombie)) {
                            projectile.hitZombies.add(zombie);
                            zombie.health -= projectile.damage;
                            this.applySnowpeaEmergencyDebuff(zombie);
                        }
                    }
                }
                if (projectileRemoved) {
                    continue;
                }
            } else {
                for (let j = this.zombies.length - 1; j >= 0; j--) {
                    const zombie = this.zombies[j];
                    if (zombie.isConvertedAlly) continue;
                    
                    if (zombie.row === projectile.row && Math.abs(zombie.x - projectile.x) < 3) {
                        zombie.health -= projectile.damage;
                        
                        if (projectile.fireEnhanced) {
                            this.playSound('fire-hit.MP3');
                        } else if (projectile.type === 'snowpea') {
                            this.playSound('frozen.MP3');
                        } else if (projectile.type === 'peashooter' || projectile.type === 'repeater' || projectile.type === 'gatlingpea') {
                            this.playSound('normal-hit.MP3');
                        }
                        
                        if (zombie.type === 'valkyrie' && zombie.isCharging) {
                            this.explodeScarletRot(zombie, this.grid[zombie.row][Math.floor(zombie.x / this.CELL_WIDTH)].plant);
                        }
                        
                        if (projectile.slowEffect) {
                            zombie.slowed = true;
                            zombie.slowEndTime = this.frameCount + projectile.slowDuration;
                            zombie.originalSpeed = zombie.originalSpeed || zombie.speed;
                            zombie.speed = zombie.originalSpeed * 0.7;
                            this.updateZombieStatusFilter(zombie);
                        }
                        
                        this.removeProjectile(i);
                        break;
                    }
                }
            }
        }
    }
    
    applySnowpeaEmergencyDebuff(zombie) {
        if (!zombie || !zombie.element) return;
        const freezeDuration = 600; // 6s
        const slowDuration = 1200;   // additional 12s
        zombie.emergencyDebuff = true;
        zombie.emergencyFrozen = true;
        zombie.emergencySlowActive = false;
        zombie.emergencyFreezeEnd = this.frameCount + freezeDuration;
        zombie.emergencySlowEnd = this.frameCount + freezeDuration + slowDuration;
        zombie.originalSpeed = zombie.originalSpeed || zombie.speed;
        this.updateZombieStatusFilter(zombie);
    }
    
    updateSnowpeaEmergencyStatus(zombie) {
        if (!zombie || !zombie.emergencyDebuff) return;
        if (zombie.emergencyFrozen && this.frameCount >= zombie.emergencyFreezeEnd) {
            zombie.emergencyFrozen = false;
            zombie.emergencySlowActive = true;
        }
        
        if (zombie.emergencySlowActive && this.frameCount >= zombie.emergencySlowEnd) {
            zombie.emergencySlowActive = false;
            zombie.emergencyDebuff = false;
            zombie.emergencyFreezeEnd = null;
            zombie.emergencySlowEnd = null;
        }
        this.updateZombieStatusFilter(zombie);
    }
    
    explodeCherryBomb(plant) {
        this.playSound('bomb.mp3');
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        const img = document.createElement('img');
        img.src = 'explode.png';
        img.alt = '爆炸效果';
        img.style.width = '100%';
        img.style.height = '100%';
        explosion.appendChild(img);
        
        explosion.style.width = `${this.CELL_WIDTH}%`;
        explosion.style.height = `${this.CELL_HEIGHT}%`;
        explosion.style.left = `${plant.x}%`;
        explosion.style.top = `${plant.y}%`;
        explosion.style.transform = 'translate(-50%, -50%)';
        this.entitiesLayer.appendChild(explosion);
        
        const bombData = this.plantTypes.cherrybomb;
        this.zombies.forEach(zombie => {
            if (zombie.isConvertedAlly) return;
            const rowDiff = Math.abs(zombie.row - plant.row);
            const colDiff = Math.abs(zombie.x / this.CELL_WIDTH - plant.col);
            
            if (rowDiff <= 1 && colDiff <= 1.5) {
                zombie.health -= bombData.damage;
            }
        });
        
        this.removePlant(plant, { sound: '' });
        
        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 1000);
    }
    
    removePlant(plant, options = {}) {
        const plantDied = plant && plant.health <= 0;
        if (plantDied && plant.type === 'spikeweed') {
            this.triggerSpikeweedDeathSpecial(plant);
        }
        if (plant && plant.type === 'snowpea' && plant.health <= 0) {
            this.triggerSnowpeaEmergencyWeapon(plant, 'death');
        }
        if (plant.shield) {
            this.removeShield(plant);
        }
        const sound = options && Object.prototype.hasOwnProperty.call(options, 'sound')
            ? options.sound
            : 'plant_zombie_over.MP3';
        if (sound) {
            this.playSound(sound);
        }
        if (!(options && options.skipParticles) && plant.element) {
            this.createDeathParticlesFromElement(plant.element);
        }
        if (plant.element && plant.element.parentNode) {
            plant.element.parentNode.removeChild(plant.element);
        }
        this.grid[plant.row][plant.col].plant = null;
        this.grid[plant.row][plant.col].occupied = false;
        const index = this.plants.indexOf(plant);
        if (index > -1) {
            this.plants.splice(index, 1);
        }
    }
    
    removeZombie(index, options = {}) {
        const zombie = this.zombies[index];
        if (zombie) {
            const defaultSound = zombie.type === 'normal' ? 'zombie-dead.MP3' : 'plant_zombie_over.MP3';
            const sound = options && Object.prototype.hasOwnProperty.call(options, 'sound') ? options.sound : defaultSound;
            if (sound) {
                this.playSound(sound);
            }
        }
        if (!(options && options.skipParticles) && zombie && zombie.element) {
            this.createDeathParticlesFromElement(zombie.element);
        }
        if (zombie && zombie.element && zombie.element.parentNode) {
            zombie.element.parentNode.removeChild(zombie.element);
        }
        this.zombies.splice(index, 1);
    }
    
    removeProjectile(index) {
        const projectile = this.projectiles[index];
        if (projectile.element && projectile.element.parentNode) {
            projectile.element.parentNode.removeChild(projectile.element);
        }
        this.projectiles.splice(index, 1);
    }
    
    removeSun(sun) {
        if (sun.element && sun.element.parentNode) {
            sun.element.parentNode.removeChild(sun.element);
        }
        const index = this.suns.indexOf(sun);
        if (index > -1) {
            this.suns.splice(index, 1);
        }
    }
    
    checkWaveComplete() {
        if (this.spawnedZombies >= this.currentWaveZombies && this.zombies.length === 0) {
            if (this.mode === 'test') {
                this.gameOver('test_complete');
                return;
            }

            const waveData = this.currentWaveData || this.waveConfig[Math.min(this.currentWave, this.maxWave)];
            if (waveData && waveData.reward) {
                this.sunCount += waveData.reward;
            }
            
            if (this.currentWave > this.highestWave) {
                this.highestWave = this.currentWave;
                localStorage.setItem('pvz-highest-wave', this.highestWave.toString());
            }
            
            const completedWave = this.currentWave;
            // 更安全的方案：只要完成第10波或之后的波次，就确保标志被设置
            const unlockedSunflowerBoost = completedWave >= 10 && !this.sunflowerBoostUnlocked;
            if (completedWave >= 10 && !this.sunflowerBoostUnlocked) {
                this.sunflowerBoostUnlocked = true;
            }
            // 永久推进：完成任意波次后进入下一波；超过预设最大波后切换为无尽模式
            this.currentWave++;
            if (this.currentWave > this.maxWave) {
                this.survivalMode = true;
            }
            if (this.mode === 'survival' && completedWave === 5) {
                this.unlockShovel();
            }
            this.initializeWave();

            let title, message;
            if (this.currentWave <= this.maxWave) {
                title = `No. ${this.currentWave} wave start!`;
                message = `Get ${waveData?.reward || 0} Golden Tree Flower reward! Prepare for an even stronger zombie attack.`;
            } else {
                title = `Endless Mode - No. ${this.currentWave} wave!`;
                message = `You have entered endless mode! The zombies will get stronger and stronger! Highest record: No. ${this.highestWave} wave`;
            }
            if (unlockedSunflowerBoost) {
                message += '\nTip: Melina now bestows four times the amount of Golden Tree Flower each time!';
            }

            this.showGameStatus(title, message, 'Continue');
            this.pauseGame();
        }
    }
    
    checkGameOver() {
        // Handled in updateZombies
    }
    
    gameOver(result) {
        this.gameState = result;
        clearInterval(this.gameTimer);
        
        if (result === 'victory') {
            this.showGameStatus('victory!', `You have successfully completed 10 waves of challenges! Highest record: No. ${this.highestWave} wave`, 'One more game');
        } else if (result === 'defeat') {
            this.showGameStatus('Defeated!', `The zombies have breached your defenses! Surviving to No. ${this.currentWave} wave! Highest record: No. ${this.highestWave} wave`, 'One more game');
        } else if (result === 'test_complete') {
            this.showGameStatus('Test complete!', 'All zombies have been spawned. You can continue testing or start over.', 'Retest');
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.pauseGame();
        } else if (this.gameState === 'paused') {
            this.resumeGame();
        }
    }
    
    pauseGame() {
        this.gameState = 'paused';
        // 暂停生存模式背景音乐
        if (this.survivalBgm && !this.survivalBgm.paused) {
            try { this.survivalBgm.pause(); } catch (e) {}
        }
        this.pauseBtn.textContent = 'Continue';
        clearInterval(this.gameTimer);
    }
    
    resumeGame() {
        this.gameState = 'playing';
        // 恢复生存模式背景音乐
        if (this.survivalBgm && this.survivalBgm.paused) {
            try { this.survivalBgm.play && this.survivalBgm.play(); } catch (e) {}
        }
        this.pauseBtn.textContent = 'Pause';
        this.hideGameStatus();
        this.gameTimer = setInterval(() => this.gameLoop(), 10);
    }
    
    restartGame() {
        // 重开前：如有生存BGM则停止并清理
        try {
            if (this.survivalBgm) {
                this.survivalBgm.pause && this.survivalBgm.pause();
                this.survivalBgm.currentTime = 0;
                this.survivalBgm = null;
            }
        } catch (e) {}
        this.gameState = 'waiting';
        clearInterval(this.gameTimer);
        
        this.sunCount = (this.mode === 'test') ? 9999 : 150;
        this.currentWave = 1;
        this.frameCount = 0;
        this.sunDropTimer = 0;
        this.zombieSpawnTimer = 0;
        this.spawnedZombies = 0;
        this.currentWaveZombies = 0;
        this.survivalMode = false;
        this.sunflowerBoostUnlocked = false;
        
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.suns = [];
        this.plantCooldowns = {};
        this.gatlingLavaFields = [];
        
        this.entitiesLayer.innerHTML = '';
        
        this.startBtn.classList.remove('hidden');
        this.pauseBtn.classList.add('hidden');
        this.pauseBtn.textContent = 'Pause';
        this.clearSelection();
        
        this.createGrid();
        this.updateDisplay();
        this.hideGameStatus();
        this.showModeSelection();
    }
    
    updateDisplay() {
        this.sunCountElement.textContent = this.mode === 'test' ? '∞' : this.sunCount;
        this.currentWaveElement.textContent = this.mode === 'test' ? 'Test Mode' : (this.survivalMode ? `${this.currentWave} (Endless)` : `${this.currentWave}/${this.maxWave}`);
        this.remainingZombiesElement.textContent = 
            Math.max(0, this.currentWaveZombies - this.spawnedZombies + this.zombies.length);
        this.highestWaveElement.textContent = this.highestWave;
        
        document.querySelectorAll('.plant-card').forEach(card => {
            const plantType = card.dataset.plant;
            if (plantType === 'shovel') {
                const costLabel = card.querySelector('.plant-cost');
                if (this.mode === 'test' || this.shovelUnlocked) {
                    card.classList.remove('locked');
                    card.classList.remove('disabled');
                    if (costLabel) costLabel.textContent = '0';
                } else {
                    card.classList.add('locked');
                    card.classList.add('disabled');
                    if (costLabel) costLabel.textContent = '锁定';
                }
                return;
            }
            
            const cost = parseInt(card.dataset.cost, 10) || 0;
            if (this.mode === 'test') {
                card.classList.remove('disabled');
            } else {
                if (this.sunCount < cost) {
                    card.classList.add('disabled');
                } else {
                    card.classList.remove('disabled');
                }
            }
        });
    }
    
    updateCooldowns() {
        Object.keys(this.plantCooldowns).forEach(plantType => {
            if (this.plantCooldowns[plantType] > 0) {
                this.plantCooldowns[plantType]--;
            }
        });
    }
    
    showGameStatus(title, message, buttonText = null) {
        this.statusTitle.textContent = title;
        this.statusMessage.textContent = message;
        
        if (buttonText) {
            this.statusBtn.textContent = buttonText;
            this.statusBtn.classList.remove('hidden');
        } else {
            this.statusBtn.classList.add('hidden');
        }
        
        this.gameStatus.style.display = 'flex';
    }
    
    hideGameStatus() {
        this.gameStatus.style.display = 'none';
    }
    
    handleStatusButton() {
        if (this.gameState === 'paused') {
            this.resumeGame();
        } else if (this.gameState === 'victory' || this.gameState === 'defeat' || this.gameState === 'test_complete') {
            this.restartGame();
        }
    }
    
    handleZombieSpecialBehavior(zombie, zombieData) {
        switch (zombieData.specialBehavior) {
            case 'jump':
                this.handleKnightJump(zombie, zombieData);
                break;
            case 'steal':
                this.handleBungeeSteal(zombie, zombieData);
                break;
            case 'valkyrie_charge':
                this.handleValkyrieCharge(zombie, zombieData);
                break;
            default:
                break;
        }
    }
    
    handleKnightJump(zombie, zombieData) {
        if (zombie.hasJumped) return;
        
        const currentCol = Math.floor(zombie.x / this.CELL_WIDTH);
        const triggerThreshold = (zombieData.jumpTrigger != null) ? this.CELL_WIDTH * zombieData.jumpTrigger : this.CELL_WIDTH * 0.4;
        
        // 在阈值范围内向左扫描多个格，寻找可触发的最近植物（忽略地刺）
        let plant = null;
        const maxColsLeft = Math.ceil((triggerThreshold + this.CELL_WIDTH / 2) / this.CELL_WIDTH);
        for (let offset = 0; offset <= maxColsLeft; offset++) {
            const col = currentCol - offset;
            if (col < 0) break;
            const cell = this.grid[zombie.row][col];
            if (!cell || !cell.plant) continue;
            const candidate = cell.plant;
            if (candidate.type === 'spikeweed') continue;
            const plantCenterX = col * this.CELL_WIDTH + this.CELL_WIDTH / 2;
            const dist = Math.abs(zombie.x - plantCenterX);
            if (dist <= triggerThreshold) {
                plant = candidate;
                break;
            }
        }
        if (plant) {
            zombie.hasJumped = true;
            zombie.element.classList.add('jumping');
            // 骑士僵尸冲刺（跳劈）特殊攻击触发音效
            this.playSound('knight-special-attack.MP3');
            
            zombie.x += zombieData.retreatDistance;
            zombie.element.style.left = `${zombie.x}%`;
            
            setTimeout(() => {
                zombie.x -= zombieData.jumpDistance;
                zombie.element.style.left = `${zombie.x}%`;
                
                this.createKnightSwordEffect(zombie);
                
                if (plant && plant.health > 0) {
                    const jumpDamage = zombieData.damage * 3;
                    plant.health -= jumpDamage;
                    if (plant.health <= 0) {
                        this.removePlant(plant);
                    }
                }
                
                zombie.element.classList.remove('jumping');
            }, 500);
        }
    }
    
    handleBungeeSteal(zombie, zombieData) {
        if (zombie.hasStolen) return;
        
        zombie.stealTimer = (zombie.stealTimer || 0) + 1;
        
        if (zombie.stealTimer >= zombieData.stealDelay) {
            zombie.hasStolen = true;
            
            const availablePlants = [];
            
            for (let col = 0; col < this.COLS; col++) {
                for (let row = 0; row < this.ROWS; row++) {
                    const plant = this.grid[row][col].plant;
                    if (plant && plant.type !== 'spikeweed') {
                        availablePlants.push(plant);
                    }
                }
            }
            
            if (availablePlants.length > 0) {
                const targetPlant = availablePlants[Math.floor(Math.random() * availablePlants.length)];
                this.removePlant(targetPlant, { sound: '', skipParticles: true });
                this.playSound('airdrop-steal.MP3');
                
                const stealEffect = document.createElement('div');
                stealEffect.className = 'steal-effect';
                stealEffect.textContent = 'Soldiers stolen by Zombie!';
                stealEffect.style.left = `${targetPlant.x}%`;
                stealEffect.style.top = `${targetPlant.y}%`;
                stealEffect.style.transform = 'translate(-50%, -50%)';
                this.entitiesLayer.appendChild(stealEffect);
                
                setTimeout(() => {
                    if (stealEffect.parentNode) {
                        stealEffect.parentNode.removeChild(stealEffect);
                    }
                }, 2000);
            }
            
            this.removeZombie(this.zombies.indexOf(zombie), { sound: '', skipParticles: true });
        }
    }

    handleValkyrieCharge(zombie, zombieData) {
        // 女武神状态管理
        if (zombie.isCharging) {
            // 仅在普通冲刺时添加刀刃效果，猩红腐败冲刺时不需要
            if (!zombie.isScarletRot && (!zombie.lastKnifeSwing || this.frameCount - zombie.lastKnifeSwing > 30)) { // Swing every 20 frames
                this.createValkyrieKnifeEffect(zombie);
                zombie.lastKnifeSwing = this.frameCount;
            }
            
            // 如果时间到了，则停止冲刺
            if (this.frameCount >= zombie.chargeEndTime) {
                zombie.isCharging = false;
                // 如果这是猩红腐败冲刺，则恢复外观
                if (zombie.isScarletRot) {
                    zombie.isScarletRot = false;
                    zombie.element.querySelector('img').src = zombieData.icon;
                    zombie.element.classList.remove('scarlet-rot-seed'); // 移除种子动画
                }
                zombie.element.classList.remove('charging');
                return; // 停止进一步处理此帧
            }

            // 处理冲刺时的碰撞
            const currentCol = Math.floor(zombie.x / this.CELL_WIDTH);
            if (currentCol < 0) return;
            const plant = this.grid[zombie.row][currentCol] ? this.grid[zombie.row][currentCol].plant : null;
if (plant) {
    if (plant.type === 'spikeweed') {
        // 地刺不会触发或受到女武神冲刺的伤害
    } else if (zombie.isScarletRot) {
        // 爆炸并停止冲刺
        this.explodeScarletRot(zombie, plant);
        return;
    } else {
        // 普通冲刺伤害植物并继续
        if (!plant.damagedByValkyrieCharge) {
            plant.health -= zombieData.chargeDamage;
            plant.damagedByValkyrieCharge = true; // 标记为防止重复伤害
            if (plant.health <= 0) {
                this.removePlant(plant);
            }
        }
    }
}
            return; // 在冲刺状态下，跳过触发逻辑
        }

        // 触发逻辑
        // 1. 基于生命值的猩红腐败冲刺
        const healthPercent = zombie.health / zombie.maxHealth;
        for (let i = 0; i < zombieData.scarletRotThresholds.length; i++) {
            if (healthPercent <= zombieData.scarletRotThresholds[i] && !zombie.scarletRotTriggered[i]) {
                this.triggerScarletRot(zombie, zombieData, i);
                zombie.chargeEndTime = this.frameCount + 100; // 1秒冲刺
                return;
            }
        }

        // 2. 一次普通冲刺在遇到植物时
        if (zombie.hasCharged) {
            return; // 已经使用了一次普通冲刺
        }

        const currentCol = Math.floor(zombie.x / this.CELL_WIDTH);
        if (currentCol < 0 || currentCol >= this.COLS) return;
        const plantInFront = this.grid[zombie.row][currentCol] ? this.grid[zombie.row][currentCol].plant : null;

        if (plantInFront && plantInFront.type !== 'spikeweed') {
            zombie.isCharging = true;
            zombie.hasCharged = true; // 使用一次普通冲刺
            zombie.element.classList.add('charging');
            zombie.chargeEndTime = this.frameCount + 30; // 0.3秒冲刺持续时间
            // 女武神普通冲刺音效
            this.playSound('valkyrie-normal-attack.MP3');

            // 重置此行所有植物的伤害标志
            this.plants.forEach(p => {
                if (p.row === zombie.row) {
                    p.damagedByValkyrieCharge = false;
                }
            });
        }
    }

    triggerScarletRot(zombie, zombieData, thresholdIndex) {
        zombie.scarletRotTriggered[thresholdIndex] = true;
        zombie.isCharging = true;
        zombie.isScarletRot = true;
        zombie.element.querySelector('img').src = 'scarlet_rot_seed.png';
        zombie.element.classList.add('charging', 'scarlet-rot-seed'); // 添加猩红腐败种子动画类
        // 女武神猩红腐败种子音效
        this.playSound('valkyrie-special-attack01.MP3');
    }

    explodeScarletRot(zombie, plant) {
        const explosion = document.createElement('div');
        explosion.className = 'scarlet-rot-bloom'; // 使用新的猩红腐败爆炸动画类
        const img = document.createElement('img');
        img.src = 'scarlet_rot_bloom.png';
        img.alt = '猩红腐败爆炸';
        img.style.width = '100%';
        img.style.height = '100%';
        explosion.appendChild(img);

        // 尺寸和位置由CSS动画控制，但初始位置还是要设置
        explosion.style.width = `${this.CELL_WIDTH * 1.5}%`;
        explosion.style.height = `${this.CELL_HEIGHT * 1.5}%`;
        explosion.style.left = `${plant.x}%`;
        explosion.style.top = `${plant.y}%`;
        this.entitiesLayer.appendChild(explosion);
        // 女武神猩红腐败爆炸音效
        this.playSound('valkyrie-special-attack02.MP3');

        const explosionDamage = 100;
        this.plants.forEach(p => {
            const rowDiff = Math.abs(p.row - plant.row);
            const colDiff = Math.abs(p.col - plant.col);
            if (rowDiff <= 1 && colDiff <= 1 && p.type !== 'spikeweed') {
                p.health -= explosionDamage;
                if (p.health <= 0) {
                    this.removePlant(p);
                }
            }
        });

        zombie.isCharging = false;
        zombie.isScarletRot = false;
        zombie.element.querySelector('img').src = 'valkyrie_zombie.png';
        zombie.element.classList.remove('charging', 'scarlet-rot-seed'); // 移除相关类

        setTimeout(() => {
            if (explosion.parentNode) {
                explosion.parentNode.removeChild(explosion);
            }
        }, 5000); // 匹配动画时长
    }
    
    createShockwave(zombie) {
        const shockwave = document.createElement('div');
        shockwave.className = 'shockwave';
        
        const img = document.createElement('img');
        img.src = 'shockwave.png';
        img.alt = '冲击波效果';
        img.style.width = '100%';
        img.style.height = '100%';
        shockwave.appendChild(img);
        
        shockwave.style.width = `${this.CELL_WIDTH}%`;
        shockwave.style.height = `${this.CELL_HEIGHT}%`;
        shockwave.style.left = `${zombie.x}%`;
        shockwave.style.top = `${zombie.y}%`;
        shockwave.style.transform = 'translate(-50%, -50%)';
        this.entitiesLayer.appendChild(shockwave);
        this.playSound('giant-normal-attack.MP3');
        
        const zombieData = this.zombieTypes.gargantuar;
        for (let row = Math.max(0, zombie.row - 1); row <= Math.min(this.ROWS - 1, zombie.row + 1); row++) {
            for (let col = Math.max(0, Math.floor(zombie.x / this.CELL_WIDTH) - 1); 
                 col <= Math.min(this.COLS - 1, Math.floor(zombie.x / this.CELL_WIDTH) + 1); col++) {
const plant = this.grid[row][col].plant;
if (plant && plant.type !== 'spikeweed') {
                    plant.health -= zombieData.shockwaveDamage;
                    if (plant.health <= 0) {
                        this.removePlant(plant);
                    }
                }
            }
        }
        
        setTimeout(() => {
            if (shockwave.parentNode) {
                shockwave.parentNode.removeChild(shockwave);
            }
        }, 1000);
    }
    
    footballZombieKick(zombie) {
        // 计算射弹的Y坐标，使其在轨道的垂直中心
        const projectileY = zombie.row * this.CELL_HEIGHT + this.CELL_HEIGHT / 2;

        const football = {
            x: zombie.x - 5,
            y: projectileY, // 使用修正后的Y坐标
            row: zombie.row,
            speed: -0.5,
            damage: 80,
            element: null,
            type: 'football'
        };
        
        const element = document.createElement('div');
        element.className = 'football-projectile';
        const img = document.createElement('img');
        img.src = 'golden_ball.png';
        element.appendChild(img);
        element.style.left = `${football.x}%`;
        element.style.top = `${football.y}%`; // 使用修正后的Y坐标
        
        this.entitiesLayer.appendChild(element);
        football.element = element;
        this.projectiles.push(football);
        // 足球僵尸发射足球时播放音效
        this.playSound('football-special-attack.MP3');
        
        zombie.element.classList.add('kicking');
        setTimeout(() => {
            zombie.element.classList.remove('kicking');
        }, 500);
    }
    
    createSwordEffect(zombie) {
        const swordEffect = document.createElement('div');
        swordEffect.className = 'sword-effect';
        
        const img = document.createElement('img');
        img.src = 'swords.png';
        img.alt = '剑';
        img.style.width = '100%';
        img.style.height = '100%';
        swordEffect.appendChild(img);

        // 根据剑士僵尸的成长状态调整剑的尺寸
        const swordSize = zombie.currentSwordSize || 1.0;
        const baseSize = 200; // 基础尺寸
        const currentSize = Math.floor(baseSize * swordSize);

        swordEffect.style.position = 'absolute';
        // 将其定位在僵尸的中心
        swordEffect.style.left = `${zombie.x}%`; 
        swordEffect.style.top = `${zombie.y}%`;
        swordEffect.style.width = `${currentSize}px`;  // 动态尺寸
        swordEffect.style.height = `${currentSize}px`; // 动态尺寸
        swordEffect.style.zIndex = '30';
        swordEffect.style.pointerEvents = 'none';
        swordEffect.style.transformOrigin = 'center';
        swordEffect.style.transition = 'transform 0.3s linear';
        
        // 如果剑士僵尸已经强化，添加特殊效果
        if (zombie.killCount > 0) {
            swordEffect.style.filter = `drop-shadow(0 0 ${Math.min(zombie.killCount * 2, 10)}px #ff4444)`;
            swordEffect.style.opacity = Math.min(0.8 + zombie.killCount * 0.1, 1.0);
        }
        
        // 设置初始状态：在其位置居中并旋转
        swordEffect.style.transform = 'translate(-50%, -50%) rotate(90deg)';

        this.entitiesLayer.appendChild(swordEffect);

        // 触发动画
        setTimeout(() => {
            swordEffect.style.transform = 'translate(-50%, -50%) rotate(-90deg)';
        }, 10);

        // 动画后移除元素
        setTimeout(() => {
            if (swordEffect.parentNode) {
                swordEffect.parentNode.removeChild(swordEffect);
            }
        }, 310); // 比过渡时间稍长
    }
    
    createKnightSwordEffect(zombie) {
        const knightSwordEffect = document.createElement('div');
        knightSwordEffect.className = 'knight-sword-effect';

        const img = document.createElement('img');
        img.src = 'halberd.png';
        img.alt = '戟';
        img.style.width = '80%';
        img.style.height = '80%';
        knightSwordEffect.appendChild(img);

        knightSwordEffect.style.position = 'absolute';
        knightSwordEffect.style.left = `${zombie.x - 1}%`;
        knightSwordEffect.style.top = `${zombie.y - 1}%`;
        knightSwordEffect.style.transform = 'translate(-50%, -50%)';
        knightSwordEffect.style.width = '40px';
        knightSwordEffect.style.height = '40px';
        knightSwordEffect.style.zIndex = '30';
        knightSwordEffect.style.pointerEvents = 'none';
        
        this.entitiesLayer.appendChild(knightSwordEffect);
        
        setTimeout(() => {
            if (knightSwordEffect.parentNode) {
                knightSwordEffect.parentNode.removeChild(knightSwordEffect);
            }
        }, 400);
    }

    createKnightHalberdSwingEffect(zombie) {
        const swing = document.createElement('div');
        swing.className = 'knight-halberd-swing';

        const img = document.createElement('img');
        img.src = 'halberd.png';
        img.alt = '戟';
        img.style.width = '100%';
        img.style.height = '100%';
        swing.appendChild(img);

        swing.style.position = 'absolute';
        swing.style.left = `${zombie.x - 1}%`;
        swing.style.top = `${zombie.y - 1}%`;
        swing.style.width = '360px';
        swing.style.height = '360px';
        swing.style.zIndex = '30';
        swing.style.pointerEvents = 'none';

        // 以右上角为枢轴做劈砍动作
        swing.style.transformOrigin = 'center';
        swing.style.transition = 'transform 1s linear';
        // 初始角度：从左上方抬起
        swing.style.transform = 'translate(-50%, -50%) rotate(0deg)';

        this.entitiesLayer.appendChild(swing);

        // 触发动画：向右下方挥至 +60 度
        setTimeout(() => {
            swing.style.transform = 'translate(-50%, -50%) rotate(-135deg)';
        }, 10);

        // 动画结束移除
        setTimeout(() => {
            if (swing.parentNode) {
                swing.parentNode.removeChild(swing);
            }
        }, 1000);
    }
    
    createHammerEffect(zombie) {
        const hammerEffect = document.createElement('div');
        hammerEffect.className = 'hammer-effect';
        
        const img = document.createElement('img');
        img.src = 'hammer.png';
        img.alt = '锤子';
        img.style.width = '100%';
        img.style.height = '100%';
        hammerEffect.appendChild(img);
        
        hammerEffect.style.position = 'absolute';
        hammerEffect.style.left = `${zombie.x - 12}%`;
        hammerEffect.style.top = `${zombie.y - 8}%`;
        hammerEffect.style.transform = 'translate(-50%, -50%)';
        hammerEffect.style.width = '30px';
        hammerEffect.style.height = '30px';
        hammerEffect.style.zIndex = '30';
        hammerEffect.style.pointerEvents = 'none';
        
        this.entitiesLayer.appendChild(hammerEffect);
        
        setTimeout(() => {
            if (hammerEffect.parentNode) {
                hammerEffect.parentNode.removeChild(hammerEffect);
            }
        }, 500);
    }

    createValkyrieKnifeEffect(zombie) {
        const knifeEffect = document.createElement('div');
        knifeEffect.className = 'valkyrie-knife-effect';

        const img = document.createElement('img');
        img.src = 'knife.png';
        img.alt = '刀';
        img.style.width = '100%';
        img.style.height = '100%';
        knifeEffect.appendChild(img);

        knifeEffect.style.position = 'absolute';
        knifeEffect.style.left = `${zombie.x - 1}%`;
        knifeEffect.style.top = `${zombie.y - 1}%`;
        knifeEffect.style.width = '300px';
        knifeEffect.style.height = '300px';
        knifeEffect.style.zIndex = '30';
        knifeEffect.style.pointerEvents = 'none';

        // 依靠 CSS 的 @keyframes valkyrieKnifeSwing 播放动画
        this.entitiesLayer.appendChild(knifeEffect);

        // 动画结束自动移除，避免残留
        const remove = () => {
            if (knifeEffect && knifeEffect.parentNode) {
                knifeEffect.parentNode.removeChild(knifeEffect);
            }
        };
        knifeEffect.addEventListener('animationend', remove, { once: true });
        // 兜底清理，防止某些环境未触发 animationend
        setTimeout(remove, 500);
    }

    createGoldenStickEffect(zombie) {
        const stickEffect = document.createElement('div');
        stickEffect.className = 'golden-stick-effect';

        const img = document.createElement('img');
        img.src = 'golden_stick.png';
        img.alt = '挥舞的木棒';
        stickEffect.appendChild(img);

        stickEffect.style.left = `${zombie.x - 17}%`;
        stickEffect.style.top = `${zombie.y - 40}%`;
        
        this.entitiesLayer.appendChild(stickEffect);

        stickEffect.addEventListener('animationend', () => {
            if (stickEffect.parentNode) {
                stickEffect.parentNode.removeChild(stickEffect);
            }
        });
    }

    // 剑士僵尸成长机制函数
    enhanceSwordsmanZombie(zombie) {
        if (zombie.type !== 'swordsman') return;
        
        // 增加击败计数
        zombie.killCount++;
        
        // 计算增强倍数（每击败一个植物增强20%攻击力，20%攻击范围和剑尺寸）
        const damageMultiplier = 1 + (zombie.killCount * 0.2);
        const rangeMultiplier = 1 + (zombie.killCount * 0.2);
        const sizeMultiplier = 1 + (zombie.killCount * 0.2);
        
        // 更新属性
        zombie.damage = Math.floor(zombie.baseDamage * damageMultiplier);
        zombie.currentAttackRange = zombie.baseAttackRange * rangeMultiplier;
        zombie.currentSwordSize = zombie.baseSwordSize * sizeMultiplier;
        
        // 添加强化视觉效果
        zombie.element.classList.add('enhanced');
        zombie.enhanceFilter = `drop-shadow(0 0 ${Math.min(zombie.killCount * 3, 15)}px #ff4444)`;
        this.applyZombieFilters(zombie);
        
        // 更新僵尸图片透明度，显示强化状态
        const img = zombie.element.querySelector('img');
        if (img) {
            img.style.filter = `brightness(${Math.min(1.0 + zombie.killCount * 0.1, 1.5)}) saturate(${Math.min(1.0 + zombie.killCount * 0.2, 2.0)})`;
        }
        
        // 创建强化视觉效果
        this.createSwordsmanEnhanceEffect(zombie);
        
        console.log(`剑士僵尸强化！击败数：${zombie.killCount}，攻击力：${zombie.damage}，攻击范围：${zombie.currentAttackRange.toFixed(1)}，剑尺寸：${zombie.currentSwordSize.toFixed(1)}x`);
    }

    // 剑士僵尸强化视觉效果
    createSwordsmanEnhanceEffect(zombie) {
        const enhanceEffect = document.createElement('div');
        enhanceEffect.className = 'swordsman-enhance-effect';
        enhanceEffect.textContent = `Berserker+${zombie.killCount}`;
        enhanceEffect.style.position = 'absolute';
        enhanceEffect.style.left = `${zombie.x}%`;
        enhanceEffect.style.top = `${zombie.y - 1}%`;
        enhanceEffect.style.transform = 'translate(-50%, -50%)';
        enhanceEffect.style.color = '#ff4444';
        enhanceEffect.style.fontSize = '14px';
        enhanceEffect.style.fontWeight = 'bold';
        enhanceEffect.style.zIndex = '40';
        enhanceEffect.style.pointerEvents = 'none';
        enhanceEffect.style.animation = 'enhanceFloat 2s ease-out forwards';
        
        this.entitiesLayer.appendChild(enhanceEffect);
        
        setTimeout(() => {
            if (enhanceEffect.parentNode) {
                enhanceEffect.parentNode.removeChild(enhanceEffect);
            }
        }, 2000);
    }

    // 剑士僵尸特殊攻击触发函数
    triggerSwordsmanSpecialAttack(zombie) {
        // 创建特殊攻击提示效果
        const warningEffect = document.createElement('div');
        warningEffect.className = 'special-attack-warning';
        warningEffect.textContent = 'Dragon Slayer Sword';
        warningEffect.style.position = 'absolute';
        warningEffect.style.left = `${zombie.x}%`;
        warningEffect.style.top = `${zombie.y - 1}%`;
        warningEffect.style.transform = 'translate(-50%, -50%)';
        warningEffect.style.color = '#ff0000';
        warningEffect.style.fontSize = '16px';
        warningEffect.style.fontWeight = 'bold';
        warningEffect.style.zIndex = '50';
        warningEffect.style.pointerEvents = 'none';
        warningEffect.style.textShadow = '0 0 10px #ff0000';
        
        this.entitiesLayer.appendChild(warningEffect);
        // 剑士特殊攻击触发音效
        this.playSound('swordsman-special-attack.MP3');
        
        // 延迟执行特殊攻击
        setTimeout(() => {
            this.executeSwordsmanSpecialAttack(zombie);
            if (warningEffect.parentNode) {
                warningEffect.parentNode.removeChild(warningEffect);
            }
        }, 1000);
    }

    // 执行剑士僵尸特殊攻击
    executeSwordsmanSpecialAttack(zombie) {
        // 计算攻击范围（草坪长度的0.2倍，约2格）
        const specialAttackRange = this.COLS * this.CELL_WIDTH * 0.17;
        const specialDamage = zombie.baseDamage * 2; // 2倍基础伤害
        
        // 创建超大剑效果
        this.createSpecialSwordEffect(zombie, specialAttackRange);
        
        // 攻击范围内的所有植物
        const zombieCol = Math.floor(zombie.x / this.CELL_WIDTH);
        const attackEndCol = Math.max(0, zombieCol - Math.ceil(specialAttackRange / this.CELL_WIDTH));
        
        for (let col = zombieCol; col >= attackEndCol; col--) {
            if (this.grid[zombie.row] && this.grid[zombie.row][col] && this.grid[zombie.row][col].plant) {
                const plant = this.grid[zombie.row][col].plant;
                
                // 对植物造成巨大伤害
                if (plant.shield && plant.shield.health > 0) {
                    plant.shield.health -= specialDamage;
                    if (plant.shield.health <= 0) {
                        this.removeShield(plant);
                        plant.health -= specialDamage;
                    }
                } else {
                    plant.health -= specialDamage;
                }
                
                if (plant.health <= 0) {
                    this.removePlant(plant);
                }
            }
        }
        
        // 在攻击最远端创建冲击波效果
        const shockwaveX = Math.max(5, zombie.x - specialAttackRange);
        this.createSpecialShockwave(shockwaveX, zombie.y);
    }

    // 创建特殊剑效果
    createSpecialSwordEffect(zombie, attackRange) {
        const specialSwordEffect = document.createElement('div');
        // 应用新的CSS类，该类包含了动画定义
        specialSwordEffect.className = 'special-sword-effect';
        
        const img = document.createElement('img');
        img.src = 'swords.png';
        img.alt = '斩龙之剑';
        img.style.width = '100%';
        img.style.height = '100%';
        specialSwordEffect.appendChild(img);

        // 超大尺寸剑
        const specialSwordSize = Math.floor(200 * 4); // 4倍普通剑尺寸

        specialSwordEffect.style.position = 'absolute';
        // 将其定位在僵尸的中心
        specialSwordEffect.style.left = `${zombie.x}%`; 
        specialSwordEffect.style.top = `${zombie.y}%`;
        specialSwordEffect.style.width = `${specialSwordSize}px`;  // 超大尺寸
        specialSwordEffect.style.height = `${specialSwordSize}px`; // 超大尺寸
        
        // 初始变换现在由CSS动画的 'from' 状态处理
        specialSwordEffect.style.transform = 'translate(-50%, -50%)';

        this.entitiesLayer.appendChild(specialSwordEffect);

        // 动画由CSS自动播放，只需在动画结束后移除元素
        setTimeout(() => {
            if (specialSwordEffect.parentNode) {
                specialSwordEffect.parentNode.removeChild(specialSwordEffect);
            }
        }, 300); // 动画时长为0.3s
    }

    // 创建特殊冲击波效果
    createSpecialShockwave(x, y) {
        const shockwave = document.createElement('div');
        shockwave.className = 'special-shockwave';
        
        const img = document.createElement('img');
        img.src = 'shockwave.png';
        img.alt = '冲击波';
        img.style.width = '100%';
        img.style.height = '100%';
        shockwave.appendChild(img);
        
        // 大尺寸冲击波
        const shockwaveSize = this.CELL_WIDTH * 2;
        shockwave.style.position = 'absolute';
        shockwave.style.left = `${x}%`;
        shockwave.style.top = `${y}%`;
        shockwave.style.width = `${shockwaveSize}%`;
        shockwave.style.height = `${shockwaveSize}%`;
        shockwave.style.transform = 'translate(-50%, -50%)';
        shockwave.style.zIndex = '40';
        shockwave.style.pointerEvents = 'none';
        
        // 冲击波动画效果
        shockwave.style.animation = 'shockwaveExpand 5s ease-out forwards';
        
        this.entitiesLayer.appendChild(shockwave);
        
        // 移除冲击波元素
        setTimeout(() => {
            if (shockwave.parentNode) {
                shockwave.parentNode.removeChild(shockwave);
            }
        }, 5000);
    }

    // 巨人僵尸特殊攻击：触发
    triggerGargantuarSpecialAttack(zombie) {
        const originalSpeed = zombie.speed;
        zombie.speed = 0;
        zombie.isAttacking = true; // 暂停时显示攻击状态
        zombie.element.classList.add('special-attacking'); // 可用于添加特殊视觉效果，如发光

        // 创建攻击提示
        const warningEffect = document.createElement('div');
        warningEffect.className = 'special-attack-warning';
        warningEffect.textContent = '雷霆万钧';
        warningEffect.style.left = `${zombie.x}%`;
        warningEffect.style.top = `${zombie.y - 15}%`; // 在僵尸头顶
        this.entitiesLayer.appendChild(warningEffect);

        // 1.5秒后执行攻击
        setTimeout(() => {
            this.executeGargantuarSpecialAttack(zombie);
            if (warningEffect.parentNode) {
                warningEffect.parentNode.removeChild(warningEffect);
            }
            zombie.speed = originalSpeed;
            zombie.isAttacking = false;
            zombie.element.classList.remove('special-attacking');
        }, 1500);
    }

    // 巨人僵尸特殊攻击：执行
    executeGargantuarSpecialAttack(zombie) {
        // 1. 特殊锤子攻击动画
        this.createSpecialHammerEffect(zombie);

        // 2. 计算落雷位置
        // 随机选择一个目标格子
        const targetCol = Math.floor(Math.random() * 9);
        const targetRow = Math.floor(Math.random() * 5);
        // 为了视觉效果，计算雷电的精确像素位置
        const lightningX = (targetCol + 0.5) * this.CELL_WIDTH;
        
        // 中心点坐标
        const centerX = targetCol * this.CELL_WIDTH + this.CELL_WIDTH / 2;
        const centerY = targetRow * this.CELL_HEIGHT + this.CELL_HEIGHT / 2;

        // 3. 制造落雷效果
        this.playSound('giant-special-attack.MP3');
        this.createLightningEffect(centerX, centerY);

        // 4. 对9宫格范围内的植物造成伤害
        const lightningDamage = 200; // 落雷伤害
        
        for (let r_offset = -1; r_offset <= 1; r_offset++) {
            for (let c_offset = -1; c_offset <= 1; c_offset++) {
                const checkRow = targetRow + r_offset;
                const checkCol = targetCol + c_offset;

                if (checkRow >= 0 && checkRow < this.ROWS && checkCol >= 0 && checkCol < this.COLS) {
                    const plant = this.grid[checkRow][checkCol] ? this.grid[checkRow][checkCol].plant : null;
                    if (plant) {
                        if (plant.shield && plant.shield.health > 0) {
                            const shieldHealthBefore = plant.shield.health;
                            plant.shield.health -= lightningDamage;
                            if (plant.shield.health <= 0) {
                                this.removeShield(plant);
                                // 伤害溢出到植物本体
                                plant.health -= (lightningDamage - shieldHealthBefore);
                            }
                        } else {
                            plant.health -= lightningDamage;
                        }

                        if (plant.health <= 0) {
                            this.removePlant(plant);
                        }
                    }
                }
            }
        }

        // 5. 对同区域内的僵尸（包括自己）造成相同伤害
        for (let j = this.zombies.length - 1; j >= 0; j--) {
            const targetZombie = this.zombies[j];
            const rowDiff = Math.abs(targetZombie.row - targetRow);
            if (rowDiff > 1) {
                continue;
            }

            const zombieCol = Math.max(0, Math.min(this.COLS - 1, Math.floor(targetZombie.x / this.CELL_WIDTH)));
            const colDiff = Math.abs(zombieCol - targetCol);
            if (colDiff > 1) {
                continue;
            }

            targetZombie.health -= lightningDamage;

            if (targetZombie.healthBar) {
                const healthPercent = Math.max(0, (targetZombie.health / targetZombie.maxHealth) * 100);
                targetZombie.healthBar.style.width = `${healthPercent}%`;
            }

            if (targetZombie.health <= 0) {
                this.removeZombie(j);
            }
        }
    }

    // 巨人僵尸特殊攻击：锤子效果
    createSpecialHammerEffect(zombie) {
        const hammerEffect = document.createElement('div');
        hammerEffect.className = 'hammer-effect special-hammer'; // Class applies the animation
        
        const img = document.createElement('img');
        img.src = 'hammer.png';
        img.alt = '雷霆之锤';
        img.style.width = '100%';
        img.style.height = '100%';
        hammerEffect.appendChild(img);
        
        hammerEffect.style.width = '50px';
        hammerEffect.style.height = '50px';
        hammerEffect.style.position = 'absolute';
        hammerEffect.style.left = `${zombie.x - 12}%`;
        hammerEffect.style.top = `${zombie.y - 8}%`;
        hammerEffect.style.zIndex = '35';
        hammerEffect.style.pointerEvents = 'none';
        
        this.entitiesLayer.appendChild(hammerEffect);
        
        setTimeout(() => {
            if (hammerEffect.parentNode) {
                hammerEffect.parentNode.removeChild(hammerEffect);
            }
        }, 600); // Match animation duration
    }

    // 巨人僵尸特殊攻击：落雷效果
    createLightningEffect(x, y) {
        const lightningEffect = document.createElement('div');
        lightningEffect.className = 'lightning-effect'; // Class applies the animation
        
        const img = document.createElement('img');
        img.src = 'lightning.png';
        img.alt = '落雷';
        
        const effectWidth = this.CELL_WIDTH * 3;
        const effectHeight = this.CELL_HEIGHT * 3;
        
        lightningEffect.style.position = 'absolute';
        lightningEffect.style.left = `${x}%`;
        lightningEffect.style.top = `${y}%`;
        lightningEffect.style.width = `${effectWidth}%`;
        lightningEffect.style.height = `${effectHeight}%`;
        lightningEffect.style.transform = 'translate(-50%, -50%)';
        lightningEffect.style.zIndex = '45';
        lightningEffect.style.pointerEvents = 'none';
        
        img.style.width = '100%';
        img.style.height = '100%';
        lightningEffect.appendChild(img);
        
        this.entitiesLayer.appendChild(lightningEffect);
        
        setTimeout(() => {
            if (lightningEffect.parentNode) {
                lightningEffect.parentNode.removeChild(lightningEffect);
            }
        }, 5000); // Match animation duration
    }
    
    // 基于元素当前PNG的粒子化消散特效，持续约1秒
    createDeathParticlesFromElement(element) {
        try {
            if (!element) return;
            const img = element.querySelector && element.querySelector('img');
            const src = img ? img.src : null;
            if (!src) return;
            const container = this.entitiesLayer;
            if (!container) return;

            const rect = element.getBoundingClientRect();
            const crect = container.getBoundingClientRect();
            const left = rect.left - crect.left;
            const top = rect.top - crect.top;
            const width = rect.width;
            const height = rect.height;

            const wrapper = document.createElement('div');
            wrapper.className = 'death-particles';
            wrapper.style.position = 'absolute';
            wrapper.style.left = left + 'px';
            wrapper.style.top = top + 'px';
            wrapper.style.width = width + 'px';
            wrapper.style.height = height + 'px';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.zIndex = '60';
            container.appendChild(wrapper);

            const rows = 8, cols = 8;
            const fragW = Math.max(2, Math.floor(width / cols));
            const fragH = Math.max(2, Math.floor(height / rows));
            const centerX = width / 2;
            const centerY = height / 2;

            const pieces = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const piece = document.createElement('div');
                    piece.style.position = 'absolute';
                    piece.style.left = (c * fragW) + 'px';
                    piece.style.top = (r * fragH) + 'px';
                    piece.style.width = fragW + 'px';
                    piece.style.height = fragH + 'px';
                    piece.style.backgroundImage = `url("${src}")`;
                    piece.style.backgroundRepeat = 'no-repeat';
                    piece.style.backgroundSize = width + 'px ' + height + 'px';
                    piece.style.backgroundPosition = `-${c * fragW}px -${r * fragH}px`;
                    piece.style.transition = 'transform 1s ease-out, opacity 1s linear, filter 1s linear';
                    piece.style.willChange = 'transform, opacity';
                    piece.style.transform = 'translate(0px, 0px) rotate(0deg)';
                    piece.style.opacity = '1';
                    wrapper.appendChild(piece);
                    pieces.push({ piece, r, c });
                }
            }

            // 触发动画
            requestAnimationFrame(() => {
                for (const { piece, r, c } of pieces) {
                    const px = (c + 0.5) * fragW;
                    const py = (r + 0.5) * fragH;
                    let vx = px - centerX;
                    let vy = py - centerY;
                    const len = Math.hypot(vx, vy) || 1;
                    vx /= len; vy /= len;
                    const magnitude = 40 + Math.random() * 60; // 像素
                    const jitterX = (Math.random() - 0.5) * 20;
                    const jitterY = (Math.random() - 0.5) * 20 - 10; // 稍向上
                    const dx = vx * magnitude + jitterX;
                    const dy = vy * magnitude + jitterY;
                    const rot = (Math.random() * 360 - 180).toFixed(1);
                    piece.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
                    piece.style.opacity = '0';
                    piece.style.filter = 'blur(1px)';
                }
            });

            // 1.1秒后清理
            setTimeout(() => {
                if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
            }, 1100);
        } catch (_) {
            // 忽略异常，避免影响主流程
        }
    }
}

window.addEventListener('load', () => {
    new PVZGame();
});
