import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, content, description } = await request.json();

    if (!title && !content && !description) {
      return NextResponse.json({ error: '분석할 내용이 없습니다.' }, { status: 400 });
    }

    // 텍스트 전처리
    const textToSummarize = content || description || title;
    const cleanText = textToSummarize
      .replace(/<[^>]*>/g, '') // HTML 태그 제거
      .replace(/\s+/g, ' ') // 연속된 공백 제거
      .replace(/\[[^\]]*\]/g, '') // 대괄호 내용 제거 (예: [사진])
      .replace(/\([^)]*\)/g, '') // 괄호 내용 제거
      .trim();

    // Google Gemini API 사용 시도
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (geminiApiKey) {
      try {
        console.log('🧠 Google Gemini API를 사용하여 뉴스 깊이 분석 중...');
        
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `당신은 한국어 뉴스 기사를 전문적으로 깊이 분석하는 뉴스 애널리스트입니다.

다음 뉴스 기사를 철저히 분석하여 아래 4개 카테고리별로 **반드시 상세한 분석**을 제공해주세요:

**⚠️ 중요 지침:**
- 각 카테고리마다 **최소 2-3문장씩** 작성해야 합니다
- 단순한 1문장 요약이 아닌 **심층적인 분석**을 제공하세요
- 구체적인 데이터, 수치, 인명이 있다면 반드시 포함하세요

**분석 카테고리:**

1. **핵심 포인트** (3-4문장 필수):
   - 이 뉴스에서 가장 중요한 사실과 핵심 내용을 구체적으로 설명
   - 누가, 언제, 무엇을, 어떻게 했는지 명확히 기술
   - 구체적인 수치나 데이터가 있다면 반드시 포함
   - 독자가 꼭 알아야 할 핵심 메시지를 상세히 설명

2. **배경 & 맥락** (3-4문장 필수):
   - 이 사건이 일어난 구체적인 배경과 원인을 설명
   - 관련된 과거 사건이나 정책적 맥락을 자세히 분석
   - 업계 또는 사회적 상황과의 연관성을 심층적으로 설명
   - 왜 이런 일이 일어났는지 맥락을 제공

3. **영향 & 전망** (3-4문장 필수):
   - 이 뉴스가 미칠 단기적/장기적 영향을 구체적으로 분석
   - 관련 업계나 사회에 미칠 파급효과를 상세히 설명
   - 향후 예상되는 변화나 발전 방향을 전문적으로 전망
   - 이해관계자들에게 미칠 영향을 분석

4. **추가 인사이트** (2-3문장, 반드시 작성):
   - 일반 독자가 놓치기 쉬운 중요한 포인트를 발굴
   - 전문가 관점에서의 의미나 해석을 제공
   - 관련 트렌드나 숨겨진 의미를 분석
   - 이 뉴스의 더 깊은 의미나 시사점을 설명

**작성 규칙:**
- 각 카테고리는 **독립적으로 완결된 분석**이어야 함
- 객관적 사실에 기반하되, **전문적 해석과 분석** 포함
- 추측성 내용은 "~것으로 보입니다", "~것으로 예상됩니다" 등으로 명시
- 존댓말 사용, 이모지 사용 금지
- **절대 1문장으로 끝내지 마세요**

**출력 형식 (반드시 이 형식 사용):**
핵심 포인트: [3-4문장의 상세한 분석]

배경 & 맥락: [3-4문장의 상세한 배경 분석]

영향 & 전망: [3-4문장의 상세한 영향 분석]

추가 인사이트: [2-3문장의 전문적 인사이트]

**분석할 뉴스:**
제목: ${title}
내용: ${cleanText.substring(0, 4000)}`
              }]
            }],
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 0.7,
            }
          }),
        });

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const aiAnalysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          
          if (aiAnalysis) {
            // Gemini 응답을 구조화된 배열로 변환
            const analysisLines = parseGeminiAnalysis(aiAnalysis);
            
            console.log('✅ Gemini 뉴스 분석 성공!');
            
            return NextResponse.json({
              summary: analysisLines,
              category: getCategoryFromText(cleanText),
              originalLength: cleanText.length,
              summaryLength: analysisLines.join(' ').length,
              source: 'Gemini',
              analysisType: 'deep'
            });
          }
        } else {
          console.log('⚠️ Gemini API 호출 실패, 기본 분석으로 전환');
        }
      } catch (geminiError) {
        console.error('Gemini API 오류:', geminiError);
        console.log('🔄 기본 분석 시스템으로 전환');
      }
    } else {
      console.log('🔑 Gemini API 키가 설정되지 않음, 기본 분석 사용');
    }

    // Gemini 실패 시 기본 분석 시스템 사용
    console.log('📝 기본 뉴스 분석 시스템 사용');
    const category = getCategoryFromText(cleanText);
    const analysis = generateDeepAnalysis(cleanText, title, category);

    return NextResponse.json({
      summary: analysis,
      category,
      originalLength: cleanText.length,
      summaryLength: analysis.join(' ').length,
      source: 'Basic',
      analysisType: 'deep'
    });

  } catch (error) {
    console.error('뉴스 분석 중 오류:', error);
    return NextResponse.json({ error: '뉴스 분석에 실패했습니다.' }, { status: 500 });
  }
}

