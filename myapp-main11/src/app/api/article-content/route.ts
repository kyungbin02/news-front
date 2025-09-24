import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// 캐시 시스템
const contentCache = new Map<string, { content: string, timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30분 캐시

// 언론사별 본문 선택자 설정 (확장)
const CONTENT_SELECTORS = {
  // 주요 일간지
  'donga.com': [
    '.article_txt .article_body_contents', // 가장 정확한 본문 영역
    '.article_txt', 
    '.news_view', 
    '#article_contents', 
    '.article-body', 
    '.article-text', 
    '.article_body_contents'
  ],
  'chosun.com': [
    '.par', '.article-body', '.news-article-body', '#news_body_id', '.article_txt', '.news-article__body',
    '.article_body_contents', '.news_body_area', '.article-content', '.news-content', 
    '.story-body', '.content-body', '.main-content', '#articleText', '.article-text',
    '.news-article-content', '.article-wrap', '.content-wrap', '.text-content'
  ],
  'joongang.co.kr': [
    '.article_body', '#article_body', '.news_body', '.article-content'
  ],
  'hani.co.kr': [
    '.article-text', '.text', '#article-contents', '.article_text'
  ],
  
  // 방송사
  'sbs.co.kr': [
    '.text_area', // SBS 주요 본문 영역
    '.article_cont', 
    '#container .text_area', 
    '.article-body',
    '.news_content',
    '.article_content',
    '.view_content',
    '.content_body',
    '.news_body'
  ],
  'kbs.co.kr': [
    '.detail-body', '.news-content', '.article-body', '#cont_newstext'
  ],
  'mbc.co.kr': [
    '.news-content', '.article-body', '.detail_content', '#content'
  ],
  'jtbc.joins.com': [
    '.article_content', '.news_content', '.article-body'
  ],
  
  // 통신사
  'yna.co.kr': [
    '.story-news .txt', // 가장 정확한 연합뉴스 본문
    '.story-news', 
    '.article-txt', 
    '#articleWrap .txt', 
    '.article-body', 
    '.news01',
    '.article_body',
    '.news_body',
    '.content_body',
    '.view_content',
    '.article_content'
  ],
  'newsis.com': [
    '.news_content', '.article_body', '.article-body', '#textBody'
  ],
  
  // IT/경제 전문지
  'zdnet.co.kr': [
    '.article_body', '.news_body', '.article-content', '#news_body'
  ],
  'etnews.com': [
    '.article_txt', '.news_body', '.article-content'
  ],
  'mk.co.kr': [
    '.news_cnt_detail_wrap', '.news_cnt', '.article-body'
  ],
  'hankyung.com': [
    '.article-body', '.news-content', '.txt_area'
  ],
  'edaily.co.kr': [
    '.news_body', '.article_body', '.article-content'
  ],
  
  // 인터넷 언론
  'ohmynews.com': [
    '.at_contents', '.article_body', '.article-content'
  ],
  'pressian.com': [
    '.article-body', '.news-content', '#article-view-content-div'
  ],
  'mediatoday.co.kr': [
    '.news-content', '.article-body', '.view_content'
  ],
  
  // 스포츠
  'sports.donga.com': [
    '.article_txt', '.news_view', '.article-body'
  ],
  'sports.chosun.com': [
    '.par', '.article-body', '.news-article-body'
  ],
  
  // 해외 언론 (RSS 피드 제공시)
  'cnn.com': [
    '.zn-body__paragraph', '.el__article__body', '[data-component-name="ArticleBody"]'
  ],
  'bbc.com': [
    '[data-component="text-block"]', '.ssrcss-1q0x1qg-Paragraph', '.story-body__inner'
  ],
  'reuters.com': [
    '[data-testid="paragraph"]', '.ArticleBodyWrapper', '.StandardArticleBody_body'
  ],
  
  // 기본 선택자 (우선순위 순) - 대폭 확장
  'default': [
    // 시맨틱 태그
    'article',
    'main article',
    '[role="main"] article',
    'main',
    
    // 일반적인 기사 클래스
    '.article-content',
    '.article-body', 
    '.article_body',
    '.article_txt',
    '.article-text',
    '.article_content',
    '.news-content',
    '.news_content',
    '.news-body',
    '.news_body',
    '.news-text',
    '.news_text',
    '.story-body',
    '.story_body',
    '.content',
    '.post-content',
    '.entry-content',
    '.main-content',
    '.main_content',
    
    // 상세 본문 영역
    '.detail-content',
    '.detail_content',
    '.view-content',
    '.view_content',
    '.article-detail',
    '.article_detail',
    '.news-detail',
    '.news_detail',
    
    // ID 기반 선택자
    '#article-content',
    '#article_content',
    '#news-content',
    '#news_content',
    '#content',
    '#main-content',
    '#main_content',
    '#article',
    '#news',
    '#story',
    
    // 텍스트 영역
    '.text_area',
    '.txt_area',
    '.text-area',
    '.main-text',
    '.main_text',
    '.body-text',
    '.body_text',
    
    // 추가 패턴들
    '.par',
    '.paragraph',
    '.paragraphs',
    '.article-wrap',
    '.article_wrap',
    '.news-wrap',
    '.news_wrap',
    '.content-wrap',
    '.content_wrap',
    
    // 더 일반적인 패턴
    '[class*="article"]',
    '[class*="content"]',
    '[class*="news"]',
    '[class*="text"]',
    '[id*="article"]',
    '[id*="content"]',
    '[id*="news"]'
  ]
};

// HTML 태그 제거 및 텍스트 정리
function cleanText(text: string): string {
  return text
    // 연속된 공백을 하나로
    .replace(/\s+/g, ' ')
    // 연속된 줄바꿈을 두 개로 (문단 구분)
    .replace(/\n\s*\n\s*/g, '\n\n')
    // 앞뒤 공백 제거
    .trim();
}

// 텍스트 유사도 계산 (간단한 Jaccard 유사도)
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

// 불필요한 텍스트 패턴 제거 - 대폭 강화
function removeUnwantedText(text: string): string {
  // 제거할 패턴들
  const unwantedPatterns = [
    // 기자 정보
    /\[.*?기자\]/g,
    /\[.*?특파원\]/g,
    /\[.*?@.*?\]/g,
    /\(.*?=.*?뉴스\)/g,
    /\(.*?=.*?\)/g,
    
    // 기호 및 장식
    /▲.*?▲/g,
    /◆.*?◆/g,
    /※.*?※/g,
    /★.*?★/g,
    /●.*?●/g,
    
    // 미디어 관련
    /\(사진.*?\)/g,
    /\(영상.*?\)/g,
    /\(그래픽.*?\)/g,
    /\(자료.*?\)/g,
    /\(이미지.*?\)/g,
    
    // 저작권 및 법적 고지
    /저작권자.*?무단.*?금지/gi,
    /무단전재.*?재배포.*?금지/gi,
    /무단\s*전재.*?금지/gi,
    /AI\s*학습.*?금지/gi,
    /Copyright.*?All rights reserved/gi,
    /©.*?All rights reserved/gi,
    /dongA\.com.*?금지/gi,
    
    // 날짜 및 시간
    /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g,
    /\d{1,2}:\d{2}/g,
    /기사입력.*?\d{4}-\d{2}-\d{2}/g,
    /최종수정.*?\d{4}-\d{2}-\d{2}/g,
    /송고.*?\d{4}-\d{2}-\d{2}/g,
    /입력.*?\d{4}-\d{2}-\d{2}/g,
    
    // 소셜 미디어 및 공유
    /관련기사/g,
    /이 기사를.*?공유하기/g,
    /페이스북.*?트위터.*?카카오/g,
    /카카오톡으로\s*공유하기/g,
    /페이스북으로\s*공유하기/g,
    /트위터로\s*공유하기/g,
    /공유하기/g,
    
    // 통계 및 상호작용
    /좋아요\s*\d+/g,
    /조회수\s*\d+/g,
    /댓글\s*\d+/g,
    /추천\s*\d+/g,
    
    // 동아일보 특화 패턴
    /추천\s*검색어는.*?선정하였습니다\./g,
    /학교미국BMW.*?조국/g, // 추천 검색어 키워드 덩어리
    /주소\s*서울특별시.*?\d{2}-\d{4}-\d{4}/g,
    /전화번호\s*\d{2}-\d{4}-\d{4}/g,
    /청소년보호정책.*?\)/g,
    /방문하고자.*?선택하세요\./g,
    
    // iframe 및 임베드
    /<iframe.*?<\/iframe>/gi,
    /iframe.*?width.*?height/gi,
    
    // 네비게이션 및 메뉴
    /메뉴/g,
    /홈으로/g,
    /로그인/g,
    /회원가입/g,
    /구독/g,
    /광고/g,
    
    // 연합뉴스 특화 패턴 - 대폭 강화
    /다양한\s*채널에서.*?만나보세요!/g,
    /연합뉴스.*?만나보세요!/g,
    /\(서울=연합뉴스\).*?=/g,
    /송고\s*\d{4}-\d{2}-\d{2}\s*\d{2}:\d{2}/g,
    /송고\s*\d{4}년\d{2}월\d{2}일\s*\d{2}시\d{2}분/g,
    /무단\s*전재-재배포.*?금지>/g,
    /AI\s*학습\s*및\s*활용\s*금지>/g,
    /회원이\s*되시면.*?특별해집니다\./g,
    /인공지능이\s*자동으로.*?읽어야\s*합니다\./g,
    /에디터스\s*픽.*?Editor's\s*Picks/g,
    /\[AP\s*연합뉴스.*?금지\]/g,
    /\[.*?연합뉴스.*?금지\]/g,
    /연합뉴스\s*:\s*서울시.*?\d{2}-\d{3}-\d{4}/g,
    /등록번호.*?문화.*?나\d+/g,
    /등록일자.*?\d{4}\.\d{2}\.\d{2}/g,
    /발행일자.*?\d{4}\.\d{2}\.\d{2}/g,
    /사업자번호.*?\d{3}-\d{2}-\d{5}/g,
    /통신판매업신고번호.*?\d{4}-.*?\d{4}/g,
    /청소년보호정책.*?이충원\)/g,
    /©\d{4}\s*Yonhapnews\s*Agency/g,
    
    // SBS 특화 패턴 추가
    /당신의\s*지적\s*탐험과.*?프리미엄\s*콘텐츠/g,
    /레이어\s*닫기/g,
    /SBS\s*Prism\s*Tower\s*아트컬렉션/g,
    /기사\s*관련문의\s*:\s*\d{2}-\d{4}-\d{4}/g,
    /뉴스\s*기사제보\s*:\s*\d{2}-\d{4}-\d{4}/g,
    /Email\s*:\s*[\w@.]+/g,
    /서울특별시\s*양천구\s*목동서로\s*\d+/g,
    /고객센터\s*:\s*\d{4}-\d{4}/g,
    /등록번호\s*:\s*서울\s*자\d+/g,
    /등록일자\s*:\s*\d{4}-\d{2}-\d{2}/g,
    /기사배열책임자.*?정인영/g,
    /청소년보호책임자.*?정인영/g,
    /\(취재.*?\)/g,
    /\(영상편집.*?\)/g,
    /\(디자인.*?\)/g,
    /\(제작.*?\)/g,
    
    // 기타 불필요한 패턴
    /더보기/g,
    /펼치기/g,
    /접기/g,
    /이전/g,
    /다음/g,
    /목록/g,
    /프린트/g,
    /스크랩/g,
    
    // 빈 괄호나 대괄호
    /\(\s*\)/g,
    /\[\s*\]/g,
    
    // 연속된 특수문자
    /[.]{3,}/g,
    /[-]{3,}/g,
    /[=]{3,}/g
  ];

  let cleanedText = text;
  unwantedPatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });

  // 중복 문단 제거 (연합뉴스 특화)
  const paragraphs = cleanedText.split(/\n\s*\n/);
  const uniqueParagraphs: string[] = [];
  
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length < 20) continue;
    
    // 이미 있는 문단과 80% 이상 유사하면 제외
    const isDuplicate = uniqueParagraphs.some(existing => {
      const similarity = calculateSimilarity(trimmed, existing);
      return similarity > 0.8;
    });
    
    if (!isDuplicate) {
      uniqueParagraphs.push(trimmed);
    }
  }

  // 연속된 공백 정리
  cleanedText = uniqueParagraphs.join('\n\n')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*/g, '\n\n')
    .trim();

  return cleanedText;
}

