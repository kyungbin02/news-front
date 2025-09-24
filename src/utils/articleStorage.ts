import { RSSArticle } from './rssApi';

// 기사 데이터를 로컬 스토리지에 저장
export const saveArticleToStorage = (article: RSSArticle): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const existingArticles = getStoredArticles();
    const updatedArticles = existingArticles.filter(a => a.id !== article.id);
    updatedArticles.unshift(article);
    
    // 최대 1000개까지만 저장 (메모리 관리)
    const articlesToStore = updatedArticles.slice(0, 1000);
    
    localStorage.setItem('newsArticles', JSON.stringify(articlesToStore));
  } catch (error) {
    console.error('Error saving article to storage:', error);
  }
};

// 여러 기사를 한번에 저장
export const saveArticlesToStorage = (articles: RSSArticle[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const existingArticles = getStoredArticles();
    const existingIds = new Set(existingArticles.map(a => a.id));
    
    // 새로운 기사들만 추가
    const newArticles = articles.filter(article => !existingIds.has(article.id));
    const updatedArticles = [...newArticles, ...existingArticles];
    
    // 최대 1000개까지만 저장
    const articlesToStore = updatedArticles.slice(0, 1000);
    
    localStorage.setItem('newsArticles', JSON.stringify(articlesToStore));
  } catch (error) {
    console.error('Error saving articles to storage:', error);
  }
};

// 저장된 모든 기사 조회
export const getStoredArticles = (): RSSArticle[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem('newsArticles');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting stored articles:', error);
    return [];
  }
};

// ID로 특정 기사 조회
export const getArticleById = (id: string): RSSArticle | null => {
  const articles = getStoredArticles();
  return articles.find(article => article.id === id) || null;
};

// 카테고리별 기사 조회
export const getArticlesByCategory = (category: string): RSSArticle[] => {
  const articles = getStoredArticles();
  return articles.filter(article => article.category.toLowerCase() === category.toLowerCase());
}; 

// 제목과 내용을 파싱하는 함수
export const parseTitleAndContent = (combinedContent: string): { title: string; content: string } => {
  // [제목] 내용 형식인지 확인
  const titleMatch = combinedContent.match(/^\[([^\]]+)\]\s*(.*)/);
  
  if (titleMatch) {
    // [제목] 내용 형식인 경우
    const title = titleMatch[1];
    const content = titleMatch[2];
    return { title, content };
  } else {
    // 제목이 없는 경우 내용 전체를 제목으로 사용
    const title = combinedContent.length > 50 
      ? combinedContent.substring(0, 50) + '...' 
      : combinedContent;
    return { title, content: combinedContent };
  }
}; 