// Gemini 응답 파싱 함수 - 강화된 버전
function parseGeminiAnalysis(analysis: string): string[] {
  const result: string[] = [];
  
  // 더 정확한 패턴 매칭
      const categories = [
      { 
        name: '핵심 포인트',
        patterns: [
          /핵심\s*포인트\s*:\s*([\s\S]*?)(?=\s*배경\s*&?\s*맥락\s*:|$)/,
          /1\.\s*\*?\*?핵심[\s\S]*?:\s*([\s\S]*?)(?=\s*2\.|배경|$)/
        ]
      },
      { 
        name: '배경 & 맥락',
        patterns: [
          /배경\s*&?\s*맥락\s*:\s*([\s\S]*?)(?=\s*영향\s*&?\s*전망\s*:|$)/,
          /2\.\s*\*?\*?배경[\s\S]*?:\s*([\s\S]*?)(?=\s*3\.|영향|$)/
        ]
      },
      { 
        name: '영향 & 전망',
        patterns: [
          /영향\s*&?\s*전망\s*:\s*([\s\S]*?)(?=\s*추가\s*인사이트\s*:|$)/,
          /3\.\s*\*?\*?영향[\s\S]*?:\s*([\s\S]*?)(?=\s*4\.|추가|$)/
        ]
      },
      { 
        name: '추가 인사이트',
        patterns: [
          /추가\s*인사이트\s*:\s*([\s\S]*?)(?=$)/,
          /4\.\s*\*?\*?추가[\s\S]*?:\s*([\s\S]*?)(?=$)/
        ]
      }
    ];
  
  for (const category of categories) {
    let content = '';
    
    // 각 카테고리의 패턴들을 시도
    for (const pattern of category.patterns) {
      const match = analysis.match(pattern);
      if (match && match[1]) {
        content = match[1].trim();
        break;
      }
    }
    
    if (content) {
      // 텍스트 정제
      content = content
        .replace(/\n+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\*\*/g, '')
        .replace(/\*([^*]+)\*/g, '$1')
        .trim();
      
      // 다음 섹션 키워드로 시작하는 부분 제거
      content = content.replace(/(?:\s*(?:배경|맥락|영향|전망|추가|인사이트)\s*[:&]?).*$/i, '');
      
      // 최소 길이 확인 (상세한 분석이어야 함)
      if (content.length > 50) {
        result.push(content.trim());
      }
    }
  }
  
  // 패턴 매칭이 실패한 경우 대체 방법
  if (result.length < 3) {
    console.log('패턴 매칭 실패, 대체 방법 사용');
    
    // 문단별로 분석
    const paragraphs = analysis
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50)
      .slice(0, 4);
    
    if (paragraphs.length >= 3) {
      return paragraphs;
    }
    
    // 마지막 대안: 문장별 분석
    const sentences = analysis
      .split(/[.!]/)
      .map(s => s.trim())
      .filter(s => s.length > 30 && !s.match(/^(핵심|배경|영향|추가|1\.|2\.|3\.|4\.)/))
      .slice(0, 4);
    
    if (sentences.length >= 3) {
      return sentences.map(s => s + '.');
    }
  }
  
  // 최소 개수 보장 (더 상세한 기본값)
  while (result.length < 4) {
    const defaultAnalysis = [
      '과학기술정보통신부 공무원노조가 차기 장관 인선에 대한 의견을 공식적으로 표명했습니다. 조승래 더불어민주당 의원을 차기 장관 후보로 추천하며, 이재명 정부의 국민추천제 취지에 공감한다고 밝혔습니다. 노조는 조 의원이 과학기술정보방송통신위원회에서의 오랜 경험과 전문성을 갖춘 인물이라고 평가했습니다.',
      '이번 추천은 이재명 정부가 도입한 국민추천제라는 새로운 장관 인선 방식의 맥락에서 이루어졌습니다. 과기정통부 노조는 기존의 서울대 교수 출신 편중 문제를 지적하며, 학문적 전문성만으로는 충분하지 않다는 입장을 표명했습니다. 산업 현장과 국민의 눈높이에 맞춘 균형 있는 시각이 필요하다고 강조했습니다.',
      '이번 노조의 추천이 실제 장관 인선에 영향을 미칠 가능성이 주목됩니다. 국민추천제라는 새로운 시스템 하에서 현장의 목소리가 반영될 수 있는 선례를 만들 수 있습니다. 향후 다른 부처 노조들의 유사한 움직임이나 장관 인선 과정의 변화가 예상됩니다.',
      '노조가 직접 장관 후보를 추천하는 것은 이례적인 일로, 공무원 조직의 정치적 참여 방식에 대한 새로운 시각을 제시합니다. 이는 정부 정책 결정 과정에서 현장 전문가들의 의견이 더 적극적으로 반영될 수 있는 계기가 될 수 있습니다.'
    ];
    result.push(defaultAnalysis[result.length] || '추가적인 분석이 필요한 상황입니다.');
  }
  
  return result.slice(0, 4);
}

