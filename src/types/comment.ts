export type Comment = {
  commentId: number;
  userId: number;
  newsId: number;
  content: string;
  parentId?: number | null;
  createdAt: string;
  userName?: string; // 사용자 이름 (백엔드에서 JOIN으로 가져올 예정)
  profileImage?: string; // 프로필 이미지 URL
  provider?: string; // 소셜 로그인 타입 (kakao, naver, google)
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  likeCount?: number;
};
