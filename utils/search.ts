export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export function fuzzySearch<T>(list: T[], keys: string[], query: string, threshold = 0.4): T[] {
  const lowerQuery = query.toLowerCase();
  return list.filter(item => {
    return keys.some(key => {
      const value = String((item as any)[key]).toLowerCase();
      const words = value.split(' ');
      return words.some(word => levenshteinDistance(word, lowerQuery) <= threshold * word.length) ||
             value.includes(lowerQuery);
    });
  });
}

export function findPartialMatches<T>(list: T[], key: keyof T, query: string): T[] {
  const lowerQuery = query.toLowerCase();
  return list.filter(item => {
    const value = String(item[key]).toLowerCase();
    const words = value.split(' ');
    return words.some(word => word.startsWith(lowerQuery)) || value.includes(lowerQuery);
  });
}

export function prioritizeSolutions(solutions: any[], query: string): any[] {
  return solutions.sort((a, b) => {
    const aRelevance = calculateRelevance(a, query);
    const bRelevance = calculateRelevance(b, query);
    return bRelevance - aRelevance;
  });
}

function calculateRelevance(solution: any, query: string): number {
  const solutionWords = solution.description.toLowerCase().split(' ');
  const queryWords = query.toLowerCase().split(' ');
  const exactMatches = queryWords.filter(word => solutionWords.includes(word)).length;
  const partialMatches = queryWords.filter(word => solutionWords.some(sWord => sWord.startsWith(word))).length;
  return exactMatches * 2 + partialMatches;
}