// 불필요한 요소 제거 - 대폭 강화
function removeUnwantedElements($: cheerio.CheerioAPI, container: cheerio.Cheerio<any>) {
  // 광고, 관련기사, 댓글 등 제거
  container.find(`
    script, style, iframe, noscript, object, embed,
    .ad, .advertisement, .banner, .ads, .google-ad,
    .related, .relation, .recommend, .recommendation,
    .comment, .reply, .comments, .replies,
    .social, .share, .sns, .sharing, .share-button,
    .tag, .category, .label, .tags, .categories,
    .author-info, .reporter, .journalist, .byline,
    .article-info, .article-meta, .news-info, .meta,
    .breadcrumb, .navigation, .nav, .menu,
    .footer, .header, nav, aside, .sidebar,
    .copyright, .source, .credit,
    .date, .time, .timestamp, .published,
    .view-count, .like-count, .hit-count,
    .photo-info, .caption, .image-caption,
    .more-news, .related-news, .other-news,
    .search, .search-box, .search-form,
    .login, .signup, .subscribe, .newsletter,
    .popup, .modal, .overlay, .tooltip,
    .print, .email, .bookmark, .favorite,
    .weather, .stock, .exchange-rate,
    .poll, .survey, .quiz, .vote,
    .video-player, .audio-player, .media-player,
    .live-chat, .chatbot, .messenger,
    .promotion, .event, .contest, .giveaway,
    .download, .app-download, .mobile-app,
    .cookie-notice, .privacy-notice, .gdpr,
    .back-to-top, .scroll-to-top, .top-button,
    .pagination, .page-nav, .paging,
    .loading, .spinner, .progress,
    .error, .warning, .alert, .notice,
    .hidden, .invisible, .sr-only, .screen-reader,
    [style*="display: none"], [style*="visibility: hidden"],
    [class*="hide"], [class*="hidden"], [id*="hide"], [id*="hidden"],
    [class*="ad-"], [class*="ads-"], [id*="ad-"], [id*="ads-"],
    [class*="banner"], [id*="banner"],
    [class*="popup"], [id*="popup"],
    [class*="modal"], [id*="modal"],
    [class*="overlay"], [id*="overlay"]
  `).remove();
  
  // 동아일보 특화 제거
  container.find(`
    .recommend_keyword, .keyword_area, .search_keyword,
    .share_area, .share_btn, .sns_share,
    .company_info, .contact_info, .address_info,
    .copyright_area, .footer_info,
    .related_article, .more_article,
    .journalist_info, .reporter_info,
    .article_tool, .article_util,
    .photo_area, .image_area, .media_area,
    .ad_area, .banner_area, .promotion_area
  `).remove();
  
  // 연합뉴스 특화 제거 - 대폭 강화
  container.find(`
    .channel_area, .sns_area, .share_area,
    .editor_pick, .related_news, .more_news,
    .copyright_info, .agency_info,
    .photo_caption, .video_caption,
    .live_area, .breaking_area,
    .weather_area, .stock_area,
    .footer, .footer_area, .footer_info,
    .header, .header_area, .header_info,
    .nav, .navigation, .gnb, .lnb,
    .ad_area, .banner_area, .promotion_area,
    .social_area, .share_btn_area, .sns_btn_area,
    .related_article_area, .more_article_area,
    .journalist_area, .reporter_area, .byline_area,
    .date_area, .time_area, .timestamp_area,
    .tag_area, .category_area, .section_area,
    .comment_area, .reply_area, .feedback_area,
    .search_area, .search_box, .search_form,
    .login_area, .member_area, .user_area,
    .popup_area, .modal_area, .overlay_area,
    .print_area, .email_area, .bookmark_area,
    .weather_widget, .stock_widget, .exchange_widget,
    .live_chat, .chatbot, .messenger_area,
    .download_area, .app_area, .mobile_area,
    .cookie_area, .privacy_area, .gdpr_area,
    .back_to_top, .scroll_top, .top_btn,
    .pagination_area, .paging_area, .page_nav,
    .loading_area, .spinner_area, .progress_area,
    .error_area, .warning_area, .alert_area,
    .hidden_area, .invisible_area, .sr_only
  `).remove();
  
  // SBS 특화 제거 - 신규 추가
  container.find(`
    .premium_area, .subscription_area, .layer_area,
    .art_collection, .prism_tower, .contact_info,
    .customer_center, .registration_info, .responsibility_info,
    .premium_content, .premium_layer, .premium_banner,
    .layer_close, .layer_popup, .layer_content,
    .sbs_footer, .sbs_header, .sbs_nav,
    .contact_area, .customer_area, .service_area,
    .registration_area, .license_area, .copyright_sbs,
    .responsibility_area, .manager_area, .editor_area
  `).remove();
}

