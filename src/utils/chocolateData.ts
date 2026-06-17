/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChocolateType, ChocolateInfo, LevelConfig, UpgradeItem } from '../types';

export const CHOCOLATE_DICTIONARY: { [key in ChocolateType]: ChocolateInfo } = {
  [ChocolateType.MILK]: {
    type: ChocolateType.MILK,
    name: 'Classic Milk Chocolate',
    jpName: 'クラシックミルク・ガナッシュ',
    emoji: '🍫',
    color: 'amber-950',
    colorGradient: 'from-[#4D240E] to-[#251004]', // 濃厚な本格ビターブラウン
    accentColor: '#FFFFFF',
    description: 'ミルクとバニラビーンズを極限まで練り込んだ、当アトリエ王道のミルクガナッシュ。なめらかに溶け出し、濃厚なコクと優しい甘みが広がります。',
    ingredients: ['カカオマス35%', '北海道産全粉乳', 'マダガスカルバニラ豆', 'カカオバター'],
    points: 10,
  },
  [ChocolateType.STRAWBERRY]: {
    type: ChocolateType.STRAWBERRY,
    name: 'Strawberry Truffle',
    jpName: 'いちごトリュフ・ドーム',
    emoji: '🍓',
    color: 'pink-500',
    colorGradient: 'from-pink-400 to-rose-600',
    accentColor: '#FFFFFF',
    description: 'あまおうイチゴの果肉100%ピューレをクーベルチュールで包み込み、ホワイトチョコのパウダーリボンをあしらった珠玉のピンクドーム。鮮烈な酸味と甘みのマリアージュ。',
    ingredients: ['あまおう苺', '有機ホワイトチョコ', 'キルシュ発酵酒', 'ビートグラニュー糖'],
    points: 15,
  },
  [ChocolateType.MATCHA]: {
    type: ChocolateType.MATCHA,
    name: 'Matcha Square',
    jpName: '宇治抹茶ロイヤル・パヴェ',
    emoji: '🍵',
    color: 'emerald-800',
    colorGradient: 'from-emerald-700 to-teal-950',
    accentColor: '#FFD700',
    description: '京都宇治の石臼挽き一番茶を贅沢に練り込んだ正方形の石畳（パヴェ）ショコラ。伝統の渋みと、ほのかなホワイトカカオの甘みが生み出す静寂の味。',
    ingredients: ['宇治宇治一番抹茶', 'ホワイトガナッシュ', '純金粉粉末', '和三盆糖'],
    points: 20,
  },
  [ChocolateType.WHITE_RUBY]: {
    type: ChocolateType.WHITE_RUBY,
    name: 'White & Ruby Rose',
    jpName: 'ホワイト・ルビー・ロゼ',
    emoji: '🤍',
    color: 'red-200',
    colorGradient: 'from-rose-500 to-slate-100',
    accentColor: '#C084FC',
    description: 'バニラ香る可憐な白バラ型ホワイトチョコに、天然のピンク色を持つ希少な『ルビーカカオ』ソースを流し込んだ、芸術的でエレガントなローズショコラ。フルーティーな酸味。',
    ingredients: ['ルビーカカオ豆', 'ブルボン産バニラエッセンス', 'オーガニックペタル', 'ローズシロップ'],
    points: 25,
  },
  [ChocolateType.CARAMEL]: {
    type: ChocolateType.CARAMEL,
    name: 'Caramel Star',
    jpName: '焦がし塩キャラメル・エトワール',
    emoji: '⭐',
    color: 'amber-500',
    colorGradient: 'from-amber-400 to-yellow-600',
    accentColor: '#FFFFFF',
    description: 'じっくり焦がした自家製キャラメルをクーベルチュールで包み込み、結晶塩をトッピング。甘味と塩味の極上のバランス。',
    ingredients: ['オーガニック砂糖', '発酵バター', 'ゲランドの塩', 'クーベルチュールカカオ'],
    points: 30,
  },
  [ChocolateType.ORANGE]: {
    type: ChocolateType.ORANGE,
    name: 'Orange Dark Chocolate',
    jpName: 'オランジュ・ノワール・極み',
    emoji: '🍊',
    color: 'orange-500',
    colorGradient: 'from-orange-400 via-orange-500 to-yellow-500', // 鮮やかでフルーティな太陽オレンジ
    accentColor: '#F59E0B',
    description: '厳選されたベネズエラ産カカオ75%に、自家製のシロップ漬けオレンジピールを閉じ込めたビターショコラ。芳醇なオレンジの香りと深味。',
    ingredients: ['カカオマス75%', '瀬戸内産オレンジ', '有機黒糖', 'グランマルニエ'],
    points: 35,
  },
  [ChocolateType.COCOA_BEAN]: {
    type: ChocolateType.COCOA_BEAN,
    name: 'Unroasted Cocoa Bean',
    jpName: '未ローストのカカオ生豆',
    emoji: '🫘',
    color: 'stone-700',
    colorGradient: 'from-stone-600 to-stone-800',
    accentColor: '#3F3F46',
    description: '未ローストの硬いカカオ豆。直接動かすことは出来ませんが、隣接するマスでマッチングを行うとパチパチと割れて消滅します。',
    ingredients: ['未焙煎カカオ生豆100%'],
    points: 0,
  }
};

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Level 1: Atelier Morning',
    jpName: 'レベル 1「ショコラティエの夜明け」',
    description: 'アトリエの朝が始まります。看板メニューである王道ガナッシュ、甘酸っぱいいちごトリュフ、精度を極めた宇治抹茶の極上アソートを作って、最初のお客さまをお迎えしましょう！',
    targetScore: 1000,
    maxMoves: 15,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.MATCHA],
    customers: [
      {
        id: 'c1_1',
        name: 'Alice',
        jpName: 'アリス',
        avatar: '👩‍🦰',
        welcomeMessage: 'こんにちは！アトリエの噂を聞いて来ました。色とりどりで甘いチョコが食べたいな！',
        completeMessage: 'わぁ、とっても美味しい！ミルクのコクといちごの酸味、抹茶の香りが絶妙ね。ありがとう。',
        requirements: {
          [ChocolateType.MILK]: 10,
          [ChocolateType.STRAWBERRY]: 10,
          [ChocolateType.MATCHA]: 6,
        },
        rewardCoins: 80,
      }
    ]
  },
  {
    id: 2,
    name: 'Level 2: Kyoto Teahouse',
    jpName: 'レベル 2「雅な宇治茶席」',
    description: '看板メニューのミルク、フルーティないちごに、深い京都の最高級抹茶。抹茶の豊かな香りに癒やされるアソートをお客さまにおもてなししましょう。',
    targetScore: 1800,
    maxMoves: 18,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.MATCHA], // 最初の方のステージを3種類に調整
    customers: [
      {
        id: 'c2_1',
        name: 'Ken',
        jpName: 'ケン',
        avatar: '👨‍💼',
        welcomeMessage: 'お邪魔します。仕事の疲れを癒やすために、ミルクと抹茶の甘く渋い極上セットが欲しいんだ。',
        completeMessage: 'これだ、この抹茶の渋みとミルクの甘みが一度に味わえるなんて…心が安らぐよ。熟練の技を感じるね。',
        requirements: {
          [ChocolateType.MATCHA]: 12,
          [ChocolateType.MILK]: 10,
          [ChocolateType.STRAWBERRY]: 10,
        },
        rewardCoins: 120,
      }
    ]
  },
  {
    id: 3,
    name: 'Level 3: Royal Rose Bouquet',
    jpName: 'レベル 3「宮廷のローズガーデン」',
    description: '定番のミルクガナッシュ、甘酸っぱいイチゴに、本日新発売の白バラ型『ホワイト・ルビー・ロゼ』を添えて華やかにお客さまをおもてなし。',
    targetScore: 2800,
    maxMoves: 20,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.WHITE_RUBY], // 最初の方のステージを3種類に調整
    customers: [
      {
        id: 'c3_1',
        name: 'Madame Sophia',
        jpName: 'ソフィア夫人',
        avatar: '👩‍🦳',
        welcomeMessage: 'ごきげんようショコラティエ。私の好みに合う、美しくエレガントな薔薇とミルク、いちごを組み合わせた素敵なセットをいただけますかしら？',
        completeMessage: 'なんて見事な薔薇とミルクのバランス…！最高峰のルビーの酸味が素晴らしいわ。合格です。',
        requirements: {
          [ChocolateType.WHITE_RUBY]: 12,
          [ChocolateType.STRAWBERRY]: 12,
          [ChocolateType.MILK]: 12,
        },
        rewardCoins: 180,
      }
    ]
  },
  {
    id: 4,
    name: 'Level 4: Celestial Symphony',
    jpName: 'レベル 4「金色と漆黒のシンフォニー」',
    description: 'フランスの有名シェフがアトリエを訪問。濃厚キャラメルと深いカカオオレンジが並ぶ、少しステップアップしたオーダーに挑みましょう！',
    targetScore: 4200,
    maxMoves: 22,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.CARAMEL, ChocolateType.ORANGE], // 4種類に抑えて難易度調整
    customers: [
      {
        id: 'c4_1',
        name: 'Grand Chef Francois',
        jpName: 'フランソワ・シェフ',
        avatar: '👨‍🍳',
        welcomeMessage: 'ボンジュール。私のフレンチレストランを飾るにふさわしい、焦がし塩キャラメルと深いカカオオレンジを頂こう。職人の真価、見せてもらおうか！',
        completeMessage: 'トレ・ビアン！このビターオレンジの香りとキャラメルの塩気が完璧に私の感性を超越した。素晴らしい仕立てだ！',
        requirements: {
          [ChocolateType.CARAMEL]: 14,
          [ChocolateType.ORANGE]: 14,
          [ChocolateType.MILK]: 12,
          [ChocolateType.STRAWBERRY]: 12,
        },
        rewardCoins: 250,
      }
    ]
  },
  {
    id: 5,
    name: 'Level 5: Zenith of Chocolatier',
    jpName: 'レベル 5「ショコラティエ極限の頂点」',
    description: 'アトリエに高級カカオ生豆（障害物）が大量に届きました。京都宇治の石臼挽き抹茶と薔薇のルビーショコラで、優雅にカカオ豆を割って進めましょう。',
    targetScore: 6500,
    maxMoves: 25,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.MATCHA, ChocolateType.WHITE_RUBY], // 4種類に抑えてスッキリ
    initialObstacles: [
      { row: 1, col: 1 },
      { row: 1, col: 4 },
      { row: 4, col: 1 },
      { row: 4, col: 4 },
    ],
    customers: [
      {
        id: 'c5_1',
        name: 'The Ultimate Ensemble',
        jpName: '美食家アソート団',
        avatar: '👑',
        welcomeMessage: 'アトリエ最初の大きな試練だ！カカオ生豆を綺麗にローストしながら、最高の抹茶とルビーローズをふんだんに詰め合わせてくれ！',
        completeMessage: 'ブラボー！まさに伝説のショコラティエだ！このアトリエが世界で一番甘く幸せな場所になりました！',
        requirements: {
          [ChocolateType.MILK]: 16,
          [ChocolateType.STRAWBERRY]: 16,
          [ChocolateType.MATCHA]: 14,
          [ChocolateType.WHITE_RUBY]: 14,
        },
        rewardCoins: 400,
      }
    ]
  },
  {
    id: 6,
    name: 'Level 6: Tropical Breeze',
    jpName: 'レベル 6「南国パライゾの熱風」',
    description: 'オレンジとキャラメルの濃厚なコンビネーションが南国の爽やかな風を運びます。少し複雑な形の障害物が置かれたアトリエで、フルーティな逸品を作りましょう。',
    targetScore: 8500,
    maxMoves: 25,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.CARAMEL, ChocolateType.ORANGE], // 4種類
    initialObstacles: [
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ],
    customers: [
      {
        id: 'c6_1',
        name: 'Leo',
        jpName: 'レオ',
        avatar: '🕺',
        welcomeMessage: 'やあ！南国の風を感じるキャラメルと、最高級オレンジダークチョコのアソートを特注で頼みたいんだ。よろしく！',
        completeMessage: 'おお！この甘酸っぱさとビターの刺激、精度を極めたキャラメルのコク…！南国の青い海が見えたよ！ありがとう！',
        requirements: {
          [ChocolateType.MILK]: 12,
          [ChocolateType.CARAMEL]: 12,
          [ChocolateType.ORANGE]: 12,
        },
        rewardCoins: 450,
      }
    ]
  },
  {
    id: 7,
    name: 'Level 7: Duchess High Tea',
    jpName: 'レベル 7「公爵夫人のティーパーティ」',
    description: '四隅に頑固なカカオ生豆が配置されたエレガントなステージ。宇治抹茶とルビーローズをふんだんに使った格式高いセットを用意しておもてなししましょう。',
    targetScore: 16000, // 最後の方のステージなので、クリア条件を少し上げる (旧13000)
    maxMoves: 24,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.MATCHA, ChocolateType.WHITE_RUBY, ChocolateType.CARAMEL], // 5種類
    initialObstacles: [
      { row: 0, col: 0 },
      { row: 0, col: 5 },
      { row: 5, col: 0 },
      { row: 5, col: 5 },
    ],
    customers: [
      {
        id: 'c7_1',
        name: 'Catherine',
        jpName: 'キャサリン',
        avatar: '👩‍🦱',
        welcomeMessage: 'ごきげんよう。今夜のティーパーティのために、極上の抹茶パヴェと薔薇のルビーショコラを主役にしたブーケボックスを頂けるかしら？',
        completeMessage: 'なんという気品あふれる味わい…！四隅の硬い豆をものともせず、これほど滑らかなガナッシュを作るとは。感動いたしました。',
        requirements: {
          [ChocolateType.MATCHA]: 18,        // クリア条件（消した数）を引き上げ (旧15)
          [ChocolateType.WHITE_RUBY]: 18,    // クリア条件（消した数）を引き上げ (旧15)
          [ChocolateType.CARAMEL]: 12,       // クリア条件（消した数）を引き上げ (旧10)
        },
        rewardCoins: 500,
      }
    ]
  },
  {
    id: 8,
    name: 'Level 8: Crystal Illusion',
    jpName: 'レベル 8「冬の幻影クリスタルテラス」',
    description: '凍てつくテラスのように、中央を分断するようにカカオ生豆が並びます。厳選されたカカオオレンジと抹茶が織りなす、5種類の豪華アソートです。',
    targetScore: 20000, // 最後の方のステージなので、クリア条件を少し上げる (旧16000)
    maxMoves: 23,
    allowedTypes: [ChocolateType.MILK, ChocolateType.MATCHA, ChocolateType.WHITE_RUBY, ChocolateType.CARAMEL, ChocolateType.ORANGE], // 5種類に増やして調整
    initialObstacles: [
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 4, col: 2 },
      { row: 4, col: 3 },
    ],
    customers: [
      {
        id: 'c8_1',
        name: 'Sylvia',
        jpName: 'シルビア',
        avatar: '👩‍⚕️',
        welcomeMessage: 'こんにちは。凍えるような季節に、体の芯から温まるような、ビターなオレンジと深みのある星型キャラメルをお願い。',
        completeMessage: 'す、すばらしい…！オレンジピールのフルーティーさとビターが身体に染み渡ります。最高の癒やしだわ。',
        requirements: {
          [ChocolateType.ORANGE]: 18,       // 消した数を少し上げる (旧16)
          [ChocolateType.CARAMEL]: 16,      // 消した数を少し上げる (旧14)
          [ChocolateType.WHITE_RUBY]: 14,   // 消した数を少し上げる (旧12)
        },
        rewardCoins: 550,
      }
    ]
  },
  {
    id: 9,
    name: 'Level 9: Planetary Symphony',
    jpName: 'レベル 9「きらめく銀河プラネット」',
    description: '十字形にカカオ豆が散りばめられた難関宇宙ステージ。最高級ルビーローズと焦がし塩キャラメルで、天体を旅するような美しさを具現化しましょう。',
    targetScore: 24000, // 最後の方のステージなので、クリア条件を少し上げる (旧20000)
    maxMoves: 26,
    allowedTypes: [ChocolateType.MILK, ChocolateType.STRAWBERRY, ChocolateType.WHITE_RUBY, ChocolateType.CARAMEL, ChocolateType.ORANGE], // 5種類
    initialObstacles: [
      { row: 2, col: 1 },
      { row: 2, col: 4 },
      { row: 1, col: 2 },
      { row: 4, col: 2 },
    ],
    customers: [
      {
        id: 'c9_1',
        name: 'Stella',
        jpName: '天文学者ステラ',
        avatar: '👩‍🚀',
        welcomeMessage: 'ハロー！まるで満天の星空を駆けるような、きらびやかな焦がし塩キャラメルと、神秘的なルビーローズのコンボを観測しにきたよ！',
        completeMessage: 'ビューティフル！このアソートは完全に銀河の輝きを体現しているね。星々の甘みが軌道を描くようだ！',
        requirements: {
          [ChocolateType.WHITE_RUBY]: 22,   // 消した数を少し上げる (旧18)
          [ChocolateType.CARAMEL]: 22,      // 消した数を少し上げる (旧18)
          [ChocolateType.ORANGE]: 16,       // 消した数を少し上げる (旧12)
          [ChocolateType.STRAWBERRY]: 16,   // 消した数を少し上げる (旧12)
        },
        rewardCoins: 600,
      }
    ]
  },
  {
    id: 10,
    name: 'Level 10: Temple of Legend',
    jpName: 'レベル 10「ショコラティエ・レジェンド大聖堂」',
    description: 'ついに最終試練です。盤面を対角線上に分断する形でカカオ生豆が並ぶ究極の超高難関ステージ。5種類のチョコレートを極限までマッチさせ、伝説の王を満足させてください！',
    targetScore: 32000, // 最後の方のステージなので、クリア条件を少し上げる (旧25000)
    maxMoves: 28,
    allowedTypes: [
      ChocolateType.MILK,
      ChocolateType.STRAWBERRY,
      ChocolateType.MATCHA,
      ChocolateType.CARAMEL,
      ChocolateType.ORANGE
    ], // 6種類から5種類に抑制
    initialObstacles: [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
      { row: 4, col: 4 },
      { row: 5, col: 5 },
    ],
    customers: [
      {
        id: 'c10_1',
        name: 'Arthur the Grand King',
        jpName: 'レジェンド大王',
        avatar: '👑',
        welcomeMessage: '余は世界中の美味を食い尽くしてきた。ショコラティエよ、余の至高の審美眼にかなう、真の『伝説の5種アソート』を完成させてみせよ！',
        completeMessage: '見事なり！未曾有のカカオ分断を完璧にこなし、厳選された5種類の調和を最高に高めた。そなたを公式の「大宮廷帝国最高ショコラティエ神」と認めよう！',
        requirements: {
          [ChocolateType.MILK]: 22,         // 消した数を少し上げる (旧18)
          [ChocolateType.STRAWBERRY]: 22,   // 消した数を少し上げる (旧18)
          [ChocolateType.MATCHA]: 22,       // 消した数を少し上げる (旧18)
          [ChocolateType.CARAMEL]: 18,      // 消した数を少し上げる (旧15)
          [ChocolateType.ORANGE]: 18,       // 消した数を少し上げる (旧15)
        },
        rewardCoins: 1000,
      }
    ]
  }
];

