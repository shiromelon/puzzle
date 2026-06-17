/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { CustomerOrder, ChocolateType } from '../types';
import { CHOCOLATE_DICTIONARY } from '../utils/chocolateData';

interface OrderListProps {
  customer: CustomerOrder;
}

export const OrderList: React.FC<OrderListProps> = ({ customer }) => {
  const requirements = Object.keys(customer.requirements) as ChocolateType[];

  return (
    <div className="w-full bg-amber-950/40 border border-amber-900/30 rounded-3xl p-5 backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-center gap-6">
      {/* Customer Profile Card */}
      <div className="flex flex-row md:flex-col items-center gap-3 md:border-r md:border-amber-900/20 md:pr-6 min-w-[140px] text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-900/30 border border-yellow-600/30 flex items-center justify-center text-3xl shadow-inner relative">
          <span>{customer.avatar}</span>
          {customer.isSatisfied && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-0.5 shadow-lg border border-white">
              <CheckCircle className="w-4 h-4 text-white fill-current" />
            </div>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-lg text-amber-100">{customer.jpName}</h4>
          <span className="text-[10px] uppercase tracking-wider text-amber-400 font-mono">Customer Order</span>
        </div>
      </div>

      {/* Message and Chocolate Ingredients checklist */}
      <div className="flex-1 w-full">
        {/* Dialogue Bubble */}
        <div className="relative bg-amber-970/60 p-3 rounded-2xl border border-amber-900/20 text-xs text-amber-200/90 mb-4 italic min-h-[44px] flex items-center">
          <div className="absolute left-[30px] -top-2 w-3 h-3 bg-amber-970/60 border-t border-l border-amber-900/20 rotate-45 md:left-[-6px] md:top-1/2 md:-translate-y-1/2 md:rotate-[315deg]" />
          <span>「{customer.isSatisfied ? customer.completeMessage : customer.welcomeMessage}」</span>
        </div>

        {/* Requirements grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {requirements.map((type) => {
            const reqAmount = customer.requirements[type] || 1;
            const curAmount = customer.fulfilled[type] || 0;
            const percent = Math.min(100, Math.round((curAmount / reqAmount) * 100));
            const isDone = curAmount >= reqAmount;
            const dict = CHOCOLATE_DICTIONARY[type];

            return (
              <div
                key={type}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                  isDone
                    ? 'bg-emerald-950/20 border-emerald-600/30 text-emerald-200/80 shadow-md'
                    : 'bg-amber-950/35 border-amber-900/20 text-amber-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-sm flex items-center gap-1.5 font-medium truncate">
                    <span>{dict.emoji}</span>
                    <span className="truncate">{dict.jpName}</span>
                  </span>
                  {isDone ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0">
                      {curAmount}/{reqAmount}
                    </span>
                  )}
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