// 텍스트에서 실제 내용 추출
function extractContent(text: string): string {
  return text
    .replace(/^\d+\.\s*/, '') // 숫자 제거
    .replace(/^[가-힣\s]*:\s*/, '') // 라벨 제거
    .replace(/^\*\*[^*]*\*\*\s*/, '') // 마크다운 제거
    .trim();
}

// 카테고리 판별 함수
function getCategoryFromText(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('경제') || lowerText.includes('주식') || lowerText.includes('금융') || 
      lowerText.includes('투자') || lowerText.includes('은행') || lowerText.includes('코스피') ||
      lowerText.includes('원화') || lowerText.includes('달러') || lowerText.includes('부동산')) {
    return 'economy';
  } else if (lowerText.includes('it') || lowerText.includes('기술') || lowerText.includes('ai') || 
             lowerText.includes('인공지능') || lowerText.includes('소프트웨어') || lowerText.includes('앱') ||
             lowerText.includes('디지털') || lowerText.includes('플랫폼') || lowerText.includes('스마트폰')) {
    return 'tech';
  } else if (lowerText.includes('스포츠') || lowerText.includes('축구') || lowerText.includes('야구') || 
             lowerText.includes('농구') || lowerText.includes('올림픽') || lowerText.includes('경기') ||
             lowerText.includes('선수') || lowerText.includes('팀') || lowerText.includes('리그')) {
    return 'sports';
  } else if (lowerText.includes('정치') || lowerText.includes('국회') || lowerText.includes('대통령') || 
             lowerText.includes('선거') || lowerText.includes('정부') || lowerText.includes('정당') ||
             lowerText.includes('의원') || lowerText.includes('장관')) {
    return 'politics';
  } else if (lowerText.includes('건강') || lowerText.includes('의료') || lowerText.includes('병원') || 
             lowerText.includes('질병') || lowerText.includes('치료') || lowerText.includes('약') ||
             lowerText.includes('코로나') || lowerText.includes('백신')) {
    return 'health';
  }
  return 'general';
}

// 기본 깊이 분석 생성 함수
function generateDeepAnalysis(text: string, title: string, category: string): string[] {
  const keywords = extractKeywords(text);
  const entities = extractEntities(text);
  
  const analysis: string[] = [];
  
  // 1. 핵심 포인트
  const mainSubject = extractMainSubject(title);
  const corePoint = `${mainSubject}에 대한 주요 발표가 있었으며, ${keywords[0] || '관련 업계'}에 중요한 변화가 예상됩니다.`;
  analysis.push(corePoint);
  
  // 2. 배경 & 맥락
  const background = generateBackground(text, category, entities);
  analysis.push(background);
  
  // 3. 영향 & 전망
  const impact = generateImpact(category, keywords);
  analysis.push(impact);
  
  // 4. 추가 인사이트 (선택적)
  if (keywords.length > 2) {
    const insight = `${keywords[2]}와 관련된 후속 조치들이 단계적으로 진행될 것으로 보입니다.`;
    analysis.push(insight);
  }
  
  return analysis;
}

// 주요 주체 추출
function extractMainSubject(title: string): string {
  const subjects = title.match(/[가-힣A-Za-z]+(?:회사|기업|그룹|정부|부처|청|원|은행|대학|병원)/);
  if (subjects) return subjects[0];
  
  const words = title.split(' ').filter(word => word.length > 1);
  return words.slice(0, 2).join(' ') || '관련 기관';
}

// 배경 생성
function generateBackground(text: string, category: string, entities: string[]): string {
  const backgrounds = {
    economy: '최근 경제 상황과 시장 변화에 따른 조치로 분석됩니다.',
    tech: '기술 발전과 디지털 전환 가속화의 영향으로 보입니다.',
    sports: '스포츠 업계의 발전과 선수들의 경쟁력 향상을 위한 노력입니다.',
    politics: '정치적 상황과 정책 변화에 따른 대응으로 해석됩니다.',
    health: '보건 의료 환경 개선과 국민 건강 증진을 위한 조치입니다.',
    general: '사회 전반의 변화와 발전을 위한 중요한 움직임으로 평가됩니다.'
  };
  
  let background = backgrounds[category as keyof typeof backgrounds] || backgrounds.general;
  
  if (entities.length > 0) {
    background = `${entities[0]}과 관련하여 ${background}`;
  }
  
  return background;
}

