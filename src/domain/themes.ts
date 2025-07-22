export interface Theme {
  id: string;
  name: string;
  description: string;
  baseWords?: string[]; // Optional starter words
  aiPrompt: string; // Prompt for AI to generate more words
}

export const THEMES: Theme[] = [
  {
    id: 'family',
    name: 'North Indian Jain Family',
    description: 'North Indian Jain family culture with love for vegetarian food, kids, music, TV shows, and movies',
    aiPrompt: 'Generate words related to North Indian Jain family life including: Jain vegetarian dishes (no onion/garlic), Bollywood movies/actors, Indian festivals, family relationships, household items, TV shows, music, cultural traditions. Mix Hindi/cultural words with English. Words should be familiar to all ages.',
    baseWords: [
      'PANEER', 'DOSA', 'ROTI', 'SAMOSA', 'MITHAI', 'LASSI', 'CHAI',
      'DIWALI', 'HOLI', 'NAVRATRI', 'FAMILY', 'TEMPLE', 'PUJA', 'AARTI'
    ]
  },
  {
    id: 'python-typescript',
    name: 'Python & TypeScript',
    description: 'Programming concepts, tools, and patterns specific to Python and TypeScript development',
    aiPrompt: 'Generate words related to Python and TypeScript programming including: language features, frameworks, design patterns, development tools, and programming concepts.',
    baseWords: [
      'PYTHON', 'TYPESCRIPT', 'ASYNC', 'DECORATOR', 'TYPING', 'PANDAS', 'NUMPY', 
      'REACT', 'NODE', 'EXPRESS', 'DJANGO', 'FLASK', 'INTERFACE', 'CLASS'
    ]
  },
  {
    id: 'domain-driven',
    name: 'Domain-Driven Design',
    description: 'Architecture patterns and concepts from domain-driven design and software architecture',
    aiPrompt: 'Generate words related to domain-driven design, software architecture, and system design including: DDD patterns, architectural concepts, and design principles.',
    baseWords: [
      'DOMAIN', 'AGGREGATE', 'ENTITY', 'REPOSITORY', 'SERVICE', 'FACTORY',
      'BOUNDED', 'CONTEXT', 'EVENT', 'COMMAND', 'QUERY', 'SAGA'
    ]
  },
  {
    id: 'shell-cli',
    name: 'Shell Scripts & CLI',
    description: 'Command line tools, shell scripting concepts, and terminal commands',
    aiPrompt: 'Generate words related to shell scripting, command line interfaces, and terminal usage including: common commands, shell concepts, and CLI tools. Focus on bash/zsh and general Unix-like systems.',
    baseWords: [
      'BASH', 'GREP', 'PIPE', 'ALIAS', 'EXPORT', 'SOURCE', 'CHMOD',
      'CURL', 'SSH', 'AWK', 'SED', 'FIND', 'ECHO', 'PATH'
    ]
  },
  {
    id: 'macbook-workflow',
    name: 'MacBook Power User',
    description: 'macOS features, productivity tools, and workflows for MacBook power users',
    aiPrompt: 'Generate words related to macOS, MacBook productivity, and Apple ecosystem including: system features, popular Mac apps, keyboard shortcuts concepts, and workflow tools.',
    baseWords: [
      'FINDER', 'SPOTLIGHT', 'TERMINAL', 'HOMEBREW', 'ALFRED', 'MISSION',
      'SPACES', 'DOCK', 'LAUNCHPAD', 'AIRDROP', 'HANDOFF', 'SAFARI'
    ]
  }
];

export function getTheme(id: string): Theme | undefined {
  const theme = THEMES.find(theme => theme.id === id);
  if (theme && theme.baseWords) {
    // Ensure base words are sanitized
    const sanitizedBaseWords = theme.baseWords.map(word => word.trim().toUpperCase());
    const uniqueBaseWords = [...new Set(sanitizedBaseWords)];
    return {
      ...theme,
      baseWords: uniqueBaseWords
    };
  }
  return theme;
}

export function getThemeIds(): string[] {
  return THEMES.map(theme => theme.id);
}