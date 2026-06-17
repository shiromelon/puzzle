/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, X, Sparkles, Award } from 'lucide-react';
import { ChocolateType } from '../types';
import { CHOCOLATE_DICTIONARY } from '../utils/chocolateData';

interface RecipeBookProps {
  unlockedTypes: ChocolateType[];
  onClose: () => void;
}

export const RecipeBook: React.FC<RecipeBookProps> = ({ unlockedTypes, onClose }) => {
  const [selectedType, setSelectedType] = useState<ChocolateType | null>(
    unlockedTypes.length > 0 ? unlockedTypes[0] : null
  );

  const chocolateTypesList = Object.values(CHOCOLATE_DICTIONARY);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 15 }}
        className="bg-amber-995 border-2 border-yellow-600/40 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        style={{ backgroundColor: '#140801' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/40 bg-amber-950/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-amber-100 flex items-center gap-1.5 font-sans">
              ショコラ・レシピブック
              <span className="text-xs bg-yellow-950 text-yellow-400 border border-yellow-800/40 px-2 py-0.5 rounded-full">
                Unlocked {unlockedTypes.length}/{chocolateTypesList.length}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-900/30 text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          {/* Left Panel: Recipe Items List */}
          <div className="md:col-span-5 border-r border-amber-900/30 p-5 bg-amber-950/15 overflow-y-auto max-h-[50vh] md:max-h-full">
            <p className="text-xs text-amber-300/60 mb-3 uppercase tracking-wider font-mono">Chocolates Catalog</p>
            <div className="space-y-2">
              {chocolateTypesList.map((ch) => {
                const isUnlocked = unlockedTypes.includes(ch.type);
                const isCurrentlySelected = selectedType === ch.type;

                return (
                  <button
                    key={ch.type}
                    disabled={!isUnlocked}
                    onClick={() => setSelectedType(ch.type)}
                    className={`w-full text-left p-3.5 rounded-2xl flex items-center gap-3 border transition-all ${
                      !isUnlocked
                        ? 'bg-black/20 border-stone-900 text-stone-500 opacity-40 cursor-not-allowed justify-between'
                        : isCurrentlySelected
                        ? 'bg-gradient-to-r from-amber-900/60 to-transparent border-yellow-600/40 text-amber-100 shadow-md'
                        : 'bg-amber-970/45 border-amber-900/10 text-amber-300 hover:bg-amber-900/20'
                    }`}
                  >
                    <div className="text-2xl filter saturate-[1.2]">
                      {isUnlocked ? ch.emoji : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">
                        {isUnlocked ? ch.jpName : '未解禁のショコラ'}
                      </h4>
                      <p className="text-[10px] text-amber-400/70 truncate font-mono">
                        {isUnlocked ? ch.name : 'Unlocked in further level'}
                      </p>
                    </div>
                    {isUnlocked && isCurrentlySelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Detail Page */}
          <div className="md:col-span-7 p-6 flex flex-col justify-between overflow-y-auto">
            <AnimatePresence mode="wait">
              {selectedType && (
                <motion.div
                  key={selectedType}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-6"
                >
                  {/* Title and Badge */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${CHOCOLATE_DICTIONARY[selectedType].colorGradient} border border-yellow-600/30 flex items-center justify-center text-3xl shadow-xl shrink-0`}
                    >
                      <span className="filter saturate-[1.2]">
                        {CHOCOLATE_DICTIONARY[selectedType].emoji}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider block">
                        Gourmet Recipe
                      </span>
                      <h3 className="text-xl font-extrabold text-amber-100">
                        {CHOCOLATE_DICTIONARY[selectedType].jpName}
                      </h3>
                      <p className="text-xs text-amber-400 font-mono font-medium">
                        {CHOCOLATE_DICTIONARY[selectedType].name}
                      </p>
                    </div>
                  </div>

                  {/* Flavor Descr */}
                  <div className="space-y-2 bg-amber-950/20 p-4 border border-amber-900/10 rounded-2xl">
                    <h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#FFB060]">
                      Flavor Profile
                    </h5>
                    <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
                      {CHOCOLATE_DICTIONARY[selectedType].description}
                    </p>
                  </div>

                  {/* Secrets (調合比率 / 原料) */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400/70 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                      厳選原料とクラフト調合
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                      {CHOCOLATE_DICTIONARY[selectedType].ingredients.map((ing, i) => (
                        <div
                          key={i}
                          className="bg-amber-900/15 border border-amber-900/10 px-3 py-2 rounded-xl text-xs text-amber-300 flex items-center gap-2"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-700 shrink-0" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Point values */}
                  <div className="flex items-center gap-2 bg-yellow-950/20 border border-yellow-600/10 p-3.5 rounded-2xl text-xs text-yellow-400">
                    <Award className="w-4 h-4" />
                    <span>基礎品質スコア: </span>
                    <strong className="font-mono text-sm underline underline-offset-4 decoration-yellow-600/40">
                      {CHOCOLATE_DICTIONARY[selectedType].points} Pts / match
                    </strong>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="justify-center px-6 py-4 border-t border-amber-900/30 bg-amber-950/30 flex text-center">
          <p className="text-[10px] text-amber-500/80 font-mono">
            Choco Atelier Pastry Guild Recipe Codex © 2026
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
