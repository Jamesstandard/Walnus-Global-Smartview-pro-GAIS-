import { RAGKnowledgeDocument, RAGSearchResult, KnowledgeDomain } from '../types';
import { RAG_KNOWLEDGE_DOCUMENTS } from '../data/ragKnowledgeBaseData';
import { computeCosineSimilarityIsolate } from './backgroundIsolateWorker';

/**
 * Local Vector RAG Knowledge Base Engine
 * Computes normalized term-frequency vectors and cosine similarity rankings
 * completely client-side without external network requirements.
 */

// Build an inverted vocabulary index from the knowledge base
class LocalVectorRAGEngine {
  private documents: RAGKnowledgeDocument[] = [];
  private vocabulary: Map<string, number> = new Map();
  private docVectors: Map<string, number[]> = new Map();
  private isIndexed: boolean = false;

  constructor() {
    this.documents = [...RAG_KNOWLEDGE_DOCUMENTS];
    this.buildIndex();
  }

  // Tokenizer and normalizer
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\-\.\/]/g, ' ')
      .split(/\s+/)
      .filter((term) => term.length >= 2 && !STOP_WORDS.has(term));
  }

  // Build the TF-IDF / Normalized Vector Index
  public buildIndex() {
    const vocabSet = new Set<string>();
    const docTokensMap = new Map<string, string[]>();

    // Step 1: Collect tokens and vocabulary
    for (const doc of this.documents) {
      const fullText = `${doc.title} ${doc.category} ${doc.summary} ${doc.content} ${(doc.tags || []).join(' ')} ${(doc.keyFormulas || []).join(' ')} ${(doc.practicalTips || []).join(' ')} ${(doc.standardSpecs || []).join(' ')} ${(doc.relevanceKeywords || []).join(' ')}`;
      const tokens = this.tokenize(fullText);
      docTokensMap.set(doc.id, tokens);
      tokens.forEach((t) => vocabSet.add(t));
    }

    // Step 2: Assign index positions to vocabulary words
    this.vocabulary.clear();
    let idx = 0;
    vocabSet.forEach((word) => {
      this.vocabulary.set(word, idx++);
    });

    const vocabSize = this.vocabulary.size;

    // Step 3: Compute normalized term frequency vector for each document
    this.docVectors.clear();
    for (const doc of this.documents) {
      const tokens = docTokensMap.get(doc.id) || [];
      const vector = new Array(vocabSize).fill(0);
      const tokenCounts = new Map<string, number>();

      tokens.forEach((t) => {
        tokenCounts.set(t, (tokenCounts.get(t) || 0) + 1);
      });

      let normSq = 0;
      tokenCounts.forEach((count, token) => {
        const vIdx = this.vocabulary.get(token);
        if (vIdx !== undefined) {
          // Weight title and keywords higher
          let weight = Math.log(1 + count);
          if (doc.title.toLowerCase().includes(token)) weight *= 2.5;
          if (doc.relevanceKeywords.some((k) => k.toLowerCase().includes(token))) weight *= 2.0;

          vector[vIdx] = weight;
          normSq += weight * weight;
        }
      });

      // L2 Normalization
      const norm = Math.sqrt(normSq) || 1;
      const normalizedVector = vector.map((v) => v / norm);
      this.docVectors.set(doc.id, normalizedVector);
    }

    this.isIndexed = true;
  }

  // Vectorize a search query
  private vectorizeQuery(query: string): number[] {
    const vocabSize = this.vocabulary.size;
    const queryTokens = this.tokenize(query);
    const vector = new Array(vocabSize).fill(0);
    const counts = new Map<string, number>();

    queryTokens.forEach((t) => {
      counts.set(t, (counts.get(t) || 0) + 1);
    });

    let normSq = 0;
    counts.forEach((count, token) => {
      const vIdx = this.vocabulary.get(token);
      if (vIdx !== undefined) {
        const weight = Math.log(1 + count) * 1.5;
        vector[vIdx] = weight;
        normSq += weight * weight;
      }
    });

    const norm = Math.sqrt(normSq) || 1;
    return vector.map((v) => v / norm);
  }

  // Cosine similarity between two normalized vectors via Isolate helper
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    const res = computeCosineSimilarityIsolate({
      queryVector: vecA,
      docVectors: [{ id: 'target', vector: vecB }],
    });
    return Math.min(1, Math.max(0, res[0]?.score || 0));
  }

  // Search RAG Knowledge Base
  public search(
    query: string,
    domainFilter?: KnowledgeDomain | 'all',
    topK: number = 3
  ): RAGSearchResult[] {
    if (!this.isIndexed) this.buildIndex();

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      // Return top documents in selected domain
      const filtered =
        domainFilter && domainFilter !== 'all'
          ? this.documents.filter((d) => d.domain === domainFilter)
          : this.documents;
      return filtered.slice(0, topK).map((doc) => ({
        document: doc,
        similarityScore: 0.85,
        matchedSnippet: doc.summary,
        matchedKeywords: doc.tags.slice(0, 3),
      }));
    }

    const queryVec = this.vectorizeQuery(query);
    const results: { doc: RAGKnowledgeDocument; score: number; matchedKeywords: string[] }[] = [];

    for (const doc of this.documents) {
      if (domainFilter && domainFilter !== 'all' && doc.domain !== domainFilter) {
        continue;
      }

      const docVec = this.docVectors.get(doc.id);
      if (!docVec) continue;

      let score = this.cosineSimilarity(queryVec, docVec);

      // Direct keyword presence boost
      const matchedKeywords: string[] = [];
      queryTokens.forEach((qt) => {
        const fullDocText = `${doc.title} ${doc.summary} ${doc.content} ${doc.tags.join(' ')} ${doc.relevanceKeywords.join(' ')}`.toLowerCase();
        if (fullDocText.includes(qt)) {
          matchedKeywords.push(qt);
          score += 0.08;
        }
      });

      if (score > 0.05) {
        results.push({
          doc,
          score: Math.min(0.99, score),
          matchedKeywords: Array.from(new Set(matchedKeywords)),
        });
      }
    }

    // Sort descending by similarity score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, topK).map((item) => {
      // Find best snippet
      const sentences = item.doc.content.split('\n').filter((s) => s.trim().length > 10);
      let bestSnippet = item.doc.summary;
      for (const sent of sentences) {
        if (queryTokens.some((qt) => sent.toLowerCase().includes(qt))) {
          bestSnippet = sent.trim();
          break;
        }
      }

      return {
        document: item.doc,
        similarityScore: Math.round(item.score * 100) / 100,
        matchedSnippet: bestSnippet,
        matchedKeywords: item.matchedKeywords,
      };
    });
  }

  // Get all documents
  public getAllDocuments(): RAGKnowledgeDocument[] {
    return this.documents;
  }

  // Get single document by ID
  public getDocumentById(id: string): RAGKnowledgeDocument | undefined {
    return this.documents.find((d) => d.id === id);
  }

  // Add custom document dynamically
  public addDocument(doc: RAGKnowledgeDocument) {
    this.documents.push(doc);
    this.buildIndex();
  }
}

// Stop words filter
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
  'where', 'who', 'which', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
  'same', 'so', 'than', 'too', 'very', 'can', 'just', 'should', 'now',
]);

// Singleton instance export
export const vectorRagEngine = new LocalVectorRAGEngine();
