import axios from 'axios';

const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NEXT_PUBLIC_NAVER_CLIENT_SECRET;

export interface NaverNewsArticle {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

export const fetchNaverNews = async (category: string = 'IT'): Promise<NaverNewsArticle[]> => {
  console.log('Fetching Naver news for category:', category);

  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
    console.error('Naver API credentials are missing');
    return [];
  }

  try {
    console.log('Making API request...');
    const response = await axios.get('/api/news', {
      params: { category }
    });

    console.log('API Response:', response.data);

    if (!response.data?.items) {
      console.error('Invalid response format from API');
      return [];
    }

    return response.data.items.map((item: any) => ({
      title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      description: item.description.replace(/<[^>]*>/g, ''),
      link: item.link,
      pubDate: item.pubDate,
      source: item.publisher,
      imageUrl: item.imageUrl
    }));
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('API Error:', error.response.data);
      } else if (error.request) {
        console.error('No response received from API');
      } else {
        console.error('Error setting up request:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    return [];
  }
}; 