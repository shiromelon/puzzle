/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum ChocolateType {
  MILK = 'MILK',             // Classic Milk Chocolate (Brown)
  STRAWBERRY = 'STRAWBERRY', // Strawberry Truffle (Pink)
  MATCHA = 'MATCHA',         // Matcha Square (Green)
  WHITE_RUBY = 'WHITE_RUBY', // White & Ruby Chocolate Rose (White/Gold)
  CARAMEL = 'CARAMEL',       // Caramel Star (Gold/Amber)
  ORANGE = 'ORANGE',         // Orange Dark Chocolate (Dark Brown/Orange)
  COCOA_BEAN = 'COCOA_BEAN', // Obstacle (Stubborn unroasted cocoa bean)
}

export interface ChocolateInfo {
  type: ChocolateType;
  name: string;
  jpName: string;
  emoji: string;
  color: string;         // Primary Tailwind color
  colorGradient: string; // Tailwind gradient classes
  accentColor: string;   // Secondary color for decorations
  description: string;
  ingredients: string[];
  points: number;
}

export interface Tile {
  id: string; // Unique ID to track animations/renders
  row: number;
  col: number;
  type: ChocolateType;
  isMatching?: boolean;
  specialEffect?: 'row' | 'col' | 'bomb'; // Special puzzle items created by matches!
}

export interface CustomerOrder {
  id: string;
  name: string;
  jpName: string;
  avatar: string; // Emoji avatar
  welcomeMessage: string;
  completeMessage: string;
  requirements: { [key in ChocolateType]?: number }; // Chocolate types and quantities needed
  fulfilled: { [key in ChocolateType]?: number };    // Quantities packed so far
  isSatisfied: boolean;
  rewardCoins: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  jpName: string;
  description: string;
  targetScore: number;
  maxMoves: number;
  allowedTypes: ChocolateType[];
  initialObstacles?: { row: number; col: number }[]; // Coordinates for Cocoa Beans
  customers: Omit<CustomerOrder, 'fulfilled' | 'isSatisfied'>[];
}

export interface Particle {
  id: string;
  x: number; // Percent or absolute X
  y: number; // Percent or absolute Y
  color: string;
  emoji?: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface UpgradeItem {
  id: string;
  name: string;
  jpName: string;
  description: string;
  cost: number;
  purchased: boolean;
  icon: string;
  category?: 'booster' | 'skin' | 'bgm';
}