export const SHOP_ITEMS: UpgradeItem[] = [
  {
    id: 'ribbon',
    name: 'Golden Satin Ribbon',
    jpName: '金の金箔サテンリボン',
    description: '梱包に美しい金色のサテンリボンを使用します。出荷するチョコのスコアが永続的に15%アップ！',
    cost: 150,
    purchased: false,
    icon: '💝',
    category: 'booster',
  },
  {
    id: 'candle',
    name: 'Aroma Warming Candle',
    jpName: '心休まるアロマキャンドル',
    description: '作業台にアロマを灯して思考を研ぎ澄まします。各レベルの初期持ち手数が「+3」されます。',
    cost: 250,
    purchased: false,
    icon: '🕯️',
    category: 'booster',
  },
  {
    id: 'spatula',
    name: 'Legendary Golden Spatula',
    jpName: '伝説の黄金ゴールド・スパチュラ',
    description: 'パズル中、ピンチの時に盤面上のチョコを1粒だけ直接割って消すことができます！（レベル毎に1回限定）',
    cost: 350,
    purchased: false,
    icon: '🧹',
    category: 'booster',
  },
  {
    id: 'mist',
    name: 'Chocolatier Magic Mist',
    jpName: 'マジシャン・マジックミスト',
    description: 'パズル中、手詰まりの時に「マジックミスト」を吹きかけて、盤面を完全にシャッフルできます！（レベル毎に1回限定）',
    cost: 220,
    purchased: false,
    icon: '✨',
    category: 'booster',
  },
  {
    id: 'mitten',
    name: 'Silicon Oven Mitten',
    jpName: '極厚シリコン・パズルミトン',
    description: '手数を消費せずに、盤面内の隣り合うチョコ2粒がどんなペアであっても直接強制入れ替えできます！（レベル毎に1回限定）',
    cost: 320,
    purchased: false,
    icon: '🧤',
    category: 'booster',
  },
  {
    id: 'patron',
    name: 'Royal Palace Patron',
    jpName: 'ロイヤル王宮パトロン契約',
    description: '王室の後援を受けることで、お給料（レベルクリア時の獲得コイン）が永続的に50%増加します！',
    cost: 450,
    purchased: false,
    icon: '👑',
    category: 'booster',
  },
  {
    id: 'skin_space',
    name: 'Cosmic Galaxy Skin',
    jpName: '🌌 宇宙銀河ギャラクシースキン',
    description: 'チョコレートブロックの背景をミステリアスなきらめく星空に変更。リフレッシュした気分でパズルを楽しめます。',
    cost: 150,
    purchased: false,
    icon: '🌌',
    category: 'skin',
  },
  {
    id: 'skin_neon',
    name: 'Chic Neon Light Skin',
    jpName: '⚡ ビビッド・ネオンライトスキン',
    description: 'ブロックの縁取りがピカッと輝くネオン管風スタイルに変化！アトリエをサイバーな都市型ブティックに変えます。',
    cost: 120,
    purchased: false,
    icon: '⚡',
    category: 'skin',
  },
  {
    id: 'bgm_orgel',
    name: 'Sweet Music Box BGM',
    jpName: '🎵 気品溢れるオルゴールBGM',
    description: 'アトリエにそっと流れる美しいオルゴールシンセBGM。心が安らぎ、仕分け作業にじっくり集中できます。',
    cost: 180,
    purchased: false,
    icon: '🎵',
    category: 'bgm',
  },
  {
    id: 'bgm_jazz',
    name: 'Mellow Chocolate Jazz BGM',
    jpName: '🎷 ビターショコラ・ジャズBGM',
    description: '大人で上品なジャズ調スウィートBGM。まろやかなコード弾きとスウィングするリズムがアトリエを満たします。',
    cost: 240,
    purchased: false,
    icon: '🎷',
    category: 'bgm',
  }
];
