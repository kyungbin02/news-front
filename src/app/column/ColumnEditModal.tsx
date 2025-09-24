'use client';

import React, { useEffect, useState } from 'react';
import { getToken } from '@/utils/token';
import ImageGallery from '@/components/ImageGallery';
import { parseTitleAndContent } from '@/utils/articleStorage';

export interface ColumnEditData {
  id: number;
  content: string;
  title?: string; // 제목 필드 추가
  imageUrls?: string; // 기존 이미지 URL들 (쉼표로 구분)
  image_url?: string; // 기존 단일 이미지 URL (fallback)
}

interface ColumnEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: ColumnEditData;
  onUpdated: (updated: { id: number; content: string; shouldRefresh?: boolean; newImageUrls?: string }) => void;
}

export default function ColumnEditModal({ isOpen, onClose, column, onUpdated }: ColumnEditModalProps) {
  // 기존 content를 제목과 내용으로 분리
  const { title: initialTitle, content: initialContent } = parseTitleAndContent(column.content);
  
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  
  // 이미지 업로드 관련 상태
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 이미지 선택 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 새 이미지들을 기존 이미지에 추가
    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // 미리보기용 Data URL 생성
    const newImages = files.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...newImages]);
  };

  // 이미지 제거 핸들러
  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => {
      const newImages = prev.filter((_, i) => i !== index);
      return newImages;
    });
  };

  useEffect(() => {
    const { title: newTitle, content: newContent } = parseTitleAndContent(column.content);
    setTitle(newTitle);
    setContent(newContent);
  }, [column]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const token = getToken();
    console.log('보내는 토큰:', token);

    if (!token) {
      alert('로그인이 필요합니다. 다시 로그인해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';

      // FormData 생성
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('content', content.trim());
      
      // 선택된 이미지 파일들 추가
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });
      
      // 전송할 데이터 로그 출력
      console.log('이미지 수정 전송 데이터:');
      console.log('- title:', title.trim());
      console.log('- content:', content.trim());
      console.log('- selectedFiles:', selectedFiles);
      console.log('- selectedFiles 개수:', selectedFiles.length);
      
      // FormData 내용 확인
      for (let [key, value] of formData.entries()) {
        console.log(`FormData - ${key}:`, value);
      }

      const resp = await fetch(`${baseUrl}/api/board/update-with-images/${column.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Content-Type은 자동으로 설정됨 (multipart/form-data)
        },
        body: formData,
      });

      console.log('응답 상태:', resp.status);
      console.log('응답 헤더:', Object.fromEntries(resp.headers.entries()));

      if (!resp.ok) {
        if (resp.status === 401) {
          alert('로그인이 필요합니다. 다시 로그인해주세요.');
        } else if (resp.status === 403) {
          alert('작성자만 수정할 수 있습니다.');
        } else if (resp.status === 404) {
          alert('게시글을 찾을 수 없습니다.');
        } else {
          alert('수정 실패했습니다.');
        }
        return;
      }

      // 성공 응답 내용 확인
      const responseText = await resp.text();
      console.log('백엔드 응답 내용:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('백엔드 응답 데이터:', responseData);
        
        // 이미지 수정 성공 확인
        if (responseData.success && responseData.data) {
          console.log('이미지 수정 성공!');
          if (responseData.data.imageUrls || responseData.data.image_url) {
            console.log('새로운 이미지 정보:', {
              imageUrls: responseData.data.imageUrls,
              image_url: responseData.data.image_url
            });
            
            // 새로운 이미지 URL을 즉시 사용하여 상태 업데이트
            const newImageUrls = responseData.data.imageUrls || responseData.data.image_url;
            console.log('즉시 사용할 새로운 이미지 URL:', newImageUrls);
          }
        }
      } catch (e) {
        console.log('응답이 JSON 형식이 아님:', responseText);
        // JSON 파싱 실패 시에도 계속 진행
      }

      // 수정 성공 시 콜백 호출 (서버에서 최신 데이터를 가져와서 업데이트)
      const combinedContent = `[${title.trim()}] ${content.trim()}`;
      onUpdated({ 
        id: column.id, 
        content: combinedContent,
        shouldRefresh: true, // 서버 데이터 재조회 필요 표시
        newImageUrls: responseData?.data?.imageUrls || responseData?.data?.image_url // 새로운 이미지 URL 전달
      });
      
      // 사용자에게 성공 피드백 제공
      if (selectedFiles.length > 0) {
        alert(`✅ 수정 완료!\n\n제목: ${title.trim()}\n내용: ${content.trim()}\n이미지: ${selectedFiles.length}개`);
      } else {
        alert(`✅ 수정 완료!\n\n제목: ${title.trim()}\n내용: ${content.trim()}`);
      }
      
      // alert 확인 후 자동 새로고침
      setTimeout(() => {
        console.log('사용자가 alert 확인 - 페이지 새로고침 실행');
        window.location.reload();
      }, 100);
      
      onClose();
    } catch (error) {
      console.error('오류:', error);
      alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className="bg-white/95 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* 왼쪽: 이미지 표시 영역 */}
        <div className="w-1/2 bg-gray-100 flex items-center justify-center">
          {(column?.imageUrls || column?.image_url) ? (
            <ImageGallery 
              imageUrl={column.imageUrls || column.image_url || ''} 
              size="large" 
            />
          ) : (
            <div className="text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">이미지 없음</p>
              <p className="text-sm">이미지를 추가해보세요</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 수정 폼 */}
        <div className="w-1/2 flex flex-col">
          {/* 헤더 */}
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">칼럼 수정</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 p-4 flex flex-col gap-4">
            {/* 제목 입력 필드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제목</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
              />
            </div>

            {/* 내용 입력 필드 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
              <textarea
                className="w-full h-[calc(100%-12rem)] border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용을 입력하세요"
              />
            </div>

            {/* 이미지 수정 섹션 */}
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">이미지 수정</label>
              
              {/* 파일 입력 (숨김) */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              {/* 이미지 업로드 버튼 */}
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  이미지 추가
                </button>
                <span className="text-sm text-gray-500">
                  총 이미지: {
                    (column?.imageUrls 
                      ? column.imageUrls.split(',').length 
                      : column?.image_url 
                        ? 1 
                        : 0) + selectedFiles.length
                  }개
                </span>
              </div>

              {/* 선택된 이미지 미리보기 */}
              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {selectedFiles.map((_, index) => (
                    <div key={index} className="relative">
                      <img
                        src={selectedImages[index]}
                        alt={`새 이미지 ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-400">
                기존 이미지는 새 이미지로 교체됩니다.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className={`px-6 py-2 rounded-lg text-white ${
                  submitting || !title.trim() || !content.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                저장
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

