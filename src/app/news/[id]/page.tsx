'use client';

import React, { useEffect, useState, use } from 'react';
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { getArticleById } from '@/utils/articleStorage';
import { RSSArticle } from '@/utils/rssApi';
import { trackNewsClick } from '@/utils/popularNewsApi';
import { addBookmark, removeBookmark, checkBookmark, addViewHistory } from '@/utils/myNewsApi';
import CommentSection from '@/components/CommentSection';

interface NewsDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { id } = use(params);
  const [article, setArticle] = useState<RSSArticle | null>(null);
  const [fullContent, setFullContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  

  const [hasTrackedView, setHasTrackedView] = useState(false); // 조회수 추적 여부
  const [isTrackingInProgress, setIsTrackingInProgress] = useState(false); // 조회수 추적 진행 중
  const [isBookmarked, setIsBookmarked] = useState(false); // 북마크 상태
  const [bookmarkId, setBookmarkId] = useState<number | null>(null); // 북마크 ID
  const [readTime, setReadTime] = useState(0); // 읽은 시간 (초)
  const [readStartTime, setReadStartTime] = useState<number | null>(null); // 읽기 시작 시간
  
  useEffect(() => {
    const loadArticle = async () => {
      console.log('=== loadArticle 함수 시작 ===');
      console.log('🔍 받은 ID:', id, '(타입:', typeof id, ')');
      
      // ID가 숫자인지 확인 (백엔드 ID vs RSS ID)
      const isNumericId = /^\d+$/.test(id);
      console.log('🔍 숫자 ID 여부:', isNumericId);
      
      if (isNumericId) {
        console.log('✅ 숫자 ID 확인됨, 백엔드 API 호출 진행');
        try {
          // 백엔드에서 뉴스 상세 조회 (조회수 증가 없이 데이터만 가져오기)
          const apiUrl = `http://localhost:8080/api/news/${id}`;
          console.log('🔍 뉴스 상세 API 호출 URL:', apiUrl);
          console.log('🔍 뉴스 ID:', id, '(타입:', typeof id, ')');
          console.log('🔍 뉴스 ID가 숫자인가?:', /^\d+$/.test(id));
          
          const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          mode: 'cors',
        });
        
        console.log('🔍 API 응답 상태:', response.status, response.statusText);
        console.log('🔍 API 응답 헤더 Content-Type:', response.headers.get('content-type'));
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
            const data = await response.json();
              console.log('🔍 뉴스 상세 API 응답 데이터:', data);
            
            if (data.success && data.data) {
            const newsData = data.data;
            console.log('🔍 실제 뉴스 데이터:', newsData);
            // 백엔드 데이터를 프론트엔드 형식으로 변환
            const formattedArticle: RSSArticle = {
              id: newsData.newsId.toString(),
              title: newsData.title,
              description: newsData.content,
              link: `/news/${newsData.newsId}`,
              category: newsData.category,
              source: newsData.source || 'Backend News',
              imageUrl: newsData.imageUrl,
              pubDate: newsData.createdAt || new Date().toISOString()
            };
            setArticle(formattedArticle);
            setFullContent(newsData.content);
            
            // 페이지 로드 시에는 클릭 추적 안함 (사용자가 실제로 읽기 시작할 때만)
            } else {
              // 백엔드 데이터가 유효하지 않을 때 fallback
              console.log('❌ 백엔드 응답에 success:true 또는 data가 없음');
              console.log('❌ 응답 상세:', data);
              const foundArticle = getArticleById(id);
              setArticle(foundArticle);
            }
            } catch (jsonError) {
              // JSON 파싱 에러 처리
              console.error('❌ JSON 파싱 에러:', jsonError);
              console.log('🔄 로컬 스토리지에서 뉴스 검색...');
              const foundArticle = getArticleById(id);
              setArticle(foundArticle);
            }
          } else {
            // JSON이 아닌 응답일 때 fallback
            console.log('⚠️ JSON이 아닌 응답 타입:', contentType);
            const foundArticle = getArticleById(id);
            setArticle(foundArticle);
          }
        } else {
          // 백엔드 실패 시 로컬 스토리지 fallback
          console.log('❌ API 응답 실패:', response.status, response.statusText);
          
          // 응답 본문도 확인
          try {
            const errorText = await response.text();
            console.log('❌ 오류 응답 본문:', errorText);
          } catch (e) {
            console.log('❌ 오류 응답 본문을 읽을 수 없음:', e);
          }
          
          const foundArticle = getArticleById(id);
          setArticle(foundArticle);
        }
        } catch (error) {
          console.error('Failed to load article from backend:', error);
          // 에러 시 로컬 스토리지 fallback
          const foundArticle = getArticleById(id);
          setArticle(foundArticle);
        }
      } else {
        // RSS ID인 경우 로컬 스토리지에서 직접 가져오기
        console.log('📱 RSS ID 감지됨, 로컬 스토리지에서 조회');
        const foundArticle = getArticleById(id);
        console.log('📱 로컬 스토리지 조회 결과:', foundArticle ? '찾음' : '못찾음');
        setArticle(foundArticle);
        if (foundArticle) {
          setFullContent(foundArticle.description || '');
        } else {
          console.error('Article not found in local storage for ID:', id);
        }
      }
      
      console.log('=== loadArticle 함수 완료 ===');
      setLoading(false);
    };
    
    console.log('🔄 useEffect 실행됨, loadArticle 호출');
    loadArticle();
  }, [id]);

  // 기사 로드 시 저장된 요약 확인
  useEffect(() => {
    if (article) {
      if (article.aiSummary && article.summaryGenerated) {
        setAiSummary(article.aiSummary);
      }
    }
  }, [article]);

  // 기사 내용이 로드된 후 AI 요약 자동 생성 (저장된 요약이 없는 경우만)
  useEffect(() => {
    if (article && fullContent && aiSummary.length === 0 && !summaryLoading && !article.summaryGenerated) {
      generateAISummary();
    }
  }, [article, fullContent]);



  // 사용자가 실제로 기사를 읽기 시작했을 때 조회수 추적
  useEffect(() => {
    console.log('🔄 조회수 추적 useEffect 실행됨');
    console.log('article:', !!article);
    console.log('hasTrackedView:', hasTrackedView);
    console.log('isTrackingInProgress:', isTrackingInProgress);
    
    if (!article || hasTrackedView || isTrackingInProgress) {
      console.log('❌ useEffect 조건에서 종료됨');
      return;
    }

    const isNumericId = /^\d+$/.test(id);
    if (!isNumericId) return; // 백엔드 뉴스가 아니면 추적 안함

    // 북마크 상태 확인
    const checkBookmarkStatus = async () => {
      try {
        console.log('🔍 북마크 상태 확인 시작, newsId:', id);
        const bookmarkCheck = await checkBookmark(id);
        console.log('🔍 북마크 상태 확인 결과:', bookmarkCheck);
        
        setIsBookmarked(bookmarkCheck.isBookmarked);
        if (bookmarkCheck.bookmark?.bookmarkId) {
          setBookmarkId(bookmarkCheck.bookmark.bookmarkId);
          console.log('📌 북마크 ID 설정:', bookmarkCheck.bookmark.bookmarkId);
        }
      } catch (error) {
        console.error('❌ 북마크 상태 확인 실패:', error);
        // 오류 시 안전한 기본값 설정
        setIsBookmarked(false);
        setBookmarkId(null);
      }
    };

    // 조회 기록 추가
    const addViewRecord = async () => {
      try {
        await addViewHistory(id, article.title, article.category || 'general', 0);
      } catch (error) {
        console.error('조회 기록 추가 실패:', error);
      }
    };

    // 읽기 시작 시간 기록
    const startReading = () => {
      if (!readStartTime) {
        setReadStartTime(Date.now());
        console.log('읽기 시작 시간 기록:', new Date().toLocaleString());
      }
    };

    // 북마크 상태 확인 및 조회 기록 추가
    checkBookmarkStatus();
    addViewRecord();
    startReading();

    // 전역 및 세션 기반 중복 방지
    const globalTrackingKey = `tracking_${id}`;
    const viewedNewsKey = `viewed_news_${id}`;
    const reactStrictModeKey = `strict_mode_${id}`;
    
    // React StrictMode 중복 실행 방지
    if ((window as any)[reactStrictModeKey]) {
      console.log('React StrictMode로 인한 중복 실행입니다. 무시합니다.');
      setHasTrackedView(true);
      return;
    }
    (window as any)[reactStrictModeKey] = true;
    
    // 전역적으로 이미 추적 중인지 확인
    if ((window as any)[globalTrackingKey]) {
      console.log('전역적으로 이미 추적 중입니다.');
      setHasTrackedView(true);
      return;
    }

    // 세션 내에서 이미 조회한 뉴스인지 확인
    const sessionViewTime = sessionStorage.getItem(viewedNewsKey);
    if (sessionViewTime) {
      const lastViewTime = parseInt(sessionViewTime);
      const now = Date.now();
      if (now - lastViewTime < 5 * 60 * 1000) { // 5분
        console.log('최근에 조회한 뉴스입니다. 조회수 추적 안함');
        setHasTrackedView(true);
        return;
      }
    }

    // localStorage로도 중복 방지 (브라우저 재시작 후에도 유지)
    const localViewTime = localStorage.getItem(viewedNewsKey);
    if (localViewTime) {
      const lastViewTime = parseInt(localViewTime);
      const now = Date.now();
      if (now - lastViewTime < 30 * 60 * 1000) { // 30분
        console.log('최근에 조회한 뉴스입니다. (localStorage) 조회수 추적 안함');
        setHasTrackedView(true);
        return;
      }
    }

    // 조회수 추적 함수
    const trackView = async () => {
      console.log('=== trackView 함수 호출됨 ===');
      console.log('hasTrackedView:', hasTrackedView);
      console.log('isTrackingInProgress:', isTrackingInProgress);
      console.log('globalTrackingKey exists:', !!(window as any)[globalTrackingKey]);
      
      if (hasTrackedView || isTrackingInProgress || (window as any)[globalTrackingKey]) {
        console.log('조건에 의해 추적이 중단됨');
        return;
      }
      
      console.log('조회수 추적 시작!');
      setIsTrackingInProgress(true);
      (window as any)[globalTrackingKey] = true;
      
      try {
        const success = await trackNewsClick(
          article.id,
          article.title,
          article.category,
          article.link
        );
        
        if (success) {
          setHasTrackedView(true);
          const now = Date.now().toString();
          // 세션과 로컬 스토리지 모두에 저장
          sessionStorage.setItem(viewedNewsKey, now);
          localStorage.setItem(viewedNewsKey, now);
          console.log('✅ 뉴스 조회 추적 완료:', article.title);
        }
      } catch (error) {
        console.error('❌ 조회수 추적 실패:', error);
      } finally {
        setIsTrackingInProgress(false);
        // 5초 후 전역 플래그 해제 (에러 상황 대비)
        setTimeout(() => {
          delete (window as any)[globalTrackingKey];
        }, 5000);
      }
    };

    // 5초 후 자동으로 조회수 추적 (사용자가 페이지에 머물고 있다고 판단)
    const timer = setTimeout(trackView, 5000);

    // 스크롤 이벤트로 조회수 추적
    const handleScroll = () => {
      if (hasTrackedView || isTrackingInProgress) return;
      
      // 페이지를 30% 이상 스크롤했을 때
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 30) {
        trackView();
        window.removeEventListener('scroll', handleScroll);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      // 컴포넌트 언마운트 시 전역 플래그 해제
      delete (window as any)[globalTrackingKey];
    };
  }, [article, id, hasTrackedView, isTrackingInProgress]);

  // RSS description에서 JSON 데이터 파싱
  const parseRSSDescription = (description: string): string => {
    if (!description) return '';
    
    console.log('🔍 원본 description 길이:', description.length);
          console.log('🔍 전체 description:', description);
      

    
    // 먼저 일반 텍스트인지 확인 (JSON이 아닌 경우)
    if (!description.includes('"type":"text"') && !description.includes('"content"') && !description.includes('[{')) {
      console.log('📝 일반 텍스트로 처리');
      return description.trim();
    }
    
    // JSON 형태의 description인지 확인
    if (description.includes('"type":"text"') || description.includes('"content"') || description.includes('[{')) {
      console.log('📝 JSON 형태 데이터 감지됨');
      
      // 순서를 유지하면서 content 추출
      const contentMatches = [];
      
      // 1단계: JSON 배열 구조 파싱 시도
      try {
        // 전체가 JSON 배열인지 확인
        if (description.trim().startsWith('[') && description.trim().endsWith(']')) {
          const jsonArray = JSON.parse(description);
          if (Array.isArray(jsonArray)) {
            console.log('✅ 완전한 JSON 배열 파싱 성공, 항목 수:', jsonArray.length);
            for (const item of jsonArray) {
              if (item.type === 'text' && item.content && item.content.trim().length > 5) {
                contentMatches.push(item.content.trim());
              }
            }
          }
        } else {
          // 부분적인 JSON 배열 찾기
          const jsonMatch = description.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const jsonArray = JSON.parse(jsonMatch[0]);
            if (Array.isArray(jsonArray)) {
              console.log('✅ 부분 JSON 배열 파싱 성공, 항목 수:', jsonArray.length);
              for (const item of jsonArray) {
                if (item.type === 'text' && item.content && item.content.trim().length > 5) {
                  contentMatches.push(item.content.trim());
                }
              }
            }
          }
        }
      } catch (e) {
        console.log('❌ JSON 배열 파싱 실패:', e instanceof Error ? e.message : String(e));
      }
      
      // 2단계: JSON 배열 파싱이 실패한 경우 순서대로 정규식 추출
      if (contentMatches.length === 0) {
        // 더 포괄적인 패턴들을 순서대로 시도
        const patterns = [
          // 패턴 1: 기본 JSON 구조
          /\{"[^"]*":"[^"]*","content":"([^"]*(?:\\.[^"]*)*)","type":"text"\}/g,
          // 패턴 2: _id가 있는 구조
          /\{"_id":"[^"]*","content":"([^"]*(?:\\.[^"]*)*)","type":"text"\}/g,
          // 패턴 3: 순서가 다른 구조
          /\{"content":"([^"]*(?:\\.[^"]*)*)","type":"text","[^"]*":"[^"]*"\}/g,
          // 패턴 4: 간단한 content만
          /"content":"([^"]*(?:\\.[^"]*)*)"/g
        ];
        
        for (const pattern of patterns) {
          pattern.lastIndex = 0; // 정규식 초기화
          let match;
          
          while ((match = pattern.exec(description)) !== null) {
            let content = match[1];
            
            // 이스케이프 문자 처리
            content = content
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '')
              .replace(/\\t/g, ' ')
              .replace(/\\\\/g, '\\')
              .trim();
            
            // 의미있는 한국어 텍스트만 추가 (중복 방지)
            if (content.length > 10 && 
                /[가-힣]/.test(content) && 
                !contentMatches.some(existing => existing.includes(content.substring(0, 20)) || content.includes(existing.substring(0, 20)))) {
              contentMatches.push(content);
            }
          }
          
          // 충분한 내용을 찾았으면 중단
          if (contentMatches.length > 3) break;
        }
      }
      
      // 3단계: 더 간단한 패턴으로 시도
      if (contentMatches.length === 0) {
        const simpleRegex = /"content":"([^"]+)"/g;
        let match;
        
        while ((match = simpleRegex.exec(description)) !== null) {
          let content = match[1]
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .trim();
          
          if (content.length > 10 && /[가-힣]/.test(content)) {
            contentMatches.push(content);
          }
        }
      }
      
      console.log('📊 추출된 content 개수:', contentMatches.length);
      
      if (contentMatches.length > 0) {
        // 순서를 유지하면서 연결
        const result = contentMatches.join(' ');
        
        console.log('✅ 파싱 성공! 결과 길이:', result.length);
        console.log('📄 첫 번째 문단:', result.substring(0, 100));
        return result;
      }
      
      // 4단계: 모든 한국어 텍스트 블록 추출 (가장 공격적인 방법)
      if (contentMatches.length === 0) {
        console.log('🔄 모든 한국어 텍스트 추출 시도...');
        
        // 모든 한국어가 포함된 긴 텍스트 블록 찾기
        const koreanTextRegex = /([가-힣][^"]{30,})/g;
        let match;
        
        while ((match = koreanTextRegex.exec(description)) !== null) {
          let content = match[1].trim();
          
          // JSON 키워드가 아닌 실제 기사 내용만
          if (!content.includes('_id') && 
              !content.includes('type') && 
              !content.includes('content') &&
              !content.includes('{') &&
              !content.includes('}') &&
              content.length >= 30) {
            
            // 문장 끝에서 자르기
            const sentenceEnd = content.search(/[.!?]\s/);
            if (sentenceEnd > 20) {
              content = content.substring(0, sentenceEnd + 1);
            }
            
            // 중복 제거
            if (!contentMatches.some(existing => existing.includes(content.substring(0, 20)) || content.includes(existing.substring(0, 20)))) {
              contentMatches.push(content);
            }
          }
        }
      }
      
      // 최종 수단: 모든 JSON 구조 제거하고 텍스트만 추출
      if (contentMatches.length === 0) {
        console.log('🔄 최종 수단 시도...');
        let fallback = description
          .replace(/\{"[^"]*":"[^"]*","content":"([^"]*?)","type":"text"\}/g, '$1 ')
          .replace(/\{"_id":"[^"]*","content":"([^"]*?)","type":"text"\}/g, '$1 ')
          .replace(/\{"content":"([^"]*?)","type":"text"[^}]*\}/g, '$1 ')
          .replace(/\\"/g, '"')
          .replace(/\\n/g, '\n')
          .replace(/\{[^}]*\}/g, '')
          .replace(/\[|\]/g, '')
          .replace(/,+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (fallback.length > 50) {
          console.log('🆘 Fallback 사용, 길이:', fallback.length);
          return fallback;
        }
      }
    }
    
    // 일반 텍스트인 경우 그대로 반환
    console.log('📝 일반 텍스트로 처리');
    return description.trim();
  };

  const loadFullContent = async (articleUrl: string) => {
    setContentLoading(true);
    try {
      // 기본 RSS description을 파싱하여 설정
      const rawDescription = article?.description || '';
      const parsedDescription = parseRSSDescription(rawDescription);
      
      console.log('🔍 기사 URL:', articleUrl);
      console.log('🔍 RSS description 길이:', parsedDescription.length);
      console.log('🔍 RSS description 내용:', parsedDescription.substring(0, 200) + '...');
      
      // RSS description이 있으면 무조건 먼저 표시 (조건 대폭 완화)
      if (parsedDescription && parsedDescription.length > 20) {
        const enhancedContent = `${parsedDescription}

📖 **RSS 피드 기반 기사 내용**

🔗 **더 자세한 내용**: 상단의 "원문 보기" 버튼을 클릭하여 ${article?.source || '언론사'} 웹사이트에서 전체 기사를 확인하세요.

📰 **언론사**: ${article?.source || '정보 없음'}
📅 **발행일**: ${article?.pubDate ? new Date(article.pubDate).toLocaleString('ko-KR') : '정보 없음'}

✨ **AI 요약**: "AI 스마트 요약" 기능으로 핵심 내용을 3줄로 확인할 수 있습니다.

💡 **참고**: 이 내용은 RSS 피드에서 제공된 정보입니다. 전체 기사는 원문 보기를 통해 확인하세요.`;
        
        setFullContent(enhancedContent);
        console.log('✅ RSS description 강제 사용:', parsedDescription.length, '자');
        return; // 여기서 종료
      }
      
      // API를 통해 전체 기사 내용 시도
      const response = await fetch(`/api/article-content?url=${encodeURIComponent(articleUrl)}`);
      const data = await response.json();
      
      console.log('🔍 API 응답:', data.content ? data.content.length + '자' : '내용 없음');
      
      // 우선 RSS description이 충분히 길면 바로 사용
      if (parsedDescription && parsedDescription.length > 300) {
        setFullContent(parsedDescription);
        console.log('✅ 긴 RSS description 사용:', parsedDescription.length, '자');
      } else if (data.content && data.content.length > 30) {
        // API에서 성공적으로 가져온 경우
        let processedContent = '';
        
        // JSON 형태인지 확인
        if (data.content.includes('"type":"text"') && data.content.includes('"content"')) {
          console.log('🔍 JSON 파싱 시도...');
          
          // 1차: 기본 파싱
          processedContent = parseRSSDescription(data.content);
          console.log('🔍 1차 파싱 결과:', processedContent.length, '자');
          
          // 2차: 원본에서 모든 한국어 텍스트 추출 (더 공격적으로)
          const allKoreanTexts = [];
          
          // 모든 따옴표 안의 한국어 텍스트 찾기 (길이 제한 없이)
          const koreanTextRegex = /"([^"]*[가-힣][^"]*?)"/g;
          let match;
          
          while ((match = koreanTextRegex.exec(data.content)) !== null) {
            let text = match[1]
              .replace(/\\"/g, '"')
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '')
              .replace(/\\t/g, ' ')
              .replace(/\\\\/g, '\\')
              .trim();
            
            // 의미있는 한국어 텍스트만 (20자 이상, JSON 키가 아닌)
            if (text.length >= 20 && 
                !text.includes('_id') && 
                !text.includes('type') && 
                !text.includes('content') &&
                /[가-힣]/.test(text)) {
              allKoreanTexts.push(text);
            }
          }
          
          console.log('🔍 추출된 한국어 텍스트 개수:', allKoreanTexts.length);
          
                     // 중복 제거 및 정렬
           const uniqueTexts: string[] = [];
           for (const text of allKoreanTexts) {
             // 중복 체크 (첫 50자 기준)
             const isDuplicate = uniqueTexts.some((existing: string) => 
               existing.substring(0, 50) === text.substring(0, 50)
             );
             
             if (!isDuplicate) {
               uniqueTexts.push(text);
             }
           }
          
          console.log('🔍 중복 제거 후:', uniqueTexts.length, '개');
          
          // 모든 텍스트 조합
          if (uniqueTexts.length > 0) {
            const combinedContent = uniqueTexts.join(' ');
            
            // 기본 파싱 결과와 비교해서 더 긴 것 사용
            if (combinedContent.length > processedContent.length) {
              processedContent = combinedContent;
              console.log('✅ 조합된 텍스트 사용:', processedContent.length, '자');
            }
          }
          
        } else {
          // 일반 텍스트
          processedContent = data.content;
        }
        
        // RSS description과 API 내용을 합치기
        if (parsedDescription && parsedDescription.length > 50) {
          processedContent = `${parsedDescription}\n\n${processedContent}`;
        }
        
        setFullContent(processedContent);
        console.log('✅ API 내용 처리 완료:', processedContent.length, '자');
      } else if (parsedDescription && parsedDescription.length > 50) {
        // 파싱된 RSS description 사용 (조건 대폭 완화)
        const enhancedContent = `${parsedDescription}

📖 이 기사는 RSS 피드에서 제공된 내용입니다.

🔗 전체 기사의 세부 내용을 확인하려면 상단의 "원문 보기" 버튼을 클릭해주세요.

📰 언론사: ${article?.source || ''}
📅 발행일: ${article?.pubDate ? new Date(article.pubDate).toLocaleString('ko-KR') : ''}

✨ AI 요약 기능을 통해 이 기사의 핵심 내용을 3줄로 확인할 수 있습니다.

💡 더 자세한 정보가 필요하시면 원문 보기를 이용해주세요.`;
        
        setFullContent(enhancedContent);
        console.log('✅ 향상된 RSS description 사용:', parsedDescription.length, '자');
      } else if (parsedDescription && parsedDescription.length > 30) {
        // 아주 짧은 RSS description도 활용
        const enhancedContent = `${parsedDescription}

📖 이 기사는 RSS 피드에서 제공된 요약 내용입니다.

🔗 전체 기사의 세부 내용을 확인하려면 상단의 "원문 보기" 버튼을 클릭해주세요.

📰 언론사: ${article?.source || ''}
📅 발행일: ${article?.pubDate ? new Date(article.pubDate).toLocaleString('ko-KR') : ''}

✨ AI 요약 기능을 통해 이 기사의 핵심 내용을 3줄로 확인할 수 있습니다.`;
        
        setFullContent(enhancedContent);
      } else {
        // 최후의 수단 - 제목과 기본 정보로 풍부한 내용 생성
        const fallbackContent = `📰 ${article?.title || '뉴스 기사'}

📅 발행일: ${article?.pubDate ? new Date(article.pubDate).toLocaleString('ko-KR') : '정보 없음'}
📰 언론사: ${article?.source || '정보 없음'}

🔍 이 기사의 전체 내용을 자동으로 가져올 수 없어 아쉽습니다.

📖 **기사 확인 방법:**

🔗 **원문 보기**: 상단의 "원문 보기" 버튼을 클릭하여 ${article?.source || '언론사'} 웹사이트에서 전체 기사를 읽어보세요.

✨ **AI 스마트 요약**: "AI 스마트 요약" 기능을 사용하여 기사의 핵심 내용을 3줄로 확인해보세요.

📱 **모바일 팁**: 모바일에서는 브라우저의 "전체 기사 보기" 또는 "리더 모드" 옵션을 사용해보세요.

🔄 **재시도**: 잠시 후 페이지를 새로고침하면 내용이 로드될 수 있습니다.

💡 **참고사항**: 일부 언론사는 보안 정책으로 인해 외부에서 기사 내용을 가져올 수 없도록 설정되어 있습니다.

📞 **문의**: 지속적인 문제가 있으시면 해당 언론사에 직접 문의하시기 바랍니다.`;
        
        setFullContent(fallbackContent);
      }
      
    } catch (error) {
      console.error('기사 내용 로드 실패:', error);
      
      // 에러 발생 시에도 파싱된 RSS description 활용
      const rawDescription = article?.description || '';
      const parsedDescription = parseRSSDescription(rawDescription);
      
      if (parsedDescription.length > 50) {
        const errorContent = `${parsedDescription}

⚠️ 전체 기사를 불러오는 중 일시적인 문제가 발생했습니다.

🔗 상단의 "원문 보기" 버튼을 통해 ${article?.source || '언론사'} 웹사이트에서 전체 내용을 확인해주세요.

✨ AI 요약 기능으로 핵심 내용을 빠르게 파악하실 수 있습니다.

🔄 잠시 후 페이지를 새로고침하시면 문제가 해결될 수 있습니다.`;
        
        setFullContent(errorContent);
      } else {
        setFullContent(`❌ 기사 내용을 불러올 수 없습니다.

🔗 원문 보기를 통해 ${article?.source || '언론사'} 웹사이트에서 확인해주세요.`);
      }
    } finally {
      setContentLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!article) return;
    
    // 이미 저장된 요약이 있는지 확인
    if (article.aiSummary && article.summaryGenerated) {
      setAiSummary(article.aiSummary);
      return;
    }
    
    setSummaryLoading(true);
    try {
      // RSS description을 파싱하여 AI 요약에 사용
      const rawDescription = article?.description || '';
      const parsedDescription = parseRSSDescription(rawDescription);
      
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          content: fullContent,
          description: parsedDescription // 파싱된 description 사용
        })
      });

      const data = await response.json();
      
      if (data.summary) {
        setAiSummary(data.summary);
        
        // 로컬 스토리지에 요약 저장
        const savedArticles = JSON.parse(localStorage.getItem('newsArticles') || '[]');
        const updatedArticles = savedArticles.map((savedArticle: RSSArticle) => {
          if (savedArticle.id === article.id) {
            return {
              ...savedArticle,
              aiSummary: data.summary,
              summaryGenerated: true
            };
          }
          return savedArticle;
        });
        localStorage.setItem('newsArticles', JSON.stringify(updatedArticles));
        
      } else {
        console.error('요약 생성 실패:', data.error);
        // 기본 메시지로 폴백
        setAiSummary([
          "📌 요약 생성에 실패했습니다. 기사 내용을 직접 확인해 주세요.",
          "🔍 원문 보기를 통해 전체 내용을 읽어보실 수 있습니다.",
          "🔄 잠시 후 다시 시도해보시거나 페이지를 새로고침해 주세요."
        ]);
      }
    } catch (error) {
      console.error('AI 요약 생성 중 오류:', error);
      // 기본 메시지로 폴백
      setAiSummary([
        "📌 요약 생성 중 오류가 발생했습니다.",
        "🔍 원문 보기를 통해 전체 내용을 확인해 주세요.",
        "🔄 잠시 후 다시 시도해보시기 바랍니다."
      ]);
    } finally {
      setSummaryLoading(false);
    }
  };

  // 읽은 시간 업데이트 (1초마다)
  useEffect(() => {
    if (!readStartTime) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - readStartTime) / 1000);
      setReadTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [readStartTime]);

  // 페이지 떠날 때 읽은 시간 저장
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (readTime > 0) {
        // 읽은 시간을 서버에 저장
        const isNumericId = /^\d+$/.test(id);
        if (isNumericId && article) {
          addViewHistory(id, article.title, article.category || 'general', readTime);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [readTime, id, article]);

  // 북마크 토글 함수
  const toggleBookmark = async () => {
    if (!article) return;

    const isNumericId = /^\d+$/.test(id);
    if (!isNumericId) {
      alert('RSS 뉴스는 북마크할 수 없습니다.');
      return;
    }

    try {
      if (isBookmarked && bookmarkId) {
        // 북마크 삭제
        console.log('🗑️ 북마크 삭제 시도, bookmarkId:', bookmarkId);
        const success = await removeBookmark(bookmarkId);
        if (success) {
          setIsBookmarked(false);
          setBookmarkId(null);
          console.log('✅ 북마크가 삭제되었습니다.');
        } else {
          console.error('❌ 북마크 삭제 실패');
        }
      } else {
        // 북마크 추가
        console.log('📌 북마크 추가 시도, newsId:', id);
        const success = await addBookmark(id, article.title, article.category || 'general');
      if (success) {
          setIsBookmarked(true);
          // 북마크 상태 재확인해서 실제 bookmarkId 가져오기
          const checkResult = await checkBookmark(id);
          if (checkResult.bookmark?.bookmarkId) {
            setBookmarkId(checkResult.bookmark.bookmarkId);
          }
          console.log('✅ 북마크가 추가되었습니다.');
      } else {
          console.error('❌ 북마크 추가 실패');
        }
      }
    } catch (error) {
      console.error('❌ 북마크 토글 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">📰 기사를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-lg text-gray-600 mb-4">기사를 찾을 수 없습니다.</div>
              <Link href="/" className="text-[#e53e3e] hover:underline">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 py-6">
      <div className="container mx-auto px-4">
        {/* 상단 뉴스 카테고리 네비게이션 */}
        <div className="mb-6 flex items-center text-sm text-gray-500">
          <Link href="/" className="hover:text-[#e53e3e] transition-colors font-medium">🏠 홈</Link>
          <span className="mx-2 text-gray-300">→</span>
          <span className="text-gray-700 font-medium">📰 뉴스 상세</span>
        </div>

        <div className="flex gap-8">
          {/* 메인 콘텐츠 영역 */}
          <div className="flex-1">
            {/* 뉴스 헤더 정보 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
              <div className="relative">
                {/* 헤더 배경 그라데이션 */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-700 via-slate-600 to-blue-700 opacity-95"></div>
                <div className="relative flex p-8 text-white">
                <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mr-4 border border-white/30">
                        🔥 HOT NEWS
                      </span>
                      <span className="text-white/90 font-medium">{article.source}</span>
                  </div>
                    <h1 className="text-4xl font-bold leading-tight mb-6 text-white drop-shadow-lg">{article.title}</h1>
                    
                    <div className="flex items-center text-white/90 mb-6 space-x-6">
                      <span className="flex items-center">
                        <span className="mr-2">📅</span>
                        {new Date(article.pubDate).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-2">👀</span>
                        {Math.floor(Math.random() * 5000) + 1000}
                      </span>
                      <span className="flex items-center">
                        <span className="mr-2">❤️</span>
                        {Math.floor(Math.random() * 100) + 50}%
                      </span>
                      <span className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        {readTime > 0 ? `${Math.floor(readTime / 60)}분 ${readTime % 60}초 읽음` : '읽기 시작...'}
                      </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <span className="text-lg mr-2">👁️</span>
                        <span className="text-sm font-medium">조회 {Math.floor(Math.random() * 5000) + 1000}</span>
                    </div>
                    
                    {/* 북마크 버튼 */}
                    <button
                      onClick={toggleBookmark}
                      className={`flex items-center backdrop-blur-sm rounded-full px-4 py-2 transition-all duration-300 ${
                        isBookmarked 
                          ? 'bg-red-500/90 text-white border border-red-400' 
                          : 'bg-white/10 text-white border border-white/30 hover:bg-white/20'
                      }`}
                    >
                      <span className="text-lg mr-2">
                        {isBookmarked ? '🔖' : '📌'}
                      </span>
                      <span className="text-sm font-medium">
                        {isBookmarked ? '북마크됨' : '북마크'}
                      </span>
                    </button>
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <span className="text-lg mr-2">🔄</span>
                        <span className="text-sm font-medium">공유 {Math.floor(Math.random() * 100) + 10}k</span>
                    </div>
                  </div>
                </div>
                
                {/* 대표 이미지 */}
                  <div className="ml-8 w-72 h-72 bg-white/10 backdrop-blur-sm flex items-center justify-center rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                    {article.imageUrl ? (
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-4xl font-bold text-white">📰</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 뉴스 액션 버튼 */}
              <div className="flex p-6 bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100">
                <button className="flex items-center justify-center bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-full mr-3 hover:border-gray-400 hover:text-gray-800 hover:shadow-md transform hover:scale-105 transition-all duration-200 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  공유하기
                </button>
                <a 
                  href={article.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  원문 보기
                </a>
              </div>
            </div>
            
            {/* AI 스마트 분석 - 뉴스 깊이 읽기 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
              <div className="relative p-8">
                {/* 배경 패턴 */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 opacity-60"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full opacity-30 transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-30 transform -translate-x-12 translate-y-12"></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                      <span className="text-3xl mr-3">🧠</span>
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">AI 뉴스 깊이 분석</span>
                    </h2>
                    <div className="flex space-x-2">
                      <button
                        onClick={generateAISummary}
                        disabled={summaryLoading}
                        className="flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {summaryLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            분석 중...
                          </>
                        ) : (
                          <>
                            <span className="mr-2">🔍</span>
                            {aiSummary.length > 0 ? '재분석' : '깊이 분석'}
                          </>
                        )}
                      </button>
                      
                      {aiSummary.length > 0 && (
                        <button
                          onClick={() => {
                            setAiSummary([]);
                            // 로컬 스토리지에서 요약 제거
                            const savedArticles = JSON.parse(localStorage.getItem('newsArticles') || '[]');
                            const updatedArticles = savedArticles.map((savedArticle: RSSArticle) => {
                              if (savedArticle.id === article?.id) {
                                return {
                                  ...savedArticle,
                                  aiSummary: undefined,
                                  summaryGenerated: false
                                };
                              }
                              return savedArticle;
                            });
                            localStorage.setItem('newsArticles', JSON.stringify(updatedArticles));
                          }}
                          className="flex items-center bg-gray-500 text-white px-3 py-2 rounded-full hover:bg-gray-600 transition-all duration-200 font-medium"
                        >
                          <span className="mr-1">🗑️</span>
                          초기화
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {aiSummary.length > 0 ? (
                    <div className="bg-gradient-to-br from-blue-50 via-white to-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm">
                      {/* 요약 내용 */}
                      <div className="space-y-6">
                        {aiSummary.map((summary, index) => (
                          <p key={index} className="text-gray-800 leading-relaxed text-lg">
                            {summary}
                          </p>
                        ))}
                      </div>
                      
                      {/* 하단 메타 정보 */}
                      <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            AI 요약
                          </span>
                          <span>•</span>
                          <span>{article.source}</span>
                        </div>
                        <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          자동 생성됨
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="text-5xl mb-4">📝</div>
                      <h3 className="text-xl font-bold text-gray-700 mb-3">AI 요약 생성하기</h3>
                      <p className="text-gray-600 mb-6">기사의 핵심 내용을 간단하게 요약해드립니다</p>
                      <p className="text-sm text-gray-500">위의 '깊이 분석' 버튼을 클릭해보세요!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 뉴스 본문 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="text-3xl mr-3">📖</span>
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">기사 내용</span>
                </h2>
                <div className="prose max-w-none">
                  {contentLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-[#e53e3e]"></div>
                        <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
                      </div>
                      <span className="ml-4 text-gray-600 text-lg font-medium">기사 내용을 불러오는 중...</span>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {fullContent ? (
                        <div className="space-y-6">
                          {(() => {
                            // 렌더링 시점에서 JSON 파싱 적용
                            const processedContent = fullContent.includes('"type":"text"') && fullContent.includes('"content"') 
                              ? parseRSSDescription(fullContent) 
                              : fullContent;
                            
                            // 불필요한 내용 필터링
                            const cleanedContent = processedContent
                              .split('\n')
                              .filter(line => {
                                const trimmed = line.trim();
                                return trimmed && 
                                       trimmed.length > 15 && 
                                       !trimmed.match(/^[\d\s\-:]+$/) &&
                                       !trimmed.match(/^[▲◆※]+/) &&
                                       !trimmed.includes('저작권') &&
                                       !trimmed.includes('무단전재') &&
                                       !trimmed.includes('재배포 금지') &&
                                       !trimmed.includes('Copyright') &&
                                       !trimmed.match(/^\d{4}-\d{2}-\d{2}/) &&
                                       !trimmed.match(/^\d{1,2}:\d{2}/);
                              })
                              .join('\n\n');
                            
                            // 하나의 연속된 텍스트로 표시
                            return (
                              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                                <div className="text-gray-800 leading-8 text-lg font-normal whitespace-pre-line">
                                  {cleanedContent}
                                </div>
                              </div>
                            );
                          })()}
                          
                          {/* RSS 설명이 포함된 경우 추가 정보 표시 */}
                          {fullContent.includes('RSS 피드') && (
                            <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-l-4 border-green-500 shadow-sm">
                              <div className="flex items-start space-x-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                  <h4 className="font-bold text-green-800 text-lg mb-2">알아두세요!</h4>
                                  <p className="text-green-700 leading-relaxed">
                                    이 기사는 RSS 피드를 통해 제공된 요약 정보입니다. 
                                    더 자세한 내용과 이미지, 동영상 등은 상단의 "원문 보기" 버튼을 통해 확인하실 수 있습니다.
                                  </p>
                                  <p className="text-green-600 text-sm mt-2 font-medium">
                                    ✨ AI 스마트 요약 기능으로 핵심 내용을 빠르게 파악해보세요!
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* 기사가 짧은 경우 안내 */}
                          {fullContent.length < 500 && !fullContent.includes('RSS 피드') && (
                            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border-l-4 border-amber-500 shadow-sm">
                              <div className="flex items-start space-x-3">
                                <span className="text-2xl">📝</span>
                                <div>
                                  <h4 className="font-bold text-amber-800 text-lg mb-2">더 많은 내용이 있어요!</h4>
                                  <p className="text-amber-700 leading-relaxed">
                                    이 기사의 전체 내용을 확인하려면 "원문 보기"를 클릭해 주세요. 
                                    더 자세한 정보와 관련 이미지를 볼 수 있습니다.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-16">
                          <div className="text-6xl mb-6">📰</div>
                          <h3 className="text-2xl font-bold text-gray-700 mb-4">기사 내용을 준비 중입니다</h3>
                          <p className="text-lg text-gray-600 mb-6">잠시만 기다려주세요...</p>
                          <div className="inline-flex items-center space-x-2 text-gray-500">
                            <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full"></div>
                            <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full" style={{animationDelay: '0.2s'}}></div>
                            <div className="animate-pulse w-2 h-2 bg-gray-400 rounded-full" style={{animationDelay: '0.4s'}}></div>
                          </div>
                        </div>
                      )}
                </div>
                  )}
                
                  <div className="mt-10 p-6 bg-gradient-to-r from-blue-50 to-slate-50 rounded-2xl border-l-4 border-blue-500 shadow-sm">
                    <p className="text-blue-800 text-lg font-medium">
                      <strong className="text-xl">📰 더 자세한 내용은</strong> 위의 "원문 보기" 버튼을 클릭하여 원본 뉴스 사이트에서 확인하실 수 있습니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 댓글 섹션 */}
            <CommentSection newsId={id} />
            
            {/* 기사 정보 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
              <div className="p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">기사 정보</span>
                </h3>
                <div className="flex items-start space-x-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-[#e53e3e] to-red-500 mr-4 flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">📰</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-xl">{article.source}</h4>
                    <p className="text-gray-500 mt-2 font-medium">신뢰할 수 있는 뉴스 제공처</p>
                    <p className="text-gray-700 mt-4 font-medium flex items-center">
                      <span className="mr-2 text-lg">📅</span>
                      {new Date(article.pubDate).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 우측 사이드바 */}
          <Sidebar />
        </div>
      </div>
    </div>
  );
} 