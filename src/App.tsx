/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  Trophy,
  Sparkles,
  BookOpen,
  ShoppingBag,
  RotateCcw,
  Lock,
  Hammer,
  Play,
  ArrowRight,
  CheckCircle,
  Home
} from 'lucide-react';

import { ChocolateType, LevelConfig, CustomerOrder, UpgradeItem } from './types';
import { LEVELS, CHOCOLATE_DICTIONARY, SHOP_ITEMS } from './utils/chocolateData';
import { GameBoard } from './components/GameBoard';
import { OrderList } from './components/OrderList';
import { RecipeBook } from './components/RecipeBook';
import { ShopPopup } from './components/ShopPopup';
import { audio } from './utils/AudioEngine';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'TITLE' | 'GAME' | 'RESULTS' | 'GAMEOVER'>('TITLE');
  
  // Persistence States
  const [coins, setCoins] = useState<number>(() => {
    const saved = localStorage.getItem('choco_atelier_coins');
    return saved ? parseInt(saved) : 100; // Start with 100 coins
  });
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('choco_atelier_unlocked_level');
    return saved ? parseInt(saved) : 1;
  });
  const [purchasedUpgrades, setPurchasedUpgrades] = useState<string[]>(() => {
    const saved = localStorage.getItem('choco_atelier_upgrades');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeSkin, setActiveSkin] = useState<string>(() => {
    return localStorage.getItem('choco_atelier_active_skin') || 'none';
  });
  const [activeBgm, setActiveBgm] = useState<string>(() => {
    return localStorage.getItem('choco_atelier_active_bgm') || 'none';
  });

  // Game Play States
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [activeLevel, setActiveLevel] = useState<LevelConfig | null>(null);
  const [score, setScore] = useState<number>(0);
  const [isLevelCleared, setIsLevelCleared] = useState<boolean>(false);
  const [movesLeft, setMovesLeft] = useState<number>(0);
  const [activeCustomer, setActiveCustomer] = useState<CustomerOrder | null>(null);
  const [comboCount, setComboCount] = useState<number>(0);
  const [useSpatulaItem, setUseSpatulaItem] = useState<boolean>(false);
  const [useMittenItem, setUseMittenItem] = useState<boolean>(false);
  const [spatulaUsedInLevel, setSpatulaUsedInLevel] = useState<boolean>(false);
  const [mistUsedInLevel, setMistUsedInLevel] = useState<boolean>(false);
  const [mittenUsedInLevel, setMittenUsedInLevel] = useState<boolean>(false);
  const [mistTrigger, setMistTrigger] = useState<number>(0);
  const [levelUpStars, setLevelUpStars] = useState<number>(3);
  const [boardAnimating, setBoardAnimating] = useState<boolean>(false);

  // Overlays / Modals
  const [showRecipes, setShowRecipes] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Sync to Storage
  useEffect(() => {
    localStorage.setItem('choco_atelier_coins', coins.toString());
  }, [coins]);

  useEffect(() => {
    localStorage.setItem('choco_atelier_unlocked_level', maxUnlockedLevel.toString());
  }, [maxUnlockedLevel]);

  useEffect(() => {
    localStorage.setItem('choco_atelier_upgrades', JSON.stringify(purchasedUpgrades));
  }, [purchasedUpgrades]);

  useEffect(() => {
    localStorage.setItem('choco_atelier_active_skin', activeSkin);
  }, [activeSkin]);

  useEffect(() => {
    localStorage.setItem('choco_atelier_active_bgm', activeBgm);
  }, [activeBgm]);

  // BGM Auto Control Trigger
  useEffect(() => {
    if (activeBgm === 'none' || isMuted) {
      audio.stopBGM();
      return;
    }
    const playableScreens = ['TITLE', 'GAME'];
    if (playableScreens.includes(currentScreen)) {
      const audioType = activeBgm === 'bgm_orgel' ? 'orgel' : activeBgm === 'bgm_jazz' ? 'jazz' : 'none';
      audio.startBGM(audioType);
    } else {
      audio.stopBGM();
    }
    return () => {
      audio.stopBGM();
    };
  }, [activeBgm, currentScreen, isMuted]);

  // Check game victory conditions on moves or score shifts
  useEffect(() => {
    if (currentScreen !== 'GAME' || !activeLevel || !activeCustomer || isLevelCleared) return;

    // Check if customer orders are fully satisfied
    const isCustomerSatisfied = Object.keys(activeCustomer.requirements).every((key) => {
      const type = key as ChocolateType;
      return (activeCustomer.fulfilled[type] || 0) >= (activeCustomer.requirements[type] || 0);
    });

    // Handle Satisfaction Sound chime
    if (isCustomerSatisfied && !activeCustomer.isSatisfied) {
      setActiveCustomer((prev) => (prev ? { ...prev, isSatisfied: true } : null));
      audio.playChime();
    }

    // Victory constraint: Customer satisfied AND score reached target
    if (isCustomerSatisfied && score >= activeLevel.targetScore) {
      // Small check to let cascade finish, but if they already cleared, let's allow it as soon as board settles
      if (!boardAnimating) {
        triggerLevelClear();
      }
    } else if (movesLeft <= 0 && !boardAnimating) {
      // Out of moves AND no Board animations are active
      const timeout = setTimeout(() => {
        // Redouble-check in case a Cascade match saved us on the final turn
        if (isCustomerSatisfied && score >= activeLevel.targetScore) {
          triggerLevelClear();
        } else {
          setCurrentScreen('GAMEOVER');
          audio.playError();
        }
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [score, movesLeft, activeCustomer, activeLevel, currentScreen, isLevelCleared, boardAnimating]);

  const triggerLevelClear = () => {
    if (!activeLevel || !activeCustomer || isLevelCleared) return;
    setIsLevelCleared(true);

    // Calculate rating stars
    const movesPercentage = (movesLeft / activeLevel.maxMoves) * 105; // adjustment
    let stars = 1;
    if (movesPercentage >= 40) {
      stars = 3;
    } else if (movesPercentage >= 15) {
      stars = 2;
    }
    setLevelUpStars(stars);

    // Compute coin rewards with Optional Royal Patron bonus (+50% coins)
    const baseReward = activeCustomer.rewardCoins + (stars === 3 ? 50 : stars === 2 ? 20 : 0);
    const hasPatron = purchasedUpgrades.includes('patron');
    const reward = hasPatron ? Math.round(baseReward * 1.5) : baseReward;
    setCoins((prev) => prev + reward);

    // Progression Unlock next level
    if (selectedLevelId === maxUnlockedLevel && selectedLevelId < LEVELS.length) {
      setMaxUnlockedLevel(selectedLevelId + 1);
    }

    setTimeout(() => {
      audio.playLevelUp();
      setCurrentScreen('RESULTS');
    }, 500);
  };

  const startLevel = (levelId: number) => {
    const config = LEVELS.find((l) => l.id === levelId);
    if (!config) return;

    setSelectedLevelId(levelId);

    const hasAromaCandle = purchasedUpgrades.includes('candle');
    const extraMoves = hasAromaCandle ? 3 : 0;

    setActiveLevel(config);
    setScore(0);
    setIsLevelCleared(false);
    setMovesLeft(config.maxMoves + extraMoves);
    setComboCount(0);
    setUseSpatulaItem(false);
    setUseMittenItem(false);
    setSpatulaUsedInLevel(false);
    setMistUsedInLevel(false);
    setMittenUsedInLevel(false);
    setMistTrigger(0);

    // Bootstrap first customer order template
    const rawCust = config.customers[0];
    const initialCustomer: CustomerOrder = {
      ...rawCust,
      fulfilled: {},
      isSatisfied: false,
    };
    setActiveCustomer(initialCustomer);
    setCurrentScreen('GAME');
    audio.playSwipe();

    // Trigger BGM actively if user set one (ensures autoplay kicks in on manual swipe trigger)
    if (activeBgm !== 'none' && !isMuted) {
      const audioType = activeBgm === 'bgm_orgel' ? 'orgel' : activeBgm === 'bgm_jazz' ? 'jazz' : 'none';
      audio.startBGM(audioType);
    }
  };

  const handleMatchCount = (type: ChocolateType, count: number) => {
    if (currentScreen !== 'GAME' || isLevelCleared || !activeCustomer) return;

    // Apply ribbon upgrade score bonus (+15%)
    const hasRibbon = purchasedUpgrades.includes('ribbon');
    const multiplier = hasRibbon ? 1.15 : 1.0;

    // Add score proportional to multiplier
    const incrementalScore = Math.round(count * CHOCOLATE_DICTIONARY[type].points * multiplier);
    setScore((prev) => {
      if (isLevelCleared) return prev;
      return prev + incrementalScore;
    });

    // Fill orders
    setActiveCustomer((prev) => {
      if (!prev || isLevelCleared) return prev || null;
      const originalCount = prev.fulfilled[type] || 0;
      return {
        ...prev,
        fulfilled: {
          ...prev.fulfilled,
          [type]: originalCount + count,
        },
      };
    });
  };

  const handleSetScoreFromBoard = (val: React.SetStateAction<number>) => {
    if (isLevelCleared || currentScreen !== 'GAME') return;
    setScore(val);
  };

  const toggleMute = () => {
    const status = audio.toggleMute();
    setIsMuted(status);
  };

  const handleBuyItem = (itemId: string, cost: number) => {
    if (coins < cost) return;
    setCoins((p) => p - cost);
    setPurchasedUpgrades((p) => [...p, itemId]);
    audio.playChime();
  };

  // Obtain array of currently unlocked chocolate types to view in recipe book
  const getUnlockedTypes = (): ChocolateType[] => {
    const unlocked = new Set<ChocolateType>([ChocolateType.MILK, ChocolateType.STRAWBERRY]);
    LEVELS.forEach((level) => {
      if (level.id <= maxUnlockedLevel) {
        level.allowedTypes.forEach((t) => unlocked.add(t));
      }
    });
    return Array.from(unlocked);
  };

  // Active items mapping for upgrades
  const masterUpgradesList: UpgradeItem[] = SHOP_ITEMS.map((item) => ({
    ...item,
    purchased: purchasedUpgrades.includes(item.id),
  }));

  const hasSpatulaOwned = purchasedUpgrades.includes('spatula');
  const hasMistOwned = purchasedUpgrades.includes('mist');
  const hasMittenOwned = purchasedUpgrades.includes('mitten');
  const hasPatronOwned = purchasedUpgrades.includes('patron');

  return (
    <div className="min-h-screen text-amber-100 flex flex-col font-sans transition-colors relative" style={{ backgroundColor: '#0A0300' }}>
      
      {/* Background Sweet Design Accents */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-radial-gradient from-amber-950/20 to-transparent pointer-events-none" />

      {/* Main Header / Toolbar */}
      <header className="px-6 py-4 border-b border-amber-900/40 bg-amber-970/40 backdrop-blur-md relative z-40 flex items-center justify-between">
        <div 
          onClick={() => setCurrentScreen('TITLE')} 
          className="flex items-center gap-2 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border border-yellow-600/30 flex items-center justify-center text-xl shadow-md group-hover:scale-105 transition-transform">
            🍫
          </div>
          <div>
            <h1 className="font-extrabold text-base md:text-lg tracking-tight text-amber-100 leading-tight">
              ショコラ・アトリエ
            </h1>
            <span className="text-[10px] text-amber-400 font-mono tracking-wider">CHOCO ATELIER</span>
          </div>
        </div>

        {/* Global Toolbar tools */}
        <div className="flex items-center gap-3.5">
          {/* Coins Bar */}
          <div className="flex items-center gap-1 bg-amber-950/55 border border-yellow-600/20 px-3 py-1.5 rounded-full font-mono font-bold text-xs text-yellow-400 shadow-inner">
            <span>🪙</span>
            <span>{coins}</span>
          </div>

          <button
            onClick={() => setShowRecipes(true)}
            className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/35 text-amber-300 hover:bg-amber-900/30 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">レシピ</span>
          </button>

          <button
            onClick={() => setShowShop(true)}
            className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/35 text-amber-300 hover:bg-amber-900/30 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden md:inline">ブティック</span>
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-amber-950/40 border border-amber-900/35 text-amber-400 hover:bg-amber-900/30 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Play Stage */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          
          {/* LEVEL 1: TITLE SCREEN */}
          {currentScreen === 'TITLE' && (
            <motion.div
              key="screen_title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl text-center space-y-8 py-10"
            >
              {/* Splendid Title Emblem */}
              <div className="space-y-4">
                <motion.div 
                  className="inline-block relative p-4 mb-2"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                >
                  <div className="absolute inset-0 bg-yellow-500/10 blur-2xl rounded-full" />
                  <span className="text-7xl sm:text-8xl select-none filter drop-shadow-[0_10px_20px_rgba(251,191,36,0.25)]">
                    🍫🍒
                  </span>
                </motion.div>
                
                <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
                  ショコラ・アトリエ
                </h2>
                <p className="text-sm text-amber-300 max-w-md mx-auto leading-relaxed">
                  素材を吟味し、究極のチョコレートを仕分け・梱包するパズル。極上ショコラティエのアトリエへようこそ。
                </p>
              </div>

              {/* Levels Selection Section */}
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="font-bold text-amber-100 flex items-center justify-center gap-1.5 text-sm uppercase tracking-wider">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  仕分けミッション選択
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {LEVELS.map((level) => {
                    const isUnlocked = level.id <= maxUnlockedLevel;

                    return (
                      <button
                        key={level.id}
                        disabled={!isUnlocked}
                        onClick={() => {
                          setSelectedLevelId(level.id);
                          startLevel(level.id);
                        }}
                        className={`p-4 rounded-2xl text-left border flex flex-col justify-between h-[120px] transition-all relative overflow-hidden group ${
                          !isUnlocked
                            ? 'bg-black/40 border-stone-900 text-stone-600 cursor-not-allowed opacity-50'
                            : level.id === selectedLevelId
                            ? 'bg-gradient-to-br from-amber-900/50 to-amber-950/80 border-yellow-500 text-white shadow-lg scale-[1.01]'
                            : 'bg-amber-970/40 border-amber-900/20 text-amber-200 hover:bg-amber-950/30'
                        }`}
                      >
                        {/* Miniature lock overlay */}
                        {!isUnlocked ? (
                          <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-stone-950/80 border border-stone-800">
                            <Lock className="w-3.5 h-3.5 text-stone-500" />
                          </div>
                        ) : (
                          <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-amber-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                          </div>
                        )}

                        <div>
                          <span className="text-[10px] font-bold text-amber-400 block font-mono">
                            MISSION 0{level.id}
                          </span>
                          <h4 className="font-extrabold text-sm truncate mt-1">
                            {level.jpName.replace('レベル ' + level.id + '', '')}
                          </h4>
                        </div>

                        {/* Unlocked chocolaty ingredients previews */}
                        {isUnlocked && (
                          <div className="flex items-center gap-1 mt-2">
                            {level.allowedTypes.map((type) => (
                              <span key={type} className="text-xs filter saturate-105" title={CHOCOLATE_DICTIONARY[type].jpName}>
                                {CHOCOLATE_DICTIONARY[type].emoji}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectedLevelId(maxUnlockedLevel);
                    startLevel(maxUnlockedLevel);
                  }}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-amber-950 font-bold text-sm tracking-wider flex items-center gap-2 shadow-lg hover:scale-103 transition-transform cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  すぐに作業を開始する
                </button>
              </div>
            </motion.div>
          )}

          {/* LEVEL 2: PASSIVE ACTIVE ACTIVE PLAY COURT */}
          {currentScreen === 'GAME' && activeLevel && activeCustomer && (
            <motion.div
              key="screen_game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 py-2"
            >
              {/* Left Column: Dashboard status counters */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-4">
                {/* Level Title and Goal point gauge */}
                <div className="bg-amber-950/45 border border-amber-900/25 p-5 rounded-3xl shadow-md relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-[3px] bg-gradient-to-r from-yellow-500 to-transparent" />
                  
                  <span className="text-[10px] text-amber-400 font-mono tracking-widest block uppercase">
                    Current Atelier Atelier
                  </span>
                  <h3 className="font-extrabold text-lg text-amber-100 mt-1 leading-tight">
                    {activeLevel.jpName}
                  </h3>
                  <p className="text-xs text-amber-300/80 mt-1.5 leading-relaxed">
                    {activeLevel.description}
                  </p>

                  {/* Level Goal and Progress metric */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between items-end text-xs">
                      <span className="text-amber-400/80">目標品質スコア:</span>
                      <span className="font-mono text-sm font-bold text-yellow-400">
                        {score} <span className="text-amber-500">/ {activeLevel.targetScore}</span>
                      </span>
                    </div>

                    {/* Progress Bar with elegant gloss */}
                    <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden relative shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (score / activeLevel.targetScore) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Leftover Moves visual radial / big numbers */}
                <div className="bg-amber-950/35 border border-amber-900/20 p-5 rounded-3xl flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-[10px] text-amber-400 font-mono tracking-widest block uppercase">
                      Packaging Moves
                    </span>
                    <h4 className="text-xs text-amber-300/80 mt-0.5">残りの仕分け手数</h4>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className={`text-4xl font-extrabold font-mono tracking-tighter ${
                      movesLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-amber-100'
                    }`}>
                      {movesLeft}
                    </span>
                    <span className="text-[8px] font-bold text-amber-500 uppercase font-mono">Moves Left</span>
                  </div>
                </div>

                {/* Crafting Tools panel */}
                <div className="bg-amber-950/20 border border-amber-900/15 p-4 rounded-3xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400">
                      Chocolatier Tools
                    </h4>
                    <span className="text-[8px] font-bold text-amber-500 uppercase font-mono font-bold">レベル内各1回限り</span>
                  </div>

                  {/* Power-up Tools Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {/* Spatula Hammer */}
                    <button
                      disabled={!hasSpatulaOwned || spatulaUsedInLevel}
                      onClick={() => {
                        setUseMittenItem(false); // 排他
                        setUseSpatulaItem(!useSpatulaItem);
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all shadow cursor-pointer ${
                        !hasSpatulaOwned
                          ? 'bg-black/30 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                          : spatulaUsedInLevel
                          ? 'bg-stone-900/50 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed line-through'
                          : useSpatulaItem
                          ? 'bg-yellow-500 text-amber-950 border-yellow-400 scale-[1.03] ring-2 ring-yellow-400/50'
                          : 'bg-amber-950/50 border-amber-900/30 text-amber-300 hover:bg-amber-900/30'
                      }`}
                    >
                      <span className="text-xl mb-0.5">🧹</span>
                      <span className="text-[9px] font-bold leading-tight">極上スパチュラ</span>
                      {spatulaUsedInLevel && (
                        <span className="absolute top-1 right-1 text-[7px] bg-stone-700 text-white font-mono px-0.5 rounded scale-90">済</span>
                      )}
                      {!hasSpatulaOwned && (
                        <span className="absolute top-1 right-1 text-[7px] bg-amber-900 text-amber-300 font-mono px-0.5 rounded scale-90">未</span>
                      )}
                    </button>

                    {/* Mitten */}
                    <button
                      disabled={!hasMittenOwned || mittenUsedInLevel}
                      onClick={() => {
                        setUseSpatulaItem(false); // 排他
                        setUseMittenItem(!useMittenItem);
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all shadow cursor-pointer ${
                        !hasMittenOwned
                          ? 'bg-black/30 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                          : mittenUsedInLevel
                          ? 'bg-stone-900/50 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed line-through'
                          : useMittenItem
                          ? 'bg-yellow-500 text-amber-950 border-yellow-400 scale-[1.03] ring-2 ring-yellow-400/50'
                          : 'bg-amber-950/50 border-amber-900/30 text-amber-300 hover:bg-amber-900/30'
                      }`}
                    >
                      <span className="text-xl mb-0.5">🧤</span>
                      <span className="text-[9px] font-bold leading-tight">パズルミトン</span>
                      {mittenUsedInLevel && (
                        <span className="absolute top-1 right-1 text-[7px] bg-stone-700 text-white font-mono px-0.5 rounded scale-90">済</span>
                      )}
                      {!hasMittenOwned && (
                        <span className="absolute top-1 right-1 text-[7px] bg-amber-900 text-amber-300 font-mono px-0.5 rounded scale-90">未</span>
                      )}
                    </button>

                    {/* Magic Mist */}
                    <button
                      disabled={!hasMistOwned || mistUsedInLevel}
                      onClick={() => {
                        if (!hasMistOwned || mistUsedInLevel || isLevelCleared) return;
                        setMistUsedInLevel(true);
                        setMistTrigger((prev) => prev + 1);
                        audio.playSwipe();
                      }}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all shadow cursor-pointer ${
                        !hasMistOwned
                          ? 'bg-black/30 border-stone-900 text-stone-600 opacity-40 cursor-not-allowed'
                          : mistUsedInLevel
                          ? 'bg-stone-900/50 border-stone-800 text-stone-500 opacity-60 cursor-not-allowed line-through'
                          : 'bg-amber-950/50 border-amber-900/30 text-amber-300 hover:bg-amber-900/30'
                      }`}
                    >
                      <span className="text-xl mb-0.5">✨</span>
                      <span className="text-[9px] font-bold leading-tight">マジックミスト</span>
                      {mistUsedInLevel && (
                        <span className="absolute top-1 right-1 text-[7px] bg-stone-700 text-white font-mono px-0.5 rounded scale-90">済</span>
                      )}
                      {!hasMistOwned && (
                        <span className="absolute top-1 right-1 text-[7px] bg-amber-900 text-amber-300 font-mono px-0.5 rounded scale-90">未</span>
                      )}
                    </button>
                  </div>

                  {/* General Actions */}
                  <div className="flex gap-2 pt-1.5 border-t border-amber-900/10">
                    <button
                      onClick={() => startLevel(selectedLevelId)}
                      className="flex-1 py-2 rounded-xl bg-amber-950/35 border border-amber-900/25 text-amber-400 hover:bg-amber-900/20 hover:text-amber-200 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      title="レベルをやり直す"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      やり直す
                    </button>
                    
                    <button
                      onClick={() => setCurrentScreen('TITLE')}
                      className="flex-1 py-2 rounded-xl bg-amber-950/35 border border-amber-900/25 text-amber-400 hover:bg-amber-900/20 hover:text-amber-200 transition-all text-xs font-semibold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                      title="メニューに戻る"
                    >
                      <Home className="w-3.5 h-3.5" />
                      タイトルへ
                    </button>
                  </div>
                  
                  {(!hasSpatulaOwned || !hasMittenOwned || !hasMistOwned) && (
                    <p className="text-[9px] text-amber-500/80 leading-relaxed text-center">
                      🔒 ロックされている道具は、画面上の「ブティック」からコインで購入して開放できます！
                    </p>
                  )}
                </div>
              </div>

              {/* Center GameBoard and Bottom Order Status */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Active Grid GameBoard */}
                <GameBoard
                  levelId={selectedLevelId}
                  allowedTypes={activeLevel.allowedTypes}
                  initialObstacles={activeLevel.initialObstacles}
                  maxMoves={activeLevel.maxMoves}
                  movesLeft={movesLeft}
                  setMovesLeft={setMovesLeft}
                  score={score}
                  setScore={handleSetScoreFromBoard}
                  onChocolateMatch={handleMatchCount}
                  comboCount={comboCount}
                  setComboCount={setComboCount}
                  useSpatulaItem={useSpatulaItem && !spatulaUsedInLevel}
                  setUseSpatulaItem={setUseSpatulaItem}
                  hasSpatulaUpgrade={hasSpatulaOwned}
                  onUseSpatulaComplete={() => setSpatulaUsedInLevel(true)}
                  useMittenItem={useMittenItem && !mittenUsedInLevel}
                  setUseMittenItem={setUseMittenItem}
                  hasMittenUpgrade={hasMittenOwned}
                  onUseMittenComplete={() => setMittenUsedInLevel(true)}
                  hasMistUpgrade={hasMistOwned}
                  mistTrigger={mistTrigger}
                  isLevelCleared={isLevelCleared}
                  activeSkin={activeSkin}
                  isAnimating={boardAnimating}
                  setIsAnimating={setBoardAnimating}
                />

                {/* Customer gourmet checklist details */}
                <OrderList customer={activeCustomer} />

              </div>

              {/* Calligraphy Cascade Combo Display */}
              <AnimatePresence>
                {comboCount >= 2 && (
                  <motion.div
                    key={`combo_${comboCount}`}
                    initial={{ opacity: 0, scale: 0.5, y: 30, rotate: -8 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [0.5, 1.2, 1], 
                      y: 0, 
                      rotate: -3,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 15
                      }
                    }}
                    exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.25 } }}
                    className="fixed right-4 md:right-8 bottom-24 lg:bottom-auto lg:top-1/3 z-50 pointer-events-none"
                  >
                    <div 
                      className="relative bg-[#170904]/90 border-2 border-yellow-500/40 backdrop-blur-md px-6 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col items-center text-center max-w-[220px]"
                      style={{
                        boxShadow: '0 15px 35px rgba(0,0,0,0.8), inset 0 0 12px rgba(251, 191, 36, 0.15)'
                      }}
                    >
                      {/* Intricate Ornate Border Accents */}
                      <div className="absolute top-1.5 inset-x-2 flex justify-between items-center opacity-40">
                        <span className="text-[6px] text-yellow-500 font-serif">✿</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-1" />
                        <span className="text-[6px] text-yellow-500 font-serif">✿</span>
                      </div>
                      
                      {/* Title Tag */}
                      <span className="text-[9px] font-bold text-amber-400 tracking-[0.25em] uppercase mb-1 font-mono">
                        Cascade Series
                      </span>

                      {/* Dynamic calligraphic COMBO Counter */}
                      <h3 
                        className="font-serif italic font-black bg-gradient-to-b from-amber-200 via-yellow-400 to-yellow-600 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] leading-none select-none my-1 filter saturate-[1.1]"
                        style={{
                          fontSize: `${2.5 + Math.min(comboCount * 0.4, 2.0)}rem`
                        }}
                      >
                        Combo x{comboCount}
                      </h3>

                      {/* Beautiful flourish line divider */}
                      <div className="w-full flex items-center justify-center gap-2 my-1.5 opacity-60">
                        <div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-yellow-500/50" />
                        <span className="text-yellow-400 text-[10px] animate-spin" style={{ animationDuration: '4s' }}>✦</span>
                        <div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-yellow-500/50" />
                      </div>

                      {/* Calligraphy subtext in French + Japanese */}
                      <div className="space-y-0.5">
                        <span className="font-serif italic text-xs text-amber-200 block drop-shadow-sm">
                          {comboCount === 2 && "L'Élégance"}
                          {comboCount === 3 && "Le Mariage"}
                          {comboCount === 4 && "La Symphonie"}
                          {comboCount === 5 && "Le Chef-d'œuvre"}
                          {comboCount >= 6 && "La Légende"}
                        </span>
                        <span className="text-[9px] font-bold text-amber-400/80 block">
                          {comboCount === 2 && "優美なガナッシュ"}
                          {comboCount === 3 && "至高のマリアージュ"}
                          {comboCount === 4 && "職人の協奏曲"}
                          {comboCount === 5 && "奇跡のアソート"}
                          {comboCount >= 6 && "伝説のショコラティエ"}
                        </span>
                      </div>

                      {/* Little Sparkles */}
                      <div className="absolute -top-1 -right-1 text-xs animate-bounce" style={{ animationDelay: '0.1s' }}>✨</div>
                      <div className="absolute -bottom-1 -left-1 text-xs animate-bounce" style={{ animationDelay: '0.4s' }}>✨</div>
                      
                      {/* Intricate Bottom Ornate Accent */}
                      <div className="absolute bottom-1.5 inset-x-2 flex justify-between items-center opacity-40">
                        <span className="text-[6px] text-yellow-500 font-serif">✿</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-1" />
                        <span className="text-[6px] text-yellow-500 font-serif">✿</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          )}

          {/* LEVEL 3: RESULTS / LEVEL CLEAR OVERLAY SCREEN */}
          {currentScreen === 'RESULTS' && activeLevel && (
            <motion.div
              key="screen_results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-amber-995 border-2 border-yellow-500/55 p-8 rounded-3xl shadow-2xl text-center space-y-6 relative"
              style={{ backgroundColor: '#130701' }}
            >
              {/* Ribbon Deco */}
              <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-yellow-500 via-amber-600 to-yellow-500 rounded-t-3xl" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-900 rounded-full border border-yellow-500 flex items-center justify-center text-xl shadow-lg">
                💝
              </div>

              <div className="space-y-4 pt-4">
                <span className="text-xs text-yellow-500 font-bold uppercase tracking-widest font-mono block">
                  Mission Complete
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  おめでとうございます！
                </h3>
                <p className="text-xs text-amber-300 max-w-md mx-auto leading-relaxed">
                  素晴らしい職人技です。仕分けされたチョコレートボックスは、美しく包装され配送トラックに積み込まれました！
                </p>
              </div>

              {/* Rating Celebrations Stars */}
              <div className="flex justify-center items-center gap-3.5 py-2">
                {[1, 2, 3].map((starNum) => {
                  const isGold = starNum <= levelUpStars;
                  return (
                    <motion.span
                      key={starNum}
                      initial={{ scale: 0.5, rotate: -20 }}
                      animate={{ scale: isGold ? 1.2 : 0.8, rotate: 0 }}
                      transition={{ delay: 0.2 + starNum * 0.15, type: 'spring' }}
                      className={`text-4xl ${isGold ? 'text-yellow-400 filter drop-shadow' : 'text-stone-800'}`}
                    >
                      ★
                    </motion.span>
                  );
                })}
              </div>

              {/* Summary Points Card */}
              <div className="bg-amber-950/40 p-4 border border-amber-900/30 rounded-2xl flex flex-col justify-center gap-2 divide-y divide-amber-900/20 text-xs">
                <div className="flex items-center justify-between pb-2 text-amber-300/80">
                  <span>獲得アソートスコア:</span>
                  <span className="font-mono font-bold text-sm text-yellow-400">{score} pts</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-amber-300/80">
                  <span>獲得コイン報酬:</span>
                  <span className="font-mono font-bold text-sm text-yellow-400">
                    🪙 +{activeCustomer?.rewardCoins}
                  </span>
                </div>
                {levelUpStars === 3 && (
                  <div className="flex items-center justify-between pt-2 text-emerald-400 font-bold">
                    <span>完美クリアボーナス:</span>
                    <span>🪙 +50 Extra</span>
                  </div>
                )}
              </div>

              {/* Navigation Actions */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCurrentScreen('TITLE')}
                  className="flex-1 px-5 py-3.5 rounded-full border border-amber-900/30 font-bold text-xs text-amber-300 hover:bg-amber-950/40 transition-colors uppercase cursor-pointer"
                >
                  ミッション一覧へ
                </button>
                {selectedLevelId < LEVELS.length ? (
                  <button
                    onClick={() => {
                      const nextL = selectedLevelId + 1;
                      setSelectedLevelId(nextL);
                      startLevel(nextL);
                    }}
                    className="flex-1 px-5 py-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-amber-950 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform cursor-pointer"
                  >
                    <span>次のレベルへ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentScreen('TITLE')}
                    className="flex-1 px-5 py-3.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-amber-950 font-bold text-xs tracking-wider cursor-pointer"
                  >
                    全ミッションクリア！大団円
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* LEVEL 4: GAME OVER / FAILED SCREEN */}
          {currentScreen === 'GAMEOVER' && activeLevel && (
            <motion.div
              key="screen_fail"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-stone-900 border-2 border-red-900/55 p-8 rounded-3xl shadow-2xl text-center space-y-6"
              style={{ backgroundColor: '#130400' }}
            >
              <div className="space-y-3">
                <span className="text-4xl block">🍪</span>
                <span className="text-xs text-red-400 font-bold uppercase tracking-widest font-mono block">
                  Order Incomplete
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  手数が不足してしまいました
                </h3>
                <p className="text-xs text-amber-300 max-w-md mx-auto leading-relaxed">
                  お届け用のチョコレートが足りないか、目標の品質アソートスコアに届きませんでした。アトリエをリフレッシュして再挑戦しましょう。
                </p>
              </div>

              {/* Progress Summary cards */}
              {activeCustomer && (
                <div className="bg-amber-950/25 p-4 border border-amber-900/20 rounded-2xl space-y-2 text-xs">
                  <div className="flex justify-between text-amber-300">
                    <span>達成品質スコア:</span>
                    <span className="font-mono font-bold text-red-300">{score} / {activeLevel.targetScore}</span>
                  </div>
                  <div className="text-left mt-2.5">
                    <span className="text-[10px] uppercase font-mono font-bold text-amber-500 block mb-1">未完成の仕分け注文</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(activeCustomer.requirements).map((key) => {
                        const type = key as ChocolateType;
                        const req = activeCustomer.requirements[type] || 0;
                        const got = activeCustomer.fulfilled[type] || 0;
                        const dict = CHOCOLATE_DICTIONARY[type] || { emoji: '🍫', jpName: 'チョコレート' };
                        const isOk = got >= req;

                        return (
                          <div key={type} className={`p-1.5 rounded-lg border text-[11px] flex justify-between ${
                            isOk ? 'bg-emerald-950/15 border-emerald-600/25 text-emerald-200' : 'bg-red-950/15 border-red-900/25 text-red-200'
                          }`}>
                            <span>{dict.emoji} {dict.jpName}</span>
                            <span>{got}/{req}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Recovery tips and navigation menu */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setCurrentScreen('TITLE')}
                  className="flex-1 px-5 py-3.5 rounded-full border border-amber-900/30 font-bold text-xs text-amber-300 hover:bg-amber-950/40 transition-colors cursor-pointer"
                >
                  ミッション一覧へ
                </button>
                <button
                  onClick={() => startLevel(selectedLevelId)}
                  className="flex-1 px-5 py-3.5 rounded-full bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-400 hover:to-amber-500 text-amber-950 font-bold text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-md hover:scale-102 transition-transform cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  もう一度仕分けに挑む
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Recipe Book Overlay Modal */}
      <AnimatePresence>
        {showRecipes && (
          <RecipeBook
            unlockedTypes={getUnlockedTypes()}
            onClose={() => setShowRecipes(false)}
          />
        )}
      </AnimatePresence>

      {/* Boutique Shop Overlay Modal */}
      <AnimatePresence>
        {showShop && (
          <ShopPopup
            coins={coins}
            items={masterUpgradesList}
            onBuyItem={handleBuyItem}
            activeSkin={activeSkin}
            onEquipSkin={setActiveSkin}
            activeBgm={activeBgm}
            onEquipBgm={setActiveBgm}
            onClose={() => setShowShop(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
