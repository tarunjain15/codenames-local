import type { Theme } from '../domain/themes.js';

export interface WordGeneratorService {
  generateWords(theme: Theme, existingWords: string[], count: number): Promise<string[]>;
}

export class ClaudeWordGenerator implements WordGeneratorService {
  private apiKey: string;
  private apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      console.warn('No Anthropic API key found in constructor');
    } else {
      console.log('Anthropic API key loaded successfully');
    }
  }

  async generateWords(theme: Theme, existingWords: string[], count: number): Promise<string[]> {
    if (!this.apiKey) {
      console.warn('No Anthropic API key found. Using base words only.');
      return theme.baseWords || [];
    }

    console.log(`Generating ${count} words for theme ${theme.id}`);

    const codenamesRequirements = `
IMPORTANT: These words are for the board game Codenames. Good Codenames words have these qualities:
- Multiple meanings or associations (e.g., "PYTHON" can refer to the snake OR the programming language)
- Not too similar to other words in the set
- Can be connected in creative, non-obvious ways
- Familiar to the target audience
- Mix of concrete and abstract concepts
- Enable clever multi-word clues`;

    const prompt = `${theme.aiPrompt}

${codenamesRequirements}

Requirements:
- Generate exactly ${count} words
- Single words only (no phrases)
- All UPPERCASE
- Avoid these already used words: ${existingWords.join(', ')}
- Words should be recognizable and relevant to: ${theme.description}

Return only the words, one per line, no numbers or explanations.`;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error: ${response.status} - ${errorText}`);
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      const words = content
        .split('\n')
        .map(word => word.trim().toUpperCase())
        .filter(word => word.length > 0 && !word.includes(' '))
        .slice(0, count);

      // Remove duplicates
      const uniqueWords = [...new Set(words)];
      
      console.log(`Generated ${uniqueWords.length} unique words:`, uniqueWords);
      return uniqueWords;
    } catch (error) {
      console.error('Failed to generate words with AI:', error);
      return theme.baseWords || [];
    }
  }
}

// Fallback generator that uses only predefined words
export class StaticWordGenerator implements WordGeneratorService {
  async generateWords(theme: Theme, existingWords: string[], count: number): Promise<string[]> {
    // Sanitize base words
    const sanitizedBaseWords = (theme.baseWords || []).map(word => word.trim().toUpperCase());
    const uniqueBaseWords = [...new Set(sanitizedBaseWords)];
    
    const available = uniqueBaseWords.filter(word => !existingWords.includes(word));
    return available.slice(0, count);
  }
}