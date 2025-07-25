import { readFile } from 'fs/promises';
import { join } from 'path';
import { getTheme, THEMES } from '../domain/themes.js';
import { ClaudeWordGenerator, StaticWordGenerator } from '../services/word-generator.js';
import { GameEngine } from '../domain/game.js';

const DEFAULT_WORDS = [
  // Default Codenames words as fallback
  'AGENT', 'AIR', 'ALIEN', 'AMAZON', 'ANGEL', 'ANTARCTICA', 'APPLE', 'ARM',
  'BACK', 'BAND', 'BANK', 'BARK', 'BEACH', 'BELT', 'BERLIN', 'BERRY',
  'BOARD', 'BOND', 'BOOM', 'BOOT', 'BOTTLE', 'BOW', 'BOX', 'BRIDGE',
  'BRUSH', 'BUCK', 'BUFFALO', 'BUG', 'CAPITAL', 'CAR', 'CARD', 'CARROT',
  'CASINO', 'CAST', 'CAT', 'CELL', 'CENTER', 'CHAIR', 'CHANGE', 'CHARGE',
  'CHECK', 'CHEST', 'CHICAGO', 'CHINA', 'CHOCOLATE', 'CHURCH', 'CIRCLE', 'CLIFF',
  'CLOAK', 'CLUB', 'CODE', 'COLD', 'COMIC', 'COMPOUND', 'CONCERT', 'CONDUCTOR',
  'CONTRACT', 'COOK', 'COPPER', 'COTTON', 'COURT', 'COVER', 'CRANE', 'CRASH',
  'CRICKET', 'CROSS', 'CROWN', 'CYCLE', 'CZECH', 'DANCE', 'DATE', 'DAY',
  'DEGREE', 'DIAMOND', 'DICE', 'DINOSAUR', 'DISEASE', 'DOCTOR', 'DOG', 'DRAFT',
  'DRAGON', 'DRESS', 'DRILL', 'DROP', 'DUCK', 'DWARF', 'EAGLE', 'EGYPT',
  'EMBASSY', 'ENGINE', 'ENGLAND', 'EUROPE', 'EYE', 'FACE', 'FAIR', 'FALL',
  'FAN', 'FENCE', 'FIELD', 'FIGHTER', 'FIGURE', 'FILE', 'FILM', 'FIRE',
  'FISH', 'FLUTE', 'FLY', 'FOOT', 'FORCE', 'FOREST', 'FORK', 'FRANCE',
  'GAME', 'GAS', 'GENIUS', 'GERMANY', 'GHOST', 'GIANT', 'GLASS', 'GLOVE',
  'GOLD', 'GRACE', 'GRASS', 'GREECE', 'GREEN', 'GROUND', 'HAM', 'HAND',
  'HAWK', 'HEAD', 'HEART', 'HELICOPTER', 'HIMALAYAS', 'HOLE', 'HOLLYWOOD', 'HONEY',
  'HOOD', 'HOOK', 'HORN', 'HORSE', 'HORSESHOE', 'HOSPITAL', 'HOTEL', 'ICE',
  'ICE CREAM', 'INDIA', 'IRON', 'IVORY', 'JACK', 'JAM', 'JET', 'JUPITER',
  'KANGAROO', 'KETCHUP', 'KEY', 'KID', 'KING', 'KIWI', 'KNIFE', 'KNIGHT',
  'LAB', 'LAP', 'LASER', 'LAWYER', 'LEAD', 'LEMON', 'LEPRECHAUN', 'LIFE',
  'LIGHT', 'LIMOUSINE', 'LINE', 'LINK', 'LION', 'LITTER', 'LOCH NESS', 'LOCK',
  'LOG', 'LONDON', 'LUCK', 'MAIL', 'MAMMOTH', 'MAPLE', 'MARBLE', 'MARCH',
  'MASS', 'MATCH', 'MERCURY', 'MEXICO', 'MICROSCOPE', 'MILLIONAIRE', 'MINE', 'MINT',
  'MISSILE', 'MODEL', 'MOLE', 'MOON', 'MOSCOW', 'MOUNT', 'MOUSE', 'MOUTH',
  'MUG', 'NAIL', 'NEEDLE', 'NET', 'NEW YORK', 'NIGHT', 'NINJA', 'NOTE',
  'NOVEL', 'NURSE', 'NUT', 'OCTOPUS', 'OIL', 'OLIVE', 'OLYMPUS', 'OPERA',
  'ORANGE', 'ORGAN', 'PALM', 'PAN', 'PANTS', 'PAPER', 'PARACHUTE', 'PARK',
  'PART', 'PASS', 'PASTE', 'PENGUIN', 'PHOENIX', 'PIANO', 'PIE', 'PILOT',
  'PIN', 'PIPE', 'PIRATE', 'PISTOL', 'PIT', 'PITCH', 'PLANE', 'PLASTIC',
  'PLATE', 'PLATYPUS', 'PLAY', 'PLOT', 'POINT', 'POISON', 'POLE', 'POLICE',
  'POOL', 'PORT', 'POST', 'POUND', 'PRESS', 'PRINCESS', 'PUMPKIN', 'PUPIL',
  'PYRAMID', 'QUEEN', 'RABBIT', 'RACKET', 'RAY', 'REVOLUTION', 'RING', 'ROBIN',
  'ROBOT', 'ROCK', 'ROME', 'ROOT', 'ROSE', 'ROULETTE', 'ROUND', 'ROW',
  'RULER', 'SATELLITE', 'SATURN', 'SCALE', 'SCHOOL', 'SCIENTIST', 'SCORPION', 'SCREEN',
  'SCUBA DIVER', 'SEAL', 'SERVER', 'SHADOW', 'SHAKESPEARE', 'SHARK', 'SHIP', 'SHOE',
  'SHOP', 'SHOT', 'SINK', 'SKYSCRAPER', 'SLIP', 'SLUG', 'SMUGGLER', 'SNOW',
  'SNOWMAN', 'SOCK', 'SOLDIER', 'SOUL', 'SOUND', 'SPACE', 'SPELL', 'SPIDER',
  'SPIKE', 'SPINE', 'SPOT', 'SPRING', 'SPY', 'SQUARE', 'STADIUM', 'STAFF',
  'STAR', 'STATE', 'STICK', 'STOCK', 'STRAW', 'STREAM', 'STRIKE', 'STRING',
  'SUB', 'SUIT', 'SUPERHERO', 'SWING', 'SWITCH', 'TABLE', 'TABLET', 'TAG',
  'TAIL', 'TAP', 'TEACHER', 'TELESCOPE', 'TEMPLE', 'THEATER', 'THIEF', 'THUMB',
  'TICK', 'TIE', 'TIME', 'TOKYO', 'TOOTH', 'TORCH', 'TOWER', 'TRACK',
  'TRAIN', 'TRIANGLE', 'TRIP', 'TRUNK', 'TUBE', 'TURKEY', 'UNDERTAKER', 'UNICORN',
  'VACUUM', 'VAN', 'VET', 'WAKE', 'WALL', 'WAR', 'WASHER', 'WASHINGTON',
  'WATCH', 'WATER', 'WAVE', 'WEB', 'WELL', 'WHALE', 'WHIP', 'WIND',
  'WITCH', 'WORM', 'YARD'
];

export async function loadWordList(name: string): Promise<string[]> {
  if (name === 'default') {
    return DEFAULT_WORDS;
  }

  try {
    const filePath = join(process.cwd(), 'data', 'words', `${name}.txt`);
    const content = await readFile(filePath, 'utf-8');
    const words = content.split('\n')
      .map(word => word.trim().toUpperCase())
      .filter(word => word.length > 0);

    if (words.length < 25) {
      throw new Error(`Word list ${name} has only ${words.length} words, need at least 25`);
    }

    return words;
  } catch (error) {
    console.error(`Failed to load word list ${name}, using default`, error);
    return DEFAULT_WORDS;
  }
}