'use client';

import React, { useEffect, useState } from 'react';
import { RSSArticle, fetchRSSNews } from '@/utils/rssApi';
import { saveArticlesToStorage } from '@/utils/articleStorage';

import { searchNews, searchNewsWithTracking, trackSearch, getPopularSearches } from '@/utils/searchApi';
import { trackNewsClick } from '@/utils/newsClickApi';
import { 
  getAIAnalysisNews, 
  getTrendingTopics, 
  getAIFeatures, 
  getReadingGuide, 
  getPersonalizedRecommendations,
  AIAnalysisItem,
  TrendingTopic,
  AIFeature,
  ReadingGuide,
  Recommendation
} from '@/utils/dynamicContentApi';
import { getToken, isTokenValid } from '@/utils/token';
import LoginModal from '@/components/LoginModal';
import SearchBar from "@/components/SearchBar";
import SourceFilter from "@/components/SourceFilter";
import Link from "next/link";

export default function Home() {
  const [news, setNews] = useState<RSSArticle[]>([]);
  const [allNews, setAllNews] = useState<RSSArticle[]>([]); // 검색을 위한 전체 뉴스
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNewsIndex, setSelectedNewsIndex] = useState(0); // 선택된 뉴스 인덱스
  const [searchKeyword, setSearchKeyword] = useState(''); // 현재 검색어
  const [scrollProgress, setScrollProgress] = useState(0); // 스크롤 진행도
  const [activeTab, setActiveTab] = useState('popular'); // 큐레이션 탭 상태

  // 카테고리 한글 변환 함수
  const getCategoryKorean = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'general': '일반',
      'economy': '경제',
      'sports': '스포츠',
      'politics': '정치',
      'entertainment': '연예',
      'health': '건강',
      'science': '과학',
      'business': '비즈니스',
      'world': '국제',
      'society': '사회',
      'culture': '문화',
      'education': '교육',
      'environment': '환경',
      'lifestyle': '라이프스타일'
    };
    
    return categoryMap[category?.toLowerCase()] || category || '기타';
  };
  
  // 동적 콘텐츠 상태들
  const [aiAnalysisNews, setAiAnalysisNews] = useState<AIAnalysisItem[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
  const [readingGuide, setReadingGuide] = useState<ReadingGuide[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  
  // 인기뉴스 상태
  const [mainPopularNews, setMainPopularNews] = useState<any>(null);
  const [popularNewsList, setPopularNewsList] = useState<any[]>([]);
  
  // 실시간 검색어 상태
  const [searchKeywords, setSearchKeywords] = useState<any[]>([]);
  
  // 로그인 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // 검색 모달 상태
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalKeyword, setSearchModalKeyword] = useState('');
  const [searchModalResults, setSearchModalResults] = useState<RSSArticle[]>([]);
  const [searchModalLoading, setSearchModalLoading] = useState(false);
  
  // 뉴스 카테고리 탭 상태
  const [newsCategoryTab, setNewsCategoryTab] = useState('all');
  
  
  const articlesPerPage = 8; // 4x2 그리드

  // 현재 선택된 뉴스 가져오기
  const selectedNews = news.length > 0 ? news[selectedNewsIndex] : null;
  
  // 카테고리별 뉴스 필터링
  const getFilteredNews = () => {
    if (newsCategoryTab === 'all') {
      return news;
    }
    return news.filter(article => {
      const category = article.category?.toLowerCase();
      switch (newsCategoryTab) {
        case 'economy':
          return category === 'economy' || category === 'economic' || category === 'business';
        case 'sports':
          return category === 'sports' || category === 'sport';
        default:
          return true;
      }
    });
  };
  
  const filteredNews = getFilteredNews();
  
  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    const token = getToken();
    return token && isTokenValid(token);
  };
  
  // 북마크 클릭 핸들러
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!checkLoginStatus()) {
      setShowLoginModal(true);
      return;
    }
    // 로그인된 경우 북마크 페이지로 이동
    window.location.href = '/mypage/bookmarks';
  };
  
  // 마이페이지 클릭 핸들러
  const handleMyPageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!checkLoginStatus()) {
      setShowLoginModal(true);
      return;
    }
    // 로그인된 경우 마이페이지로 이동
    window.location.href = '/mypage';
  };
  
  // 로그인 성공 핸들러
  const handleLoginSuccess = (userData: { name: string }) => {
    console.log('로그인 성공:', userData);
    setShowLoginModal(false);
  };

  // 회원가입 모달 열기
  const handleSignupClick = () => {
    setShowLoginModal(false);
    setShowSignupModal(true);
  };
  
  // 빠른 검색 클릭 핸들러
  const handleQuickSearchClick = () => {
    setShowSearchModal(true);
  };
  
  // 검색 모달에서 검색 실행
  const handleSearchModalSearch = async () => {
    if (searchModalKeyword.trim()) {
      setSearchModalLoading(true);
      try {
        // 검색어 추적
        await trackSearch(searchModalKeyword);
        
        // 실시간 검색어 업데이트
        await loadSearchKeywords();
        
        // 백엔드에서 검색 실행 (백엔드 실패 시 자동으로 로컬 검색으로 대체)
        const searchResults = await searchNewsWithTracking(searchModalKeyword, allNews);
        
        setSearchModalResults(searchResults);
      } catch (error) {
        console.error('Search failed:', error);
        // 에러 시 로컬 검색으로 fallback
        const localResults = allNews.filter(article =>
          article.title.toLowerCase().includes(searchModalKeyword.toLowerCase()) ||
          article.description.toLowerCase().includes(searchModalKeyword.toLowerCase()) ||
          article.category.toLowerCase().includes(searchModalKeyword.toLowerCase())
        );
        setSearchModalResults(localResults);
      }
      setSearchModalLoading(false);
    }
  };
  
  // 검색 모달 닫기
  const handleSearchModalClose = () => {
    setShowSearchModal(false);
    setSearchModalKeyword('');
    setSearchModalResults([]);
  };
  
  // 뉴스 선택 핸들러
  const handleNewsSelect = (index: number) => {
    setSelectedNewsIndex(index);
  };

  // 뉴스 클릭 추적 핸들러
  const handleNewsClick = async (article: RSSArticle | { id: string; title: string }) => {
    try {
      // RSS 뉴스(해시 ID)는 클릭 추적 건너뛰기
      const isNumericId = /^\d+$/.test(article.id);
      if (!isNumericId) {
        console.log(`RSS 뉴스 클릭 추적 건너뛰기: ${article.title} (ID: ${article.id})`);
        return;
      }
      
      // 백그라운드에서 클릭 추적 (사용자 경험에 영향 없이)
      await trackNewsClick(article.id, article.title);
      console.log(`뉴스 클릭 추적됨: ${article.title}`);
    } catch (error) {
      console.error('뉴스 클릭 추적 실패:', error);
      // 추적 실패해도 사용자 이동은 계속 진행
    }
  };

  // 공유하기 핸들러
  const handleShare = async (article?: RSSArticle | null) => {
    const shareData = {
      title: article ? article.title : "최신 뉴스 - 뉴스 사이트",
      text: article ? article.description || article.title : "다양한 최신 뉴스를 확인해보세요",
      url: article ? `${window.location.origin}/news/${article.id}` : window.location.href
    };

    try {
      // 브라우저 공유 API 지원 여부 확인
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('공유 성공');
      } else {
        // 공유 API를 지원하지 않는 경우 클립보드에 복사
        const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
        
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다!');
        } else {
          // 클립보드 API도 지원하지 않는 경우 수동 복사 안내
          const textArea = document.createElement('textarea');
          textArea.value = shareData.url;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('링크가 클립보드에 복사되었습니다!');
        }
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 공유 실패 시 클립보드 복사로 대체
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.url);
          alert('링크가 클립보드에 복사되었습니다!');
        }
      } catch (clipboardError) {
        console.error('클립보드 복사도 실패:', clipboardError);
        alert('공유 기능을 사용할 수 없습니다. 브라우저를 업데이트해 주세요.');
      }
    }
  };

  // 인기뉴스 API 호출 함수
  const getMainPopularNews = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/news/popular?limit=1');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        const popularNews = data.data[0];
        
        // 최신 뉴스 API에서 해당 뉴스 찾기
        try {
          const allNewsResponse = await fetch('http://localhost:8080/api/news');
          const allNewsData = await allNewsResponse.json();
          if (allNewsData.success && allNewsData.data) {
            const foundNews = allNewsData.data.find((item: any) => item.newsId === popularNews.newsId);
            if (foundNews) {
            return {
              ...popularNews,
                imageUrl: foundNews.imageUrl || '/image/news.webp',
                description: foundNews.content || popularNews.newsTitle || popularNews.title,
                source: foundNews.source || '알 수 없는 출처' // 실제 언론사명 사용
            };
            }
          }
        } catch (detailError) {
          console.error('뉴스 상세 정보 로드 실패:', detailError);
        }
        
        return {
          ...popularNews,
          imageUrl: '/image/news.webp',
          description: popularNews.newsTitle || popularNews.title || `뉴스 #${popularNews.newsId}`,
          source: '알 수 없는 출처' // 기본값
        };
      }
      return null;
    } catch (error) {
      console.error('메인 인기뉴스 로드 실패:', error);
      return null;
    }
  };

  const getPopularNewsList = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/news/popular?limit=5');
      const data = await response.json();
      if (data.success && data.data.length > 0) {
        // 각 뉴스의 실제 출처 정보를 가져와서 매핑
        const newsWithSources = await Promise.all(
          data.data.map(async (news: any) => {
            try {
              // 최신 뉴스 API에서 해당 뉴스 찾기
              const allNewsResponse = await fetch('http://localhost:8080/api/news');
              const allNewsData = await allNewsResponse.json();
              if (allNewsData.success && allNewsData.data) {
                const foundNews = allNewsData.data.find((item: any) => item.newsId === news.newsId);
                if (foundNews) {
                  return {
                    ...news,
                    imageUrl: foundNews.imageUrl,
                    source: foundNews.source || '알 수 없는 출처'
                  };
                }
              }
            } catch (detailError) {
              console.error('뉴스 상세 정보 로드 실패:', detailError);
            }
            return {
              ...news,
              source: '알 수 없는 출처'
            };
          })
        );
        return newsWithSources;
      }
      return [];
    } catch (error) {
      console.error('인기뉴스 목록 로드 실패:', error);
      return [];
    }
  };

  // 실시간 검색어 불러오기
  const loadSearchKeywords = async () => {
    try {
      const keywords = await getPopularSearches(8);
      setSearchKeywords(keywords);
    } catch (error) {
      console.error('실시간 검색어 로드 실패:', error);
    }
  };

  // 검색 핸들러
  const handleSearch = async (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    
    if (keyword.trim() === '') {
      // 검색어가 없으면 전체 뉴스 표시
      setNews(allNews);
      setTotalPages(Math.ceil(allNews.length / articlesPerPage));
    } else {
      try {
        // 검색어 추적
        await trackSearch(keyword);
        
        // 실시간 검색어 업데이트
        await loadSearchKeywords();
        
        // 백엔드에서 검색 실행 (백엔드 실패 시 자동으로 로컬 검색으로 대체)
        const searchResults = await searchNewsWithTracking(keyword, allNews);
        
        setNews(searchResults);
        setTotalPages(Math.ceil(searchResults.length / articlesPerPage));
      } catch (error) {
        console.error('Search failed:', error);
        // 에러 시 로컬 검색으로 fallback
        const localResults = searchNews(keyword, allNews);
        setNews(localResults);
        setTotalPages(Math.ceil(localResults.length / articlesPerPage));
      }
    }
  };

  // IT 카테고리 배너 정보
  const categoryBanner = {
      title: "최신 뉴스와 트렌드를 한눈에",
      description: "다양한 카테고리의 최신 뉴스를 확인하고, 실시간 트렌드와 인기 뉴스를 만나보세요.",
      category: "일반"
  };

  // 스크롤 진행도 추적
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // 스크롤 진행도를 0-1 사이로 계산 (첫 화면 높이 기준)
      const progress = Math.min(scrollTop / windowHeight, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const loadNews = async () => {
      console.log('Starting to load mixed category news...');
      setLoading(true);
      try {
        // 백엔드에서 뉴스 가져오기 (우선 시도)
        try {
          const response = await fetch('http://localhost:8080/api/news?page=1&size=50', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.length > 0) {
              // 백엔드 데이터를 프론트엔드 형식으로 변환 (유효한 데이터만)
              const backendNews = data.data
                .filter((news: any) => news.title) // title만 체크 (newsId는 나중에 생성)
                .map((news: any, index: number) => ({
                  id: news.newsId ? news.newsId.toString() : `backend-${index}`,
                  title: news.title,
                  description: (news.content || '').substring(0, 200) + '...',
                  link: `/news/${news.newsId || `backend-${index}`}`,
                  category: news.category || '일반',
                  source: news.source || '알 수 없는 출처', // 실제 언론사명 사용
                  imageUrl: news.imageUrl || '/image/news.webp', // 기본 이미지 설정
                  pubDate: news.createdAt || new Date().toISOString()
                }));
              
              console.log('Loaded news from backend:', backendNews.length);
              console.log('First news item:', backendNews[0]);
              
              // 유효한 뉴스가 있을 때만 사용
              if (backendNews.length > 0) {
                console.log('Setting news state with backend data');
                setNews(backendNews);
                setAllNews(backendNews);
                
                const totalPages = Math.ceil(backendNews.length / articlesPerPage);
                setTotalPages(totalPages);
                setCurrentPage(1);
                
                saveArticlesToStorage(backendNews);
                setLoading(false); // 로딩 완료
                return; // 백엔드 성공 시 RSS는 건너뛰기
              } else {
                console.log('No valid news from backend, using RSS fallback');
              }
            }
          }
        } catch (backendError) {
          console.error('Backend failed, trying RSS fallback:', backendError);
        }
        
        // 백엔드 실패 시 RSS fallback
        console.log('Using RSS fallback...');
        const [generalNews, sportsNews, economyNews] = await Promise.all([
          fetchRSSNews('general', 8),
          fetchRSSNews('sports', 6),
          fetchRSSNews('economy', 6)
        ]);
        
        const allNews = [...generalNews, ...sportsNews, ...economyNews]
          .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        
        console.log('Loaded news from RSS fallback:', allNews.length);
        setNews(allNews);
        setAllNews(allNews);
        
        const totalPages = Math.ceil(allNews.length / articlesPerPage);
        setTotalPages(totalPages);
        setCurrentPage(1);
        
        saveArticlesToStorage(allNews);
      } catch (error) {
        console.error('Error in loadNews:', error);
      }
      setLoading(false);
    };

    loadNews();
  }, []);

  // 인기뉴스 및 실시간 검색어 로드
  useEffect(() => {
    const loadPopularNews = async () => {
      try {
        const [mainPopular, popularList, keywords] = await Promise.all([
          getMainPopularNews(),
          getPopularNewsList(),
          getPopularSearches(8)
        ]);
        
        setMainPopularNews(mainPopular);
        setPopularNewsList(popularList);
        setSearchKeywords(keywords);
        console.log('인기뉴스 및 실시간 검색어 로드 완료:', { mainPopular, popularList, keywords });
      } catch (error) {
        console.error('인기뉴스 및 실시간 검색어 로드 실패:', error);
      }
    };

    // 메인 뉴스 로드 후 인기뉴스 및 실시간 검색어 로드
    if (!loading) {
      loadPopularNews();
    }
  }, [loading]);

  // 동적 콘텐츠 로드 (메인 뉴스 로딩과 함께)
  useEffect(() => {
    const loadDynamicContent = async () => {
      try {
        const [analysisNews, topics, features, guide, recs] = await Promise.all([
          getAIAnalysisNews(),
          getTrendingTopics(),
          getAIFeatures(),
          getReadingGuide(),
          getPersonalizedRecommendations()
        ]);

        setAiAnalysisNews(analysisNews);
        setTrendingTopics(topics);
        setAiFeatures(features);
        setReadingGuide(guide);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to load dynamic content:', error);
      }
    };

    // 메인 뉴스가 로드된 후 동적 콘텐츠 로드
    if (!loading) {
      loadDynamicContent();
    }
    
    // 5분마다 동적 콘텐츠 업데이트 (메인 뉴스가 로드된 상태에서만)
    let interval: NodeJS.Timeout | null = null;
    if (!loading) {
      interval = setInterval(loadDynamicContent, 5 * 60 * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]); // loading 상태가 변경될 때만 실행

  // 현재 페이지에 표시할 기사들
  const getCurrentPageArticles = () => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return filteredNews.slice(startIndex, endIndex);
  };

  
  // 카테고리 탭 변경 핸들러
  const handleCategoryTabChange = (category: string) => {
    setNewsCategoryTab(category);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로
  };
  
  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이징 컴포넌트
  const Pagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {/* 이전 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          이전
        </button>

        {/* 페이지 번호들 */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-2 rounded-md ${
              currentPage === page
                ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          다음
        </button>
      </div>
    );
  };

  return (
    <>
    <div className="min-h-screen pb-20">
      {/* 전체 화면 동영상 배경 - 카카오페이 스타일 */}
      <div className="absolute inset-0 w-full h-screen z-0">
        {/* 배경 동영상 */}
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/image/news.webp"
        >
          <source src="/video/3433789-hd_1920_1080_25fps.mp4" type="video/mp4" />
        </video>
        
        {/* 어두운 오버레이 - 스크롤에 따라 변화 */}
        <div 
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/20 transition-opacity duration-500 ease-out"
          style={{ 
            opacity: 1 - scrollProgress * 0.7 // 스크롤할수록 투명해짐
          }}
        ></div>
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-indigo-700/40 transition-opacity duration-500 ease-out"
          style={{ 
            opacity: 1 - scrollProgress * 0.8 // 스크롤할수록 투명해짐
          }}
        ></div>
            </div>
            
      {/* 메인 콘텐츠 - 동영상 위에 오버레이 */}
      <div className="relative z-10 min-h-screen">
        {/* 첫 화면 히어로 섹션 - 전체 화면 */}
        <div 
          className="h-screen flex items-center justify-center transition-opacity duration-700 ease-out"
          style={{ 
            opacity: 1 - scrollProgress * 0.9 // 스크롤할수록 페이드 아웃
          }}
        >
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* 왼쪽: 메인 콘텐츠 */}
            <div className="text-center lg:text-left">
              {/* 메인 제목 */}
              <h1 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
                뉴스의 새로운 경험
                    </h1>
              
              {/* 서브 제목 */}
              <p className="text-xl lg:text-2xl text-blue-100 mb-8 leading-relaxed">
                AI가 분석하는 깊이 있는 뉴스와 실시간 트렌딩 정보를 한 곳에서 만나보세요
              </p>
              
              {/* CTA 버튼들 */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
                <button 
                  onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                  className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-full hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  뉴스 둘러보기
                  </button>
                <button 
                  onClick={() => handleShare()}
                  className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
                >
                    공유하기
                  </button>
                    </div>
              
              {/* 앱 스타일 기능 카드들 */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                  onClick={() => window.scrollTo({ top: 1600, behavior: 'smooth' })}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                </div>
                    <div>
                      <div className="text-white font-semibold text-sm">최신뉴스</div>
                      <div className="text-blue-200 text-xs">실시간 업데이트</div>
                </div>
                  </div>
                </div>
                
                <div 
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    // 큐레이션 섹션으로 스크롤
                    const curationSection = document.querySelector('[data-section="curation"]');
                    if (curationSection) {
                      curationSection.scrollIntoView({ behavior: 'smooth' });
                      // 조회수 급상승 탭으로 전환
                      setTimeout(() => {
                        setActiveTab('trending');
                      }, 500);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">트렌딩</div>
                      <div className="text-blue-200 text-xs">인기 키워드</div>
                </div>
                    </div>
                  </div>

                <div onClick={handleQuickSearchClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586 2.586a2 2 0 002.828 0L12.828 7H4.828z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">빠른 검색</div>
                      <div className="text-blue-200 text-xs">카테고리별</div>
                    </div>
                  </div>
                </div>
                
                <div onClick={handleBookmarkClick} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-sm">북마크</div>
                      <div className="text-blue-200 text-xs">저장된 뉴스</div>
                    </div>
                  </div>
                </div>
              </div>
                  </div>

            {/* 오른쪽: 빠른 액세스 메뉴 */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl lg:text-2xl font-bold text-white flex items-center">
                  <span className="text-2xl mr-3">⚡바로가기</span>
                  
                      </h2>
                <div className="flex items-center space-x-2 bg-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-blue-500/30">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-blue-200 text-sm font-bold">HOT</span>
                </div>
                    </div>
                    
              <div className="space-y-4">
                {/* 카테고리 바로가기 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link href="/economy" className="group bg-gradient-to-br from-green-500/20 to-emerald-600/20 hover:from-green-500/30 hover:to-emerald-600/30 rounded-xl p-4 border border-green-500/30 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">📈</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">경제 뉴스</div>
                        <div className="text-green-200 text-xs">시장 동향</div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/sports" className="group bg-gradient-to-br from-orange-500/20 to-red-600/20 hover:from-orange-500/30 hover:to-red-600/30 rounded-xl p-4 border border-orange-500/30 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">⚽</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">스포츠 뉴스</div>
                        <div className="text-orange-200 text-xs">경기 결과</div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/column" className="group bg-gradient-to-br from-blue-500/20 to-indigo-600/20 hover:from-blue-500/30 hover:to-indigo-600/30 rounded-xl p-4 border border-blue-500/30 transition-all duration-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-lg">📝</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">칼럼</div>
                        <div className="text-blue-200 text-xs">독자 의견</div>
                      </div>
                    </div>
                  </Link>
                </div>
                
                {/* 실시간 검색어 & 인기뉴스 */}
                <div className="mt-6 pt-4 border-t border-white/20">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 실시간 검색어 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-sm">실시간 검색어</h3>
                        <span className="text-white/60 text-xs">실시간</span>
                      </div>
                      <div className="space-y-2">
                        {Array.isArray(searchKeywords) && searchKeywords.length > 0 ? searchKeywords.slice(0, 5).map((item, index) => (
                  <div 
                    key={item.keyword || `keyword-${index}`} 
                            className="flex items-center space-x-3 p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                    onClick={() => handleSearch(item.keyword)}
                  >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              (item.rank || index + 1) <= 3 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white'
                      }`}>
                        {item.rank || index + 1}
                            </div>
                            <span className="text-white text-sm group-hover:text-yellow-200 transition-colors">
                        {item.keyword || '검색어 없음'}
                                </span>
                              </div>
                        )) : (
                          <div className="text-center py-4">
                            <div className="text-white/60 text-sm">실시간 검색어 준비중입니다</div>
                              </div>
                        )}
                          </div>
                      
                    </div>
                    
                    {/* 인기뉴스 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-semibold text-sm">인기뉴스</h3>
                        <span className="text-white/60 text-xs">HOT</span>
                      </div>
                      <div className="space-y-2">
                        {mainPopularNews ? (
                          <div 
                            className="group p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            onClick={() => {
                              const newsArticle = {
                                id: String(mainPopularNews.newsId),
                                title: mainPopularNews.newsTitle
                              };
                              handleNewsClick(newsArticle);
                              window.location.href = `/news/${mainPopularNews.newsId}`;
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">1</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-yellow-200 transition-colors">
                                  {mainPopularNews.newsTitle}
                                </h4>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <div className="text-white/60 text-sm">인기뉴스 준비중입니다</div>
                                  </div>
                        )}
                        
                        {popularNewsList && popularNewsList.length > 1 && (
                          <>
                            {popularNewsList.slice(1, 3).map((news, index) => (
                              <div 
                                key={news.newsId}
                                className="group p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                onClick={() => {
                                  const newsArticle = {
                                    id: String(news.newsId),
                                    title: news.newsTitle
                                  };
                                  handleNewsClick(newsArticle);
                                  window.location.href = `/news/${news.newsId}`;
                                }}
                              >
                                <div className="flex items-start space-x-3">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    index === 0 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  }`}>
                                    <span className="text-white text-xs font-bold">{index + 2}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-yellow-200 transition-colors">
                                      {news.newsTitle}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                )}
                    </div>

                    </div>
                    </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* 스크롤 다운 힌트 */}
        <div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 animate-bounce transition-opacity duration-300"
          style={{ 
            opacity: scrollProgress > 0.1 ? 0 : 1 // 스크롤하면 사라짐
          }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          </div>
        </div>

        {/* 기능 카드 섹션 - 메인배너 기능과 연결 */}
        <div className="relative z-10 bg-white">
        <div className="w-full bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
                <span className="text-4xl mr-3">⚡</span>
                빠른 접근
            </h2>
              <p className="text-gray-600 text-lg">메인배너의 기능들을 쉽게 이용하세요</p>
      </div>

            {/* 메인배너 기능 연결 카드들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {/* 최신뉴스 카드 */}
              <div 
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 cursor-pointer"
                onClick={() => window.scrollTo({ top: 1600, behavior: 'smooth' })}
              >
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl text-white">📰</span>
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <div className="text-2xl font-bold text-blue-600">LIVE</div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
                    <div className="text-xs text-gray-500">실시간 업데이트</div>
            </div>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">실시간 뉴스</h3>
                <p className="text-sm text-gray-600 mb-4">지금 가장 주목받는 뉴스들</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full" style={{width: '100%'}}></div>
        </div>
      </div>

              {/* 트렌딩 카드 */}
              <div 
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 cursor-pointer"
                onClick={() => {
                  // 큐레이션 섹션으로 스크롤
                  const curationSection = document.querySelector('[data-section="curation"]');
                  if (curationSection) {
                    curationSection.scrollIntoView({ behavior: 'smooth' });
                    // 조회수 급상승 탭으로 전환
                    setTimeout(() => {
                      setActiveTab('trending');
                    }, 500);
                  }
                }}
              >
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl text-white">📈</span>
          </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">HOT</div>
                    <div className="text-xs text-gray-500">트렌드</div>
                </div>
              </div>
                <h3 className="font-bold text-gray-900 mb-2">인기 키워드</h3>
                <p className="text-sm text-gray-600 mb-4">지금 가장 많이 검색되는 주제</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full" style={{width: '85%'}}></div>
        </div>
      </div>

              {/* 빠른 검색 카드 */}
              <div onClick={handleQuickSearchClick} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl text-white">🔍</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">3</div>
                    <div className="text-xs text-gray-500">카테고리</div>
                </div>
              </div>
                <h3 className="font-bold text-gray-900 mb-2">카테고리별 검색</h3>
                <p className="text-sm text-gray-600 mb-4">IT, 경제, 스포츠 분야별 뉴스</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-red-600 h-2 rounded-full" style={{width: '90%'}}></div>
              </div>
            </div>

              {/* 북마크 카드 */}
              <div onClick={handleBookmarkClick} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 cursor-pointer">
              <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl text-white">⭐</span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">★</div>
                    <div className="text-xs text-gray-500">저장</div>
                </div>
              </div>
                <h3 className="font-bold text-gray-900 mb-2">저장된 뉴스</h3>
                <p className="text-sm text-gray-600 mb-4">나만의 북마크 컬렉션</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full" style={{width: '75%'}}></div>
              </div>
              </div>
            </div>
            
              </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 흰색 배경 */}
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* 메인 뉴스 영역 */}
          <div className="w-full">
            {/* 최신 뉴스 제목과 설명 */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {searchKeyword ? (
                  <span>'{searchKeyword}' 검색 결과</span>
                ) : (
                  <span>최신 뉴스</span>
                )}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchKeyword ? (
                  <>
                    {news.length > 0 ? (
                      <span>'${searchKeyword}'와 관련된 뉴스를 찾았습니다</span>
                    ) : (
                      <span>'${searchKeyword}'와 관련된 뉴스를 찾을 수 없습니다</span>
                    )}
                  </>
                ) : (
                  <span>IT, 스포츠, 경제 등 다양한 분야의 최신 소식을 확인하세요</span>
                )}
              </p>
              
              {/* 카테고리 탭 - 검색 중이 아닐 때만 표시 */}
              {!searchKeyword && (
                <div className="flex justify-center mb-6">
                  <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                    {[
                      { id: 'all', name: '전체', icon: '📰' },
                      { id: 'economy', name: '경제', icon: '💰' },
                      { id: 'sports', name: '스포츠', icon: '⚽' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleCategoryTabChange(tab.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                          newsCategoryTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 검색창 - 가운데 정렬 */}
              <div className="flex justify-center mb-8">
                <div className="w-full max-w-md">
                  <SearchBar 
                    onSearch={handleSearch}
                    placeholder="뉴스 검색 (제목, 내용, 카테고리)..."
                    className="w-full"
                  />
                </div>
              </div>

              
              {/* 카테고리별 뉴스 개수 표시 */}
              {!searchKeyword && (
                <div className="text-center mb-4">
                  <span className="text-sm text-gray-500">
                    {newsCategoryTab === 'all' ? '전체' : 
                     newsCategoryTab === 'economy' ? '경제' :
                     newsCategoryTab === 'sports' ? '스포츠' : '전체'} 뉴스 {filteredNews.length}개
                  </span>
                </div>
              )}
              
              {searchKeyword && (
                <div className="mb-6">
                  <button
                    onClick={() => handleSearch('')}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-purple-600 border border-gray-300 rounded-lg hover:border-purple-500 transition-colors"
                  >
                    전체 보기
                  </button>
                </div>
              )}
            </div>

            {/* 뉴스 그리드 - 도서관 책 스타일 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                // 로딩 스켈레톤 - 모던 카드 스타일
                Array.from({ length: 8 }).map((_, index) => (
                  <div 
                    key={index} 
                    className="bg-white rounded-lg shadow-lg border-l-8 border-gray-300 overflow-hidden animate-pulse"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: 'bookSlideIn 0.8s ease-out forwards'
                    }}
                  >
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-5 bg-white">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse mb-4"></div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // 현재 페이지 기사들만 표시 - 스티커 스타일
                getCurrentPageArticles().map((article, index) => (
                  <Link 
                    key={index} 
                    href={`/news/${article.id}`}
                    className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300"
                    onClick={() => handleNewsClick(article)}
                  >
                    {/* 이미지 영역 */}
                    <div className="relative h-32 overflow-hidden rounded-t-lg">
                        {article.imageUrl ? (
                          <img
                            src={article.imageUrl}
                            alt={article.title}
                          className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                    parent.innerHTML = `
                                    <div class="w-full h-full flex items-center justify-center bg-gradient-to-br ${
                                      article.category === 'sports' || article.category === '스포츠' ? 'from-green-50 to-emerald-100' :
                                      article.category === 'economy' || article.category === '경제' ? 'from-purple-50 to-violet-100' : 'from-gray-50 to-gray-100'
                                    }">
                                <div class="text-xl opacity-60">
                                        ${article.category === 'sports' || article.category === '스포츠' ? '⚽' :
                                          article.category === 'economy' || article.category === '경제' ? '💰' : '📰'}
                                      </div>
                                    </div>
                                    `;
                              }
                            }}
                          />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${
                              article.category === 'sports' || article.category === '스포츠' ? 'from-green-50 to-emerald-100' :
                              article.category === 'economy' || article.category === '경제' ? 'from-purple-50 to-violet-100' : 'from-gray-50 to-gray-100'
                            }`}>
                          <div className="text-xl opacity-60">
                                {article.category === 'sports' || article.category === '스포츠' ? '⚽' :
                                 article.category === 'economy' || article.category === '경제' ? '💰' : '📰'}
                              </div>
                            </div>
                        )}
                        
                      {/* 카테고리 라벨 */}
                      <div className="absolute top-2 left-2">
                        <div className={`px-3 py-1 rounded-md text-xs font-bold shadow-md ${
                          article.category === 'sports' || article.category === '스포츠' ? 'bg-green-600 text-white' :
                          article.category === 'economy' || article.category === '경제' ? 'bg-purple-600 text-white' : 'bg-gray-600 text-white'
                        }`}>
                          <span>
                            {getCategoryKorean(article.category)}
                          </span>
                        </div>
                      </div>
                      
                      {/* NEW 라벨 - 최근 3개만 */}
                      {index < 3 && (
                        <div className="absolute top-2 right-2">
                          <div className="px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg">
                            NEW
                        </div>
                        </div>
                      )}
                      </div>
                      
                    {/* 내용 영역 */}
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-3 mb-3 group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                      
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {article.description || "최신 뉴스와 기술 동향을 확인해보세요."}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          article.source === '동아일보' ? 'bg-blue-100 text-blue-800' :
                          article.source === '조선일보' ? 'bg-red-100 text-red-800' :
                          article.source === '중앙일보' ? 'bg-purple-100 text-purple-800' :
                          article.source === '경향신문' ? 'bg-orange-100 text-orange-800' :
                          article.source === '연합뉴스' ? 'bg-indigo-100 text-indigo-800' :
                          article.source === '매일경제' ? 'bg-yellow-100 text-yellow-800' :
                          article.source === '한국경제' ? 'bg-pink-100 text-pink-800' :
                          article.source === '오마이뉴스' ? 'bg-cyan-100 text-cyan-800' :
                          article.source === '전자신문' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {article.source}
                        </span>
                        <span className="font-semibold text-gray-700">
                          {new Date(article.pubDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* 페이징 */}
            {!loading && news.length > 0 && <Pagination />}

        <div className="mt-8 mb-8" data-section="curation">

              {/* 탭 네비게이션 */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                <button 
                  onClick={() => setActiveTab('popular')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-200 ${
                    activeTab === 'popular' 
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b-2 border-red-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">🔥</span>
                    <span>인기뉴스</span>
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('trending')}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-200 ${
                    activeTab === 'trending' 
                      ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-b-2 border-orange-500' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">📈</span>
                    <span>조회수 급상승</span>
                  </div>
            </button>
              </div>
          
          {/* 탭별 컨텐츠 */}
          {activeTab === 'popular' && mainPopularNews && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                {/* 왼쪽: 뉴스 이미지 */}
                <div className="lg:col-span-1">
                  <div 
                    className="h-64 lg:h-full relative overflow-hidden cursor-pointer group"
                    onClick={() => {
                      const newsArticle = {
                        id: String(mainPopularNews.newsId),
                        title: mainPopularNews.newsTitle
                      };
                      handleNewsClick(newsArticle);
                      window.location.href = `/news/${mainPopularNews.newsId}`;
                    }}
                  >
                    <img 
                      src={mainPopularNews.imageUrl || '/image/news.webp'} 
                      alt={mainPopularNews.newsTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all duration-300"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
                        <span className="text-lg mr-1">🔥</span>
                        인기뉴스
                      </span>
                      </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="text-sm opacity-80">{mainPopularNews.source || '뉴스'}</div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                        <span className="text-white text-2xl">👁️</span>
                    </div>
                    </div>
                  </div>
                </div>
                
                {/* 오른쪽: 뉴스 정보 */}
                <div className="lg:col-span-2 p-6 lg:p-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-medium">
                          #1 인기뉴스
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                          {mainPopularNews.lastClickedAt ? new Date(mainPopularNews.lastClickedAt).toLocaleDateString('ko-KR') : '오늘'}
                        </span>
                      </div>
                    </div>
                    
                    <h1 
                      className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      onClick={() => {
                        const newsArticle = {
                          id: String(mainPopularNews.newsId),
                          title: mainPopularNews.newsTitle
                        };
                        handleNewsClick(newsArticle);
                        window.location.href = `/news/${mainPopularNews.newsId}`;
                      }}
                    >
                      {mainPopularNews.newsTitle}
                    </h1>
                    
                    <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed">
                      {mainPopularNews.description && mainPopularNews.description !== mainPopularNews.newsTitle
                        ? (mainPopularNews.description.length > 120 
                            ? mainPopularNews.description.slice(0, 120) + '...'
                            : mainPopularNews.description)
                        : (mainPopularNews.newsTitle.length > 120 
                            ? mainPopularNews.newsTitle.slice(0, 120) + '...'
                            : mainPopularNews.newsTitle)
                      }
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {mainPopularNews.lastClickedAt ? new Date(mainPopularNews.lastClickedAt).toLocaleDateString('ko-KR') : '오늘'}
                        </span>
                  </div>
                      <div className="flex items-center space-x-1">
                        <span>📰</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {mainPopularNews.source || '뉴스'}
                        </span>
              </div>
            </div>

                    <div className="flex space-x-3 pt-4">
                      <Link 
                        href={`/news/${mainPopularNews.newsId}`}
                        onClick={() => {
                          const newsArticle = {
                            id: String(mainPopularNews.newsId),
                            title: mainPopularNews.newsTitle
                          };
                          handleNewsClick(newsArticle);
                        }}
                        className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-lg"
                      >
                        상세정보
                      </Link>
                      <button 
                        onClick={() => handleShare({
                          id: String(mainPopularNews.newsId),
                          title: mainPopularNews.newsTitle,
                          description: mainPopularNews.description
                        } as RSSArticle)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        공유하기
                      </button>
                        </div>
                      </div>
                        </div>
                      </div>
                    </div>
                  )}

          {/* 조회수 급상승 탭 */}
          {activeTab === 'trending' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 실시간 검색어 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <span className="text-xl mr-2">⚡</span>
                      실시간 검색어
                </h3>
                    <div className="space-y-3">
                      {searchKeywords.slice(0, 5).map((keyword, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                             onClick={() => handleSearch(keyword.keyword)}>
                          <div className="flex items-center space-x-3">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              #{index + 1}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {keyword.keyword}
                            </span>
                        </div>
                      </div>
                      ))}
                        </div>
                      </div>

                  {/* 조회수 급상승 뉴스 5개 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <span className="text-xl mr-2">📈</span>
                      조회수 급상승 뉴스
                    </h3>
                    <div className="space-y-3">
                      {/* 1위 뉴스 */}
                      {mainPopularNews && (
                        <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                             onClick={() => {
                               const newsArticle = {
                                 id: String(mainPopularNews.newsId),
                                 title: mainPopularNews.newsTitle
                               };
                               handleNewsClick(newsArticle);
                               window.location.href = `/news/${mainPopularNews.newsId}`;
                             }}>
                          <div className="flex items-center space-x-3">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              #1
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white line-clamp-2">
                              {mainPopularNews.newsTitle || mainPopularNews.title}
                            </span>
                    </div>
                      </div>
                      )}

                      {/* 2~5위 뉴스 */}
                      {popularNewsList.slice(1, 5).map((newsItem, index) => (
                        <div key={newsItem.newsId || index} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors cursor-pointer"
                             onClick={() => {
                               const newsArticle = {
                                 id: String(newsItem.newsId),
                                 title: newsItem.newsTitle || newsItem.title
                               };
                               handleNewsClick(newsArticle);
                               window.location.href = `/news/${newsItem.newsId}`;
                             }}>
                          <div className="flex items-center space-x-3">
                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              #{index + 2}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white line-clamp-2">
                              {newsItem.newsTitle || newsItem.title || `뉴스 #${newsItem.newsId}`}
                            </span>
                </div>
                      </div>
                      ))}
              </div>
            </div>
                        </div>
                      </div>
                      </div>
          )}

                    </div>
              




                  </div>

                  </div>
                </div>

      {/* 푸터를 위한 여백 */}
      <div className="h-20"></div>
              </div>

    {/* 로그인 모달 */}
    <LoginModal
      isOpen={showLoginModal}
      onClose={() => setShowLoginModal(false)}
      onSignupClick={handleSignupClick}
      onLoginSuccess={handleLoginSuccess}
    />
    
    {/* 검색 모달 */}
    {showSearchModal && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 scale-100">
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-3xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                    </div>
                <div>
                  <h2 className="text-2xl font-bold">빠른 검색</h2>
                  <p className="text-orange-100 text-sm">원하는 뉴스를 검색해보세요</p>
                    </div>
                    </div>
              <button
                onClick={handleSearchModalClose}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
                  </div>
                </div>

          {/* 검색 입력 */}
          <div className="p-6">
            <div className="relative">
              <input
                type="text"
                value={searchModalKeyword}
                onChange={(e) => setSearchModalKeyword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchModalSearch()}
                placeholder="검색어를 입력하세요..."
                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-orange-500 focus:outline-none transition-colors"
                autoFocus
              />
              <button
                onClick={handleSearchModalSearch}
                className="absolute right-2 top-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-xl hover:from-orange-600 hover:to-red-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>검색</span>
              </button>
                    </div>
            
            {/* 인기 검색어 */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-3">인기 검색어</h3>
              <div className="flex flex-wrap gap-2">
                {searchKeywords.slice(0, 6).map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSearchModalKeyword(keyword.keyword);
                      handleSearchModalSearch();
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-full text-sm transition-colors duration-200"
                  >
                    {keyword.keyword}
                  </button>
                ))}
                    </div>
                    </div>
            
            {/* 검색 결과 */}
            {searchModalLoading && (
              <div className="mt-6 text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-gray-600">검색 중...</p>
                  </div>
            )}
            
            {searchModalResults.length > 0 && !searchModalLoading && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    검색 결과 ({searchModalResults.length}개)
                  </h3>
                  <button
                    onClick={() => setSearchModalResults([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    결과 지우기
                  </button>
                    </div>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {searchModalResults.map((article, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        handleNewsClick(article);
                        window.location.href = `/news/${article.id}`;
                      }}
                      className="p-4 bg-gray-50 hover:bg-orange-50 rounded-xl cursor-pointer transition-colors duration-200 border border-gray-200 hover:border-orange-200"
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={article.imageUrl || '/image/news.webp'}
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/image/news.webp';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.description}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                              {article.category}
                            </span>
                            <span>{article.source}</span>
                            <span>{new Date(article.pubDate).toLocaleDateString('ko-KR')}</span>
                    </div>
                    </div>
                  </div>
                </div>
                  ))}
              </div>
            </div>
            )}
            
            {searchModalResults.length === 0 && !searchModalLoading && searchModalKeyword && (
              <div className="mt-6 text-center py-8">
                <div className="text-gray-400 text-4xl mb-3">🔍</div>
                <p className="text-gray-600">검색 결과가 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">다른 검색어를 시도해보세요</p>
              </div>
                )}
              </div>
              </div>
            </div>
    )}
    </>
  );
} 