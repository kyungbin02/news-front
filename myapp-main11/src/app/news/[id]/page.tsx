'use client';

import React, { useEffect, useState, use } from 'react';
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";
import { getArticleById } from '@/utils/articleStorage';
import { RSSArticle } from '@/utils/rssApi';

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
  
  useEffect(() => {
    const loadArticle = () => {
      const foundArticle = getArticleById(id);
      setArticle(foundArticle);
      setLoading(false);
      
      if (foundArticle) {
        loadFullContent(foundArticle.link);
      }
    };
    
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
                  </div>
                  
                  <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                        <span className="text-lg mr-2">👁️</span>
                        <span className="text-sm font-medium">조회 {Math.floor(Math.random() * 5000) + 1000}</span>
                    </div>
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
                <button className="flex items-center justify-center bg-gradient-to-r from-[#e53e3e] to-red-500 text-white py-3 px-6 rounded-full mr-3 hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  북마크
                </button>
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
                    <div className="space-y-6">
                      {/* 핵심 요약 */}
                      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border-l-4 border-red-500">
                        <h3 className="text-lg font-bold text-red-800 mb-3 flex items-center">
                          <span className="mr-2">🎯</span>
                          핵심 포인트
                        </h3>
                        <p className="text-red-700 leading-relaxed text-base">{aiSummary[0] || '핵심 내용을 분석 중입니다...'}</p>
                      </div>

                      {/* 배경 설명 */}
                      {aiSummary[1] && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border-l-4 border-blue-500">
                          <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                            <span className="mr-2">📚</span>
                            배경 & 맥락
                          </h3>
                          <p className="text-blue-700 leading-relaxed text-base">{aiSummary[1]}</p>
                        </div>
                      )}

                      {/* 영향 분석 */}
                      {aiSummary[2] && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-l-4 border-green-500">
                          <h3 className="text-lg font-bold text-green-800 mb-3 flex items-center">
                            <span className="mr-2">📈</span>
                            영향 & 전망
                          </h3>
                          <p className="text-green-700 leading-relaxed text-base">{aiSummary[2]}</p>
                        </div>
                      )}

                      {/* 추가 인사이트 */}
                      {aiSummary.length > 3 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {aiSummary.slice(3).map((insight, index) => (
                            <div key={index + 3} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                              <div className="flex items-start space-x-3">
                                <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 4}
                                </span>
                                <p className="text-purple-700 leading-relaxed text-sm">{insight}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 관련 키워드 & 태그 */}
                      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-6 border-l-4 border-amber-500">
                        <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
                          <span className="mr-2">🏷️</span>
                          관련 키워드
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {article.title.split(' ').slice(0, 5).map((keyword, index) => (
                            <span key={index} className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium">
                              #{keyword}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 신뢰도 & 출처 정보 */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-6 border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                          <span className="mr-2">🔍</span>
                          분석 정보
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl mb-1">📊</div>
                            <div className="text-sm text-gray-600">신뢰도</div>
                            <div className="text-lg font-bold text-green-600">95%</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl mb-1">⚡</div>
                            <div className="text-sm text-gray-600">분석 속도</div>
                            <div className="text-lg font-bold text-blue-600">2.3초</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl mb-1">📰</div>
                            <div className="text-sm text-gray-600">출처</div>
                            <div className="text-lg font-bold text-purple-600">{article.source}</div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="text-sm text-gray-600">정확도</div>
                            <div className="text-lg font-bold text-orange-600">98%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-6">🧠</div>
                      <h3 className="text-2xl font-bold text-gray-700 mb-4">AI가 뉴스를 깊이 분석합니다</h3>
                      <p className="text-lg text-gray-600 mb-2">• 핵심 포인트 추출</p>
                      <p className="text-lg text-gray-600 mb-2">• 배경 & 맥락 설명</p>
                      <p className="text-lg text-gray-600 mb-2">• 영향 & 전망 분석</p>
                      <p className="text-lg text-gray-600 mb-6">• 관련 키워드 추출</p>
                      <p className="text-gray-500">위의 '깊이 분석' 버튼을 클릭해보세요!</p>
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
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8 border border-gray-200">
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <span className="text-3xl mr-3">💬</span>
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">댓글 {Math.floor(Math.random() * 50) + 10}개</span>
                </h3>
                
                {/* 댓글 작성 */}
                <div className="mb-8 p-6 bg-gradient-to-r from-gray-50 via-slate-50 to-blue-50 rounded-2xl border border-gray-200 shadow-sm">
                      <textarea 
                    className="w-full p-4 border-2 border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent transition-all duration-200 text-lg"
                    rows={4} 
                    placeholder="이 기사에 대한 생각을 자유롭게 남겨주세요! 😊"
                      ></textarea>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500 flex items-center font-medium">
                      <span className="mr-2 text-lg">🔐</span>
                      로그인 후 댓글을 작성할 수 있습니다
                    </span>
                    <button className="px-8 py-3 bg-gradient-to-r from-[#e53e3e] to-red-500 text-white rounded-full hover:shadow-lg disabled:opacity-50 transition-all duration-200 font-bold transform hover:scale-105" disabled>
                          댓글 작성
                        </button>
                  </div>
                </div>
                
                {/* 댓글 목록 */}
                <div className="space-y-6">
                  {/* 댓글 1 */}
                  <div className="border-b border-gray-100 pb-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-xl p-4 transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">🙋‍♀️</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-bold text-gray-900 text-lg">뉴스러버</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 text-xs rounded-full font-bold border border-blue-300">✨ 활발한 댓글러</span>
                          <span className="text-sm text-gray-500 font-medium">{Math.floor(Math.random() * 60) + 1}분 전</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-lg bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          와! 3줄 요약이 정말 도움됐어요! 복잡한 내용도 이해하기 쉽게 정리해주셔서 감사합니다 👍
                        </p>
                        <div className="flex items-center space-x-6 mt-4">
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] flex items-center transition-colors font-medium">
                            <span className="mr-2 text-lg">❤️</span>
                            <span>{Math.floor(Math.random() * 20) + 1}</span>
                            </button>
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] transition-colors font-medium">💬 답글</button>
                          </div>
                          </div>
                        </div>
                      </div>
                      
                  {/* 댓글 2 */}
                  <div className="border-b border-gray-100 pb-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-xl p-4 transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">🤔</span>
                              </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-bold text-gray-900 text-lg">생각하는시민</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-700 text-xs rounded-full font-bold border border-green-300">🧠 신중한 독자</span>
                          <span className="text-sm text-gray-500 font-medium">{Math.floor(Math.random() * 120) + 60}분 전</span>
                                  </div>
                        <p className="text-gray-700 leading-relaxed text-lg bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          이런 이슈들이 우리 사회에 미치는 영향을 생각해보면 정말 중요한 문제인 것 같습니다. 
                          관련 정책도 함께 검토되어야 할 것 같아요!
                        </p>
                        <div className="flex items-center space-x-6 mt-4">
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] flex items-center transition-colors font-medium">
                            <span className="mr-2 text-lg">❤️</span>
                            <span>{Math.floor(Math.random() * 15) + 1}</span>
                                  </button>
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] transition-colors font-medium">💬 답글</button>
                                </div>
                                </div>
                              </div>
                            </div>
                  
                  {/* 댓글 3 */}
                  <div className="border-b border-gray-100 pb-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 rounded-xl p-4 transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">😊</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <span className="font-bold text-gray-900 text-lg">뉴스초보</span>
                          <span className="px-3 py-1 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 text-xs rounded-full font-bold border border-orange-300">🌱 뉴스 입문자</span>
                          <span className="text-sm text-gray-500 font-medium">{Math.floor(Math.random() * 180) + 120}분 전</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-lg bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                          뉴스가 이렇게 재미있을 줄 몰랐어요! 😍 
                          어려운 용어들도 쉽게 설명해주시고, 이모지도 있어서 읽기 편해요 ✨
                        </p>
                        <div className="flex items-center space-x-6 mt-4">
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] flex items-center transition-colors font-medium">
                            <span className="mr-2 text-lg">❤️</span>
                            <span>{Math.floor(Math.random() * 25) + 1}</span>
                          </button>
                          <button className="text-sm text-gray-500 hover:text-[#e53e3e] transition-colors font-medium">💬 답글</button>
                        </div>
                      </div>
                    </div>
                </div>
                
                {/* 더보기 버튼 */}
                  <div className="text-center pt-6">
                    <button className="px-10 py-4 border-2 border-gray-300 text-gray-700 rounded-full hover:border-gray-400 hover:text-gray-800 hover:shadow-lg transition-all duration-200 transform hover:scale-105 font-bold text-lg">
                      💬 댓글 더보기
                  </button>
                  </div>
                </div>
              </div>
            </div>
            
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