// 도메인별 선택자 가져오기
function getContentSelectors(url: string): string[] {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    
    // 도메인별 특화 선택자가 있으면 사용
    for (const [key, selectors] of Object.entries(CONTENT_SELECTORS)) {
      if (key !== 'default' && domain.includes(key)) {
        return [...selectors, ...CONTENT_SELECTORS.default];
      }
    }
    
    return CONTENT_SELECTORS.default;
  } catch (error) {
    return CONTENT_SELECTORS.default;
  }
}

// 본문 내용 추출 및 정리 (강화된 버전)
function extractContent($: cheerio.CheerioAPI, selectors: string[]): string {
  let bestContent = '';
  let maxScore = 0;
  
  for (const selector of selectors) {
    const elements = $(selector);
    
    elements.each((_, element) => {
      const $element = $(element);
      
      // 불필요한 요소 제거
      removeUnwantedElements($, $element);
      
      // 문단별로 텍스트 추출
      const paragraphs: string[] = [];
      
      // 1. p 태그에서 추출 (더 엄격한 필터링)
      $element.find('p').each((_, el) => {
        const text = $(el).text().trim();
        if (text && 
            text.length > 20 && 
            text.length < 1000 && // 너무 긴 텍스트 제외
            !text.includes('광고') && 
            !text.includes('로그인') &&
            !text.includes('공유하기') &&
            !text.includes('추천 검색어') &&
            !text.includes('주소') &&
            !text.includes('전화번호') &&
            !text.includes('카카오톡') &&
            !text.includes('페이스북') &&
            !text.includes('트위터') &&
            !text.includes('dongA.com') &&
            !text.includes('연합뉴스를 만나보세요') &&
            !text.includes('다양한 채널에서') &&
            !text.includes('에디터스 픽') &&
            !text.includes('Editor\'s Picks') &&
            !text.includes('송고') &&
            !text.includes('무단 전재') &&
            !text.includes('재배포 금지') &&
            !text.includes('AI 학습') &&
            !text.includes('활용 금지') &&
            !text.includes('회원이 되시면') &&
            !text.includes('특별해집니다') &&
            !text.includes('인공지능이 자동으로') &&
            !text.includes('기사 본문과 함께') &&
            !text.includes('등록번호') &&
            !text.includes('사업자번호') &&
            !text.includes('청소년보호정책') &&
            !text.includes('Yonhapnews Agency') &&
            !text.includes('당신의 지적 탐험과') &&
            !text.includes('프리미엄 콘텐츠') &&
            !text.includes('레이어 닫기') &&
            !text.includes('SBS Prism Tower') &&
            !text.includes('아트컬렉션') &&
            !text.includes('기사 관련문의') &&
            !text.includes('뉴스 기사제보') &&
            !text.includes('고객센터') &&
            !text.includes('기사배열책임자') &&
            !text.includes('청소년보호책임자') &&
            !text.includes('정인영') &&
            !text.includes('양천구 목동서로') &&
            !text.includes('sbs8news@sbs.co.kr') &&
            !text.includes('newsservice@sbs.co.kr') &&
            !text.match(/\d{2}-\d{4}-\d{4}/) && // 전화번호 패턴
            !text.match(/서울특별시.*구/) && // 주소 패턴
            !text.match(/©.*All rights/) // 저작권 패턴
        ) {
          paragraphs.push(text);
        }
      });
      
      // 2. p 태그가 부족하면 div에서 추출 (더 공격적으로)
      if (paragraphs.length < 5) {
        $element.find('div, span, section').each((_, el) => {
          const $el = $(el);
          const text = $el.text().trim();
          
          // 자식 요소가 적고 텍스트가 의미있는 div/span/section 선택 (조건 완화)
          if (text && text.length > 30 && $el.children().length <= 5) {
            // 중복 제거 (더 관대하게)
            if (!paragraphs.some(p => p.substring(0, 30) === text.substring(0, 30))) {
              paragraphs.push(text);
            }
          }
        });
      }
      
      // 3. 여전히 부족하면 모든 텍스트 노드에서 추출
      if (paragraphs.length < 3) {
        $element.find('*').each((_, el) => {
          const $el = $(el);
          const directText = $el.contents().filter(function() {
            return this.nodeType === 3; // 텍스트 노드만
          }).text().trim();
          
          if (directText && directText.length > 50) {
            // 중복 제거
            if (!paragraphs.some(p => p.substring(0, 30) === directText.substring(0, 30))) {
              paragraphs.push(directText);
            }
          }
        });
      }
      
      // 3. 그래도 부족하면 전체 텍스트에서 문장 단위로 분리
      if (paragraphs.length < 2) {
        const fullText = $element.text().trim();
        if (fullText.length > 200) {
          // 한국어 문장 분리 (마침표, 느낌표, 물음표 기준)
          const sentences = fullText
            .split(/[.!?]\s+/)
            .filter(s => {
              const trimmed = s.trim();
              return trimmed.length > 30 && 
                     trimmed.length < 500 &&
                                   !trimmed.includes('광고') &&
              !trimmed.includes('로그인') &&
              !trimmed.includes('메뉴') &&
              !trimmed.includes('송고') &&
              !trimmed.includes('연합뉴스를 만나보세요') &&
              !trimmed.includes('다양한 채널에서') &&
              !trimmed.includes('에디터스 픽') &&
              !trimmed.includes('무단 전재') &&
              !trimmed.includes('재배포 금지') &&
              !trimmed.includes('AI 학습') &&
              !trimmed.includes('활용 금지') &&
              !trimmed.includes('회원이 되시면') &&
              !trimmed.includes('특별해집니다') &&
              !trimmed.includes('인공지능이 자동으로') &&
              !trimmed.includes('기사 본문과 함께') &&
              !trimmed.includes('등록번호') &&
              !trimmed.includes('사업자번호') &&
              !trimmed.includes('청소년보호정책') &&
              !trimmed.includes('Yonhapnews Agency') &&
              !trimmed.includes('당신의 지적 탐험과') &&
              !trimmed.includes('프리미엄 콘텐츠') &&
              !trimmed.includes('레이어 닫기') &&
              !trimmed.includes('SBS Prism Tower') &&
              !trimmed.includes('아트컬렉션') &&
              !trimmed.includes('기사 관련문의') &&
              !trimmed.includes('뉴스 기사제보') &&
              !trimmed.includes('고객센터') &&
              !trimmed.includes('기사배열책임자') &&
              !trimmed.includes('청소년보호책임자') &&
              !trimmed.includes('정인영') &&
              !trimmed.includes('양천구 목동서로') &&
              !trimmed.includes('sbs8news@sbs.co.kr') &&
              !trimmed.includes('newsservice@sbs.co.kr');
            });
          
          if (sentences.length > 0) {
            // 2-3개 문장씩 묶어서 문단 만들기
            for (let i = 0; i < sentences.length; i += 2) {
              const paragraph = sentences.slice(i, i + 2).join('. ') + '.';
              if (paragraph.length > 50) {
                paragraphs.push(paragraph);
              }
            }
          }
        }
      }
      
      if (paragraphs.length > 0) {
        let content = paragraphs.join('\n\n');
        content = removeUnwantedText(content);
        content = cleanText(content);
        
        // 콘텐츠 품질 점수 계산
        const wordCount = content.split(/\s+/).length;
        const paragraphCount = paragraphs.length;
        const avgParagraphLength = content.length / paragraphCount;
        
        // 점수 = 단어수 + 문단수*10 + 평균문단길이/10
        const score = wordCount + (paragraphCount * 10) + (avgParagraphLength / 10);
        
        // 최소 조건: 50자 이상, 1문단 이상 (더 관대하게)
        if (content.length > 50 && paragraphCount >= 1 && score > maxScore) {
          bestContent = content;
          maxScore = score;
        }
      }
    });
    
    // 충분히 좋은 콘텐츠를 찾았으면 중단
    if (maxScore > 500) {
      break;
    }
  }
  
  return bestContent;
}

