/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Check, Eye, Music, Award } from 'lucide-react';
import { UpgradeItem } from '../types';
import { audio } from '../utils/AudioEngine';

interface ShopPopupProps {
  coins: number;
  items: UpgradeItem[];
  onBuyItem: (id: string, cost: number) => void;
  activeSkin: string;
  onEquipSkin: (id: string) => void;
  activeBgm: string;
  onEquipBgm: (id: string) => void;
  onClose: () => void;
}

export const ShopPopup: React.FC<ShopPopupProps> = ({
  coins,
  items,
  onBuyItem,
  activeSkin,
  onEquipSkin,
  activeBgm,
  onEquipBgm,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'booster' | 'skin' | 'bgm'>('booster');

  // Filter items by category
  const filteredItems = items.filter((item) => (item.category || 'booster') === activeTab);

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
        className="bg-amber-995 border-2 border-yellow-600/40 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: '#140801' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/40 bg-amber-950/40">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-amber-100 font-sans">アトリエ・ブティック (Atelier Shop)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-amber-900/30 text-amber-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level coins and summary stats */}
        <div className="px-6 py-3 bg-yellow-950/20 border-b border-yellow-600/15 flex justify-between items-center text-sm">
          <span className="text-amber-400 font-medium">現在の手持ちコイン:</span>
          <div className="flex items-center gap-1.5 text-yellow-400 font-mono font-bold text-lg">
            <span>🪙</span>
            <span>{coins}</span>
          </div>
        </div>

        {/* Elegant Category Switching Tabs */}
        <div className="flex border-b border-amber-900/20 bg-amber-950/10 p-2 gap-1.5">
          <button
            onClick={() => setActiveTab('booster')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'booster'
                ? 'bg-amber-900/40 border border-yellow-600/40 text-amber-100 shadow-md'
                : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/45'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            ショコラティエの道具
          </button>
          <button
            onClick={() => setActiveTab('skin')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'skin'
                ? 'bg-amber-900/40 border border-yellow-600/40 text-amber-100 shadow-md'
                : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/45'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            外見スキン
          </button>
          <button
            onClick={() => setActiveTab('bgm')}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'bgm'
                ? 'bg-amber-900/40 border border-yellow-600/40 text-amber-100 shadow-md'
                : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/45'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            作業部屋のBGM
          </button>
        </div>

        {/* Shop Items List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto flex-1">
          {/* Quick instructions/defaults if looking at Skin or BGM tabs */}
          {activeTab === 'skin' && (
            <div className="p-3 bg-amber-950/30 border border-amber-900/10 rounded-xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-amber-200">クラシック（通常スキン）</span>
                <span className="text-[10px] text-amber-400/80 mt-0.5">当アトリエ王道の、なめらかなチョコ質感。</span>
              </div>
              <button
                onClick={() => {
                  onEquipSkin('none');
                  audio.playSwipe();
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeSkin === 'none'
                    ? 'bg-yellow-500 text-amber-950 shadow'
                    : 'bg-amber-950/50 hover:bg-amber-900/30 text-amber-300 border border-amber-900/30'
                }`}
              >
                {activeSkin === 'none' ? '選択中' : '選択する'}
              </button>
            </div>
          )}

          {activeTab === 'bgm' && (
            <div className="p-3 bg-amber-950/30 border border-amber-900/10 rounded-xl flex items-center justify-between text-xs">
              <div className="flex flex-col">
                <span className="font-bold text-amber-200">静寂 (BGMをオフにする)</span>
                <span className="text-[10px] text-amber-400/80 mt-0.5">無音の環境で、作業への集中力を研ぎ澄まします。</span>
              </div>
              <button
                onClick={() => {
                  onEquipBgm('none');
                  audio.playSwipe();
                }}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  activeBgm === 'none'
                    ? 'bg-yellow-500 text-amber-950 shadow'
                    : 'bg-amber-950/50 hover:bg-amber-900/30 text-amber-300 border border-amber-900/30'
                }`}
              >
                {activeBgm === 'none' ? '選択中' : '選択する'}
              </button>
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-amber-500 text-xs">
              このカテゴリの商品は現在追加されていません。
            </div>
          ) : (
            filteredItems.map((item) => {
              const canAfford = coins >= item.cost;
              const isPurchased = item.purchased;

              // Compute equip state if it's cosmetic
              const isCurrentSkin = activeTab === 'skin' && activeSkin === item.id;
              const isCurrentBgm = activeTab === 'bgm' && activeBgm === item.id;
              const isEquipped = isCurrentSkin || isCurrentBgm;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                    isEquipped
                      ? 'bg-yellow-950/15 border-yellow-500/50 text-amber-100 shadow'
                      : isPurchased
                      ? 'bg-emerald-950/5 border-emerald-900/25 text-amber-100'
                      : 'bg-amber-950/15 border-amber-900/10 text-amber-100 hover:bg-amber-950/20'
                  }`}
                >
                  <div className="text-3xl bg-amber-900/10 p-2.5 rounded-xl border border-amber-900/20 self-start shrink-0">
                    {item.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-amber-100">{item.jpName}</h3>
                    </div>
                    <p className="text-[11px] text-amber-300/80 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-2">
                    {isPurchased ? (
                      activeTab === 'booster' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 px-2.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-900/30">
                          <Check className="w-3" />
                          解放済み
                        </span>
                      ) : isEquipped ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-400 px-2.5 py-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/30 shadow">
                          適用中
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (activeTab === 'skin') {
                              onEquipSkin(item.id);
                            } else if (activeTab === 'bgm') {
                              onEquipBgm(item.id);
                            }
                            audio.playChime();
                          }}
                          className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-amber-900/40 border border-amber-800/40 text-amber-200 hover:bg-amber-800/45 hover:text-white transition-all cursor-pointer"
                        >
                          適用する
                        </button>
                      )
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => {
                          onBuyItem(item.id, item.cost);
                        }}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold font-sans transition-all flex items-center gap-1 shadow ${
                          canAfford
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-amber-950 hover:scale-[1.02] cursor-pointer'
                            : 'bg-stone-900 text-stone-600 border border-stone-850 cursor-not-allowed'
                        }`}
                      >
                        <span>🪙 {item.cost}</span>
                        <span>購入</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-4 bg-amber-950/30 border-t border-amber-900/30 text-center text-[10px] text-amber-500/70">
          💡 商品を着替えて、お部屋の雰囲気やBGMをあなたのお気に召すままにアレンジしましょう！
        </div>
      </motion.div>
    </motion.div>
  );
};
