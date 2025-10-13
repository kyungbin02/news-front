import React, { useState, useEffect, useRef } from "react";
import { getToken } from '@/utils/token';

interface ColumnWriteModalProps {
  onClose: () => void;
  onSubmit: (newColumn: {
    id: number;
    title: string;
    author: string;
    date: string;
    views: number;
    comments: number;
    likes: number;
    content: string;
    imageUrl?: string;
  }) => void;
}

export default function ColumnWriteModal({ onClose, onSubmit }: ColumnWriteModalProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [userId, setUserId] = useState<number | null>(null); // 사용자 ID 추가
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = getToken();
        if (!token) {
          onClose();
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_BASE_URL;
        const response = await fetch(`${apiUrl}/api/user`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isAuthenticated && data.username) {
            setAuthor(data.username);
            // user_id 또는 id 필드 확인
            if (data.user_id) {
              setUserId(data.user_id);
            } else if (data.id) {
              setUserId(data.id);
            } else {
              console.error('사용자 ID를 찾을 수 없습니다:', data);
            }
          }
        } else {
          console.error('사용자 정보 가져오기 실패:', response.status);
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, [onClose]);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    setSelectedImages([]);
    setSelectedFiles([]);
    setCurrentImageIndex(0);
    setTitle("");
    setContent("");
  }, []);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImages.length <= 1) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentImageIndex(prev => prev > 0 ? prev - 1 : selectedImages.length - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImages.length]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (files.length === 0) return;
    
    console.log('이미지 업로드 시작:', files.length, '개 파일');
    
    const readAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('파일 읽기 완료:', file.name);
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('파일 읽기 오류:', file.name, error);
        reject(error);
      };
      reader.readAsDataURL(file);
    });
    
    (async () => {
      try {
        const dataUrls = await Promise.all(files.map(readAsDataUrl));
        console.log('모든 파일 읽기 완료:', dataUrls.length, '개');
        
        // 기존 이미지에 새로운 이미지 추가
        setSelectedImages(prev => {
          const newImages = [...prev, ...dataUrls];
          console.log('이미지 상태 업데이트:', prev.length, '->', newImages.length);
          return newImages;
        });
        
        setSelectedFiles(prev => {
          const newFiles = [...prev, ...files];
          console.log('파일 상태 업데이트:', prev.length, '->', newFiles.length);
          return newFiles;
        });
        
        // 파일 input 초기화 (같은 파일을 다시 선택할 수 있도록)
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        console.log('이미지 업로드 완료');
      } catch (err) {
        console.error('이미지 미리보기 생성 오류:', err);
        alert('이미지 미리보기 생성 중 오류가 발생했습니다.');
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 토큰 확인
    const token = getToken();
    if (!token) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }
    
    console.log('토큰 확인됨:', token.substring(0, 20) + '...');
    
    // 임시로 사용자 ID 설정 (실제로는 백엔드에서 가져와야 함)
    const currentUserId = userId || 1; // 임시로 1로 설정
    
    if (!currentUserId) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      // FormData 생성
      const formData = new FormData();
      
      // 백엔드에서 요구하는 title 파라미터 추가
      formData.append('title', title);
      
      // 제목과 내용을 [제목] 내용 형식으로 합쳐서 전송
      const combinedContent = title ? `[${title}] ${content}` : content;
      formData.append('content', combinedContent);
      
      // 이미지 파일들을 FormData에 추가
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file, index) => {
          formData.append('images', file);
          console.log(`이미지 파일 ${index + 1} 추가:`, file.name, file.size, 'bytes');
        });
        console.log(`총 ${selectedFiles.length}개의 이미지 파일이 FormData에 추가됨`);
      } else {
        console.log('이미지 파일이 없습니다');
      }
      
      console.log('글작성 API 호출 시작...');
      console.log('FormData 내용:', {
        title: title,
        content: combinedContent,
        imagesCount: selectedFiles.length || 0
      });
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/board/board/insert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Content-Type은 FormData를 사용할 때 자동으로 설정되므로 제거
        },
        body: formData
      });
      
      console.log('응답 상태:', response.status);
      console.log('응답 헤더:', response.headers);
      
      if (response.ok) {
        const responseData = await response.text();
        console.log('글작성 성공!', responseData);
        
        // 서버 응답에서 생성된 게시물 ID 추출 시도
        let newPostId = Date.now();
        try {
          // JSON 응답인 경우 파싱 시도
          const jsonResponse = JSON.parse(responseData);
          if (jsonResponse.id || jsonResponse.board_id) {
            newPostId = jsonResponse.id || jsonResponse.board_id;
            console.log('서버에서 반환된 게시물 ID:', newPostId);
          }
        } catch (e) {
          // 텍스트 응답인 경우 그대로 사용
          console.log('서버 응답이 JSON이 아님:', responseData);
        }
        
        // 부모 목록 즉시 갱신 트리거 (이미지 정보 포함)
        onSubmit({
          id: newPostId,
          title: title || content.substring(0, 50) + '...',
          author: author || '작성자',
          date: new Date().toISOString().slice(0, 10),
          views: 0,
          comments: 0,
          likes: 0,
          content,
          imageUrls: selectedImages.length > 0 ? selectedImages.join(',') : undefined,
        });
        onClose();
        alert(responseData || '글이 성공적으로 작성되었습니다!');
      } else {
        const errorData = await response.text();
        console.error('글작성 실패:', response.status, errorData);
        
        if (response.status === 401) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.');
        } else if (response.status === 403) {
          alert('접근 권한이 없습니다.');
        } else if (response.status === 500) {
          console.error('서버 내부 오류:', errorData);
          alert('서버 오류가 발생했습니다. 백엔드 개발자에게 문의해주세요.');
        } else {
          alert('글작성에 실패했습니다. 다시 시도해주세요.');
        }
      }
    } catch (error) {
      console.error('글작성 오류:', error);
      alert('글작성 중 오류가 발생했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
        <div className="bg-white/95 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden">
          <div className="w-1/2 bg-black"></div>
          <div className="w-1/2 flex items-center justify-center">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white/95 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden transform transition-all duration-500 ease-in-out">
        {/* 왼쪽: 이미지 업로드 영역 */}
        <div className="w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 relative">
          {selectedImages.length > 0 ? (
            <div className="w-full h-full relative">
              <img 
                src={selectedImages[currentImageIndex]} 
                alt="칼럼 이미지"
                className="w-full h-full object-cover"
              />
              
              {/* 이미지 네비게이션 */}
              {selectedImages.length > 1 && (
                <>
                  {/* 이전 버튼 */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev > 0 ? prev - 1 : selectedImages.length - 1)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-700 p-2 rounded-full hover:bg-white shadow-md hover:shadow-lg transition-colors"
                    title="이전 이미지"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* 다음 버튼 */}
                  <button
                    onClick={() => setCurrentImageIndex(prev => prev < selectedImages.length - 1 ? prev + 1 : 0)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 text-gray-700 p-2 rounded-full hover:bg-white shadow-md hover:shadow-lg transition-colors"
                    title="다음 이미지"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* 이미지 인디케이터 */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {selectedImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-400'
                        }`}
                        title={`${index + 1}번째 이미지`}
                      />
                    ))}
                  </div>
                </>
              )}
              
              <div className="absolute bottom-4 left-4 bg-white/90 text-gray-700 text-sm px-3 py-1 rounded-full flex items-center space-x-2 shadow-md">
                <span>{currentImageIndex + 1}/{selectedImages.length}장</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                  title="이미지 추가"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
                  <button
                    onClick={() => { 
                      console.log('모든 이미지 삭제');
                      setSelectedImages([]); 
                      setSelectedFiles([]); 
                      setCurrentImageIndex(0);
                      // 파일 input도 초기화
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-4 right-4 bg-white/80 text-gray-700 p-2 rounded-full hover:bg-white shadow-md hover:shadow-lg transition-colors"
                    title="모든 이미지 삭제"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
              <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg mb-4 text-gray-700">이미지를 추가해주세요</p>
                <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                이미지 선택
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* 오른쪽: 글쓰기 폼 */}
        <div className="w-1/2 flex flex-col h-full">
          {/* 헤더 */}
          <div className="border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">칼럼 글쓰기</h2>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 transform transition-transform duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 글쓰기 폼 */}
          <div className="flex-1 p-6 flex flex-col">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="제목을 입력하세요"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">작성자</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-600"
                    value={author}
                    readOnly
                  />
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    style={{ height: 'calc(100vh - 500px)' }}
                    placeholder="내용을 입력하세요"
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  등록
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 