// 강화된 fallback 콘텐츠 추출
function extractFallbackContent($: cheerio.CheerioAPI): string {
  console.log('Attempting enhanced fallback content extraction...');
  
  // 1. 가장 긴 텍스트 블록 찾기 (더 관대하게)
  let longestText = '';
  let longestLength = 0;
  
  // 모든 div, p, section, article, main 태그 검사
  $('div, p, section, article, main, span').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    
    // 자식 요소가 적고 텍스트가 긴 요소 우선 (조건 완화)
    const childCount = $el.children().length;
    const textLength = text.length;
    
    if (textLength > 50 && textLength > longestLength && childCount < 20) {
      // 광고나 네비게이션 텍스트 제외 (SBS 특화 강화)
      if (!text.includes('광고') && 
          !text.includes('메뉴') && 
          !text.includes('로그인') &&
          !text.includes('회원가입') &&
          !text.includes('구독') &&
          !text.includes('네비게이션') &&
          !text.includes('검색') &&
          !text.includes('송고') &&
          !text.includes('연합뉴스를 만나보세요') &&
          !text.includes('다양한 채널에서') &&
          !text.includes('에디터스 픽') &&
          !text.includes('Editor\'s Picks') &&
          !text.includes('무단 전재') &&
          !text.includes('재배포 금지') &&
          !text.includes('AI 학습') &&
          !text.includes('활용 금지') &&
          !text.includes('회원이 되시면') &&
          !text.includes('특별해집니다') &&
          !text.includes('인공지능이 자동으로') &&
          !text.includes('기사 본문과 함께') &&
          !text.includes('등록번호') &&
          !text.includes('사업자번호') &&
          !text.includes('청소년보호정책') &&
          !text.includes('Yonhapnews Agency') &&
          !text.includes('당신의 지적 탐험과') &&
          !text.includes('프리미엄 콘텐츠') &&
          !text.includes('레이어 닫기') &&
          !text.includes('SBS Prism Tower') &&
          !text.includes('아트컬렉션') &&
          !text.includes('기사 관련문의') &&
          !text.includes('뉴스 기사제보') &&
          !text.includes('고객센터') &&
          !text.includes('기사배열책임자') &&
          !text.includes('청소년보호책임자') &&
          !text.includes('정인영') &&
          !text.includes('양천구 목동서로') &&
          !text.includes('sbs8news@sbs.co.kr') &&
          !text.includes('newsservice@sbs.co.kr') &&
          text.split(/\s+/).length > 10) {
        longestText = text;
        longestLength = textLength;
      }
    }
  });
  
  // 2. 문장 기반 추출
  if (longestText.length > 200) {
    const sentences = longestText.split(/[.!?]\s+/)
      .filter(s => s.trim().length > 30)
      .slice(0, 10); // 최대 10문장
    
    if (sentences.length >= 3) {
      return sentences.join('. ') + '.';
    }
  }
  
  // 3. 모든 p 태그 수집
  const allParagraphs: string[] = [];
  $('p').each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 50 && text.length < 500) {
      allParagraphs.push(text);
    }
  });
  
  if (allParagraphs.length >= 2) {
    return allParagraphs.slice(0, 5).join('\n\n');
  }
  
  // 4. body 전체에서 텍스트 추출 후 정리
  const bodyText = $('body').text().trim();
  if (bodyText.length > 500) {
    // 의미있는 문장들만 추출
    const meaningfulSentences = bodyText
      .split(/[.!?]\s+/)
      .filter(s => {
        const trimmed = s.trim();
        return trimmed.length > 40 && 
               trimmed.length < 300 &&
               !trimmed.includes('광고') &&
               !trimmed.includes('로그인') &&
               !trimmed.includes('메뉴') &&
               trimmed.split(' ').length > 5;
      })
      .slice(0, 8);
    
    if (meaningfulSentences.length >= 2) {
      return meaningfulSentences.join('. ') + '.';
    }
  }
  
  return '';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleUrl = searchParams.get('url');
  
  if (!articleUrl) {
    return NextResponse.json(
      { error: '기사 URL이 필요합니다.' },
      { status: 400 }
    );
  }
  
  // 캐시 확인
  const cached = contentCache.get(articleUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ content: cached.content });
  }
  
  try {
    console.log(`Fetching article content from: ${articleUrl}`);
    
    // 타임아웃 설정을 위한 AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15초 타임아웃
    
    const response = await fetch(articleUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 도메인별 선택자 가져오기
    const selectors = getContentSelectors(articleUrl);
    
    // 본문 추출
    let content = extractContent($, selectors);
    
    console.log('Primary extraction result:', content ? content.length + ' characters' : 'failed');
    
    // 모든 사이트에 대해 강력한 추출 방법 적용
    console.log('Applying aggressive text extraction for all sites...');
    
    // 모든 텍스트 수집
    const allParagraphs: string[] = [];
    
    // 1. 모든 p 태그에서 텍스트 수집 (조건 완화)
    $('p').each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 10 && /[가-힣]/.test(text)) {
        allParagraphs.push(text);
      }
    });
    console.log('Found p tags:', allParagraphs.length);
    
    // 2. 모든 div에서 텍스트 수집 (조건 대폭 완화)
    $('div').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text.length > 20 && text.length < 2000 && $el.children().length <= 10 && /[가-힣]/.test(text)) {
        // 중복 제거
        if (!allParagraphs.some(p => p.substring(0, 30) === text.substring(0, 30))) {
          allParagraphs.push(text);
        }
      }
    });
    console.log('After div tags:', allParagraphs.length);
    
    // 3. 모든 span에서 텍스트 수집 (조건 완화)
    $('span').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text.length > 30 && text.length < 1500 && /[가-힣]/.test(text)) {
        // 중복 제거
        if (!allParagraphs.some(p => p.substring(0, 20) === text.substring(0, 20))) {
          allParagraphs.push(text);
        }
      }
    });
    console.log('After span tags:', allParagraphs.length);
    
    // 4. 모든 section, article 태그에서도 수집
    $('section, article').each((_, el) => {
      const $el = $(el);
      const text = $el.text().trim();
      if (text.length > 50 && text.length < 3000 && $el.children().length <= 20 && /[가-힣]/.test(text)) {
        // 중복 제거
        if (!allParagraphs.some(p => p.substring(0, 30) === text.substring(0, 30))) {
          allParagraphs.push(text);
        }
      }
    });
    console.log('After section/article tags:', allParagraphs.length);
    
    // 5. 최후의 수단: 모든 요소에서 텍스트 수집
    if (allParagraphs.length < 5) {
      console.log('Too few paragraphs, trying all elements...');
      $('*').each((_, el) => {
        const $el = $(el);
        const text = $el.text().trim();
        if (text.length > 100 && text.length < 1000 && $el.children().length <= 3 && /[가-힣]/.test(text)) {
          // 중복 제거
          if (!allParagraphs.some(p => p.substring(0, 30) === text.substring(0, 30))) {
            allParagraphs.push(text);
          }
        }
      });
      console.log('After all elements:', allParagraphs.length);
    }
    
    if (allParagraphs.length > 0) {
      const aggressiveContent = allParagraphs.join('\n\n');
      console.log('Aggressive extraction result:', aggressiveContent.length + ' characters, paragraphs:', allParagraphs.length);
      
      // 기존 결과와 비교해서 더 긴 것 사용
      if (aggressiveContent.length > (content?.length || 0)) {
        content = aggressiveContent;
        console.log('Using aggressive extraction result');
      }
    }
    
    // 추출 실패 시 강화된 대체 방법들
    if (!content || content.length < 200) {
      console.log('Primary extraction failed or too short, trying enhanced fallback methods...');
      
      // 1. JSON-LD 구조화 데이터에서 추출
      let jsonLdContent = '';
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const data = JSON.parse($(el).html() || '');
          if (data.articleBody) {
            jsonLdContent = data.articleBody;
          } else if (data.description && data.description.length > 100) {
            jsonLdContent = data.description;
          } else if (data['@type'] === 'NewsArticle' && data.text) {
            jsonLdContent = data.text;
          }
        } catch (e) {
          // JSON 파싱 실패 시 무시
        }
      });
      
      // 2. 메타 태그에서 description 추출
      const metaDescription = $('meta[name="description"]').attr('content') || 
                             $('meta[property="og:description"]').attr('content') || 
                             $('meta[name="twitter:description"]').attr('content') || '';
      
      // 3. 강화된 fallback 텍스트 추출
      const fallbackContent = extractFallbackContent($);
      
      // 우선순위에 따라 콘텐츠 선택
      if (jsonLdContent && jsonLdContent.length > 200) {
        content = cleanText(removeUnwantedText(jsonLdContent));
        console.log('Used JSON-LD content');
      } else if (fallbackContent && fallbackContent.length > 200) {
        content = cleanText(removeUnwantedText(fallbackContent));
        console.log('Used enhanced fallback extraction');
      } else if (metaDescription && metaDescription.length > 100) {
        content = `${metaDescription}

📖 이 내용은 기사의 요약 정보입니다.

🔗 전체 기사 내용은 원문 보기를 통해 확인하실 수 있습니다.

💡 AI 요약 기능을 통해 핵심 내용을 빠르게 파악해보세요.`;
        console.log('Used meta description');
      } else {
        // 최종 fallback - RSS 설명과 함께 안내 메시지
        content = `📰 이 기사의 전체 내용을 자동으로 추출할 수 없습니다.

🔗 상단의 "원문 보기" 버튼을 클릭하여 ${new URL(articleUrl).hostname}에서 전체 내용을 확인해주세요.

✨ AI 요약 기능을 사용하면 RSS 피드의 요약 정보를 바탕으로 핵심 내용을 파악할 수 있습니다.

💡 일부 언론사는 보안 정책으로 인해 외부에서 기사 내용을 가져올 수 없도록 설정되어 있습니다.`;
        console.log('Used final fallback message');
      }
    }
    
    // 캐시에 저장
    contentCache.set(articleUrl, { content, timestamp: Date.now() });
    
    console.log(`Successfully extracted content (${content.length} characters)`);
    
    return NextResponse.json({ content });
    
  } catch (error) {
    console.error('Article content extraction error:', error);
    
    const errorMessage = `⚠️ 기사 내용을 불러오는 중 오류가 발생했습니다.

🔗 원문 보기를 통해 ${articleUrl ? new URL(articleUrl).hostname : '언론사 웹사이트'}에서 전체 내용을 확인해주세요.

🔄 잠시 후 페이지를 새로고침하시면 문제가 해결될 수 있습니다.

✨ AI 요약 기능으로 RSS 피드의 핵심 내용을 확인해보세요.

📞 문제가 지속되면 해당 언론사의 웹사이트 접속 상태를 확인해주시기 바랍니다.`;
    
    return NextResponse.json({
      content: errorMessage,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
  }
} 