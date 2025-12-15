// Document re-ranking service for improved RAG

export type DocumentChunk = {
  document_id: string;
  document_name?: string | null;
  content: string;
  metadata?: { page_number?: number } | null;
  similarity?: number | null;
  chunk_index?: number | null;
};

export type RerankedChunk = DocumentChunk & {
  rerankScore: number;
  relevanceFactors: string[];
};

/**
 * Re-rank document chunks using multiple relevance factors
 */
export const rerankDocumentChunks = async (
  chunks: DocumentChunk[],
  query: string,
  openAIApiKey: string,
): Promise<RerankedChunk[]> => {
  if (chunks.length === 0) {
    return [];
  }

  // If we have few chunks, skip re-ranking to save API calls
  if (chunks.length <= 3) {
    return chunks.map(chunk => ({
      ...chunk,
      rerankScore: chunk.similarity ?? 0.5,
      relevanceFactors: ['similarity'],
    }));
  }

  try {
    // Use LLM to score chunks for relevance
    const chunkScores = await scoreChunksWithLLM(chunks, query, openAIApiKey);
    
    // Combine similarity score with LLM relevance score
    const reranked: RerankedChunk[] = chunks.map((chunk, index) => {
      const similarityScore = chunk.similarity ?? 0.5;
      const llmScore = chunkScores[index] ?? 0.5;
      
      // Weighted combination: 60% similarity, 40% LLM relevance
      const combinedScore = (similarityScore * 0.6) + (llmScore * 0.4);
      
      const factors: string[] = [];
      if (chunk.similarity !== null) {
        factors.push('similarity');
      }
      if (llmScore > 0.6) {
        factors.push('llm_relevance');
      }
      if (chunk.metadata?.page_number !== undefined) {
        factors.push('has_page_number');
      }
      
      return {
        ...chunk,
        rerankScore: combinedScore,
        relevanceFactors: factors,
      };
    });

    // Sort by rerank score (highest first)
    reranked.sort((a, b) => b.rerankScore - a.rerankScore);

    return reranked;
  } catch (error) {
    console.error('Error re-ranking chunks, using original order:', error);
    // Fallback to original similarity-based ordering
    return chunks
      .map(chunk => ({
        ...chunk,
        rerankScore: chunk.similarity ?? 0.5,
        relevanceFactors: ['similarity'],
      }))
      .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
  }
};

/**
 * Score chunks using LLM for semantic relevance
 */
const scoreChunksWithLLM = async (
  chunks: DocumentChunk[],
  query: string,
  openAIApiKey: string,
): Promise<number[]> => {
  try {
    // Create a prompt to score chunks
    const chunkSummaries = chunks.map((chunk, index) => {
      const preview = chunk.content.substring(0, 200);
      return `${index}: ${preview}${chunk.content.length > 200 ? '...' : ''}`;
    }).join('\n\n');

    const prompt = `Du ska bedöma hur relevanta följande dokumentdelar är för användarens fråga.

Användarens fråga: "${query}"

Dokumentdelar:
${chunkSummaries}

Returnera en JSON-array med relevanspoäng (0.0-1.0) för varje dokumentdel i samma ordning. Högre poäng = mer relevant.

Exempel: [0.8, 0.3, 0.9, 0.5]`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Du är en expert på att bedöma dokumentrelevans. Returnera endast JSON-array med poäng.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM scoring failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No content in LLM response');
    }

    // Parse JSON response
    const parsed = JSON.parse(content);
    
    // Try to find scores array in response
    let scores: number[] = [];
    if (Array.isArray(parsed)) {
      scores = parsed;
    } else if (Array.isArray(parsed.scores)) {
      scores = parsed.scores;
    } else if (typeof parsed.scores === 'string') {
      scores = JSON.parse(parsed.scores);
    }

    // Validate and normalize scores
    if (!Array.isArray(scores) || scores.length !== chunks.length) {
      // Fallback: return neutral scores
      return chunks.map(() => 0.5);
    }

    return scores.map(score => {
      const num = typeof score === 'number' ? score : parseFloat(String(score));
      return Number.isFinite(num) && num >= 0 && num <= 1 ? num : 0.5;
    });
  } catch (error) {
    console.error('LLM scoring error:', error);
    // Return neutral scores on error
    return chunks.map(() => 0.5);
  }
};

/**
 * Select top chunks after re-ranking
 */
export const selectTopChunks = (
  rerankedChunks: RerankedChunk[],
  maxChunks: number = 8,
  minScore: number = 0.3,
): RerankedChunk[] => {
  return rerankedChunks
    .filter(chunk => chunk.rerankScore >= minScore)
    .slice(0, maxChunks);
};