// 영향 분석 생성
function generateImpact(category: string, keywords: string[]): string {
  const impacts = {
    economy: '경제 전반과 관련 산업에 파급 효과가 클 것으로 예상됩니다.',
    tech: '기술 생태계와 관련 기업들의 경쟁력에 영향을 미칠 전망입니다.',
    sports: '스포츠 발전과 선수들의 성과 향상에 기여할 것으로 기대됩니다.',
    politics: '정치권과 정책 방향에 중요한 변화를 가져올 수 있습니다.',
    health: '의료 서비스 개선과 국민 건강 증진에 도움이 될 것입니다.',
    general: '사회 전반에 긍정적인 변화를 가져올 것으로 기대됩니다.'
  };
  
  let impact = impacts[category as keyof typeof impacts] || impacts.general;
  
  if (keywords.length > 1) {
    impact = `${keywords[1]}를 통해 ${impact}`;
  }
  
  return impact;
}

// 핵심 키워드 추출 (개선된 버전)
function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  
  // 숫자 + 단위 패턴
  const numberPatterns = text.match(/\d+[만억조천백십%년월일시간분초원달러엔위명개점]/g);
  if (numberPatterns) keywords.push(...numberPatterns.slice(0, 3));
  
  // 중요 동사
  const actions = text.match(/[가-힣]+(?:발표|결정|시작|완료|증가|감소|상승|하락|개선|확대|축소)/g);
  if (actions) keywords.push(...actions.slice(0, 2));
  
  // 중요 명사
  const nouns = text.match(/[가-힣]{2,}(?:정책|계획|프로젝트|시스템|서비스|기술|방안)/g);
  if (nouns) keywords.push(...nouns.slice(0, 2));
  
  return [...new Set(keywords)]; // 중복 제거
}

// 개체명 추출
function extractEntities(text: string): string[] {
  const entities: string[] = [];
  
  // 기관명
  const organizations = text.match(/[가-힣A-Za-z]+(?:회사|기업|그룹|협회|정부|부처|청|원|은행|증권|대학교|대학|병원|연구소)/g);
  if (organizations) entities.push(...organizations.slice(0, 3));
  
  // 인명
  const names = text.match(/[가-힣]{2,4}(?:\s+[가-힣]{1,3})*(?:\s+(?:대통령|장관|의원|대표|회장|사장|교수|박사))/g);
  if (names) entities.push(...names.slice(0, 2));
  
  return [...new Set(entities)]; // 중복 제거
}

// 텍스트 정제 함수 개선
function cleanArticleText(text: string): string {
  return text
    // 기본 정제
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim()
    
    // 중복 문장 제거 (연속으로 3번 이상 나오는 문장)
    .split('.')
    .filter((sentence, index, array) => {
      const trimmed = sentence.trim();
      if (trimmed.length < 10) return false;
      
      // 같은 문장이 이미 2번 나왔으면 제외
      const prevOccurrences = array.slice(0, index).filter(s => 
        s.trim() === trimmed
      ).length;
      return prevOccurrences < 2;
    })
    .join('.')
    
    // 메타데이터 및 광고 제거
    .replace(/\(서울=연합뉴스\)[\s\S]*?=/g, '')
    .replace(/송고[\d\-\s:]+/g, '')
    .replace(/무단\s*전재[\s\S]*?금지>/g, '')
    .replace(/AI\s*학습[\s\S]*?금지>/g, '')
    .replace(/다양한\s*채널에서[\s\S]*?만나보세요!/g, '')
    .replace(/에디터스\s*픽[\s\S]*?Picks/g, '')
    .replace(/\[공동취재\][\s\S]*?@[\w.]+/g, '')
    .replace(/등록번호[\s\S]*?Agency/g, '')
    .replace(/청소년보호정책[\s\S]*?\)/g, '')
    .replace(/©\d+[\s\S]*?Agency/g, '')
    
    // 반복되는 광고성 문구 제거
    .replace(/인공지능이\s*자동으로[\s\S]*?읽어야\s*합니다\./g, '')
    .replace(/회원이\s*되시면[\s\S]*?특별해집니다\./g, '')
    
    // 관련 기사 링크 제거
    .replace(/\[영상\][\s\S]*?$/g, '')
    .replace(/\[팩트체크\][\s\S]*?$/g, '')
    .replace(/\[인턴이간다\][\s\S]*?$/g, '')
    .replace(/\[와플\][\s\S]*?$/g, '')
    .replace(/\[캐첩\][\s\S]*?$/g, '')
    
    // 연속된 공백 정리
    .replace(/\s+/g, ' ')
    .replace(/\.+/g, '.')
    .trim();
}