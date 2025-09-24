'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  imageUrl: string | string[];
  size?: 'small' | 'medium' | 'large' | 'custom'; // 크기 조절을 위한 props 추가
}

export default function ImageGallery({ imageUrl, size = 'medium' }: ImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 크기에 따른 스타일 설정
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return 'w-64 h-40'; // 기존 크기 (256x160px)
      case 'medium':
        return 'w-96 h-60'; // 중간 크기 (384x240px)
      case 'large':
        return 'w-full h-full'; // 전체 크기로 꽉 차게
      case 'custom':
        return 'w-[800px] h-[500px]'; // 사용자 정의 크기 (800x500px)
      default:
        return 'w-96 h-60'; // 기본값을 중간 크기로 변경
    }
  };
  
  // imageUrl이 배열 형태인지 확인하고 처리
  let imageUrls: string[] = [];
  
  if (Array.isArray(imageUrl)) {
    // 이미 배열인 경우
    imageUrls = imageUrl;
  } else if (typeof imageUrl === 'string') {
    // 문자열인 경우 쉼표로 구분하여 배열로 변환
    imageUrls = imageUrl.split(',').map(url => url.trim());
  }
  
  // 디버깅을 위한 로그
  console.log('ImageGallery - imageUrl:', imageUrl);
  console.log('ImageGallery - imageUrl 타입:', typeof imageUrl);
  console.log('ImageGallery - size:', size);
  console.log('ImageGallery - imageUrls:', imageUrls);
  console.log('ImageGallery - imageUrls 길이:', imageUrls.length);
  console.log('ImageGallery - hasMultipleImages:', imageUrls.length > 1);
  console.log('ImageGallery - currentImageIndex:', currentImageIndex);
  
  // 이미지가 여러 개일 때만 네비게이션 표시
  const hasMultipleImages = imageUrls.length > 1;

  return (
    <>
      {/* 현재 이미지 */}
      {size === 'large' ? (
        <img 
          src={imageUrls[currentImageIndex].trim()} 
          alt={`칼럼 이미지 ${currentImageIndex + 1}`}
          className="w-full h-full object-contain"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center center',
            display: 'block'
          }}
          onError={(e) => {
            console.error('이미지 로드 실패:', imageUrls[currentImageIndex]);
            const imgElement = e.currentTarget;
            imgElement.style.display = 'none';
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'w-full h-full bg-gray-200 flex items-center justify-center text-gray-500';
            errorDiv.innerHTML = `
              <div class="text-center">
                <div class="text-sm font-medium mb-2">이미지를 불러올 수 없습니다</div>
                <div class="text-xs text-gray-400">URL: ${imageUrls[currentImageIndex]}</div>
              </div>
            `;
            imgElement.parentNode?.appendChild(errorDiv);
          }}
        />
      ) : (
        <div 
          className={`${getSizeStyles()} overflow-hidden ${size === 'large' ? '' : 'rounded-lg'} ${size === 'large' ? 'bg-black' : 'bg-gray-100'}`}
        >
          <img 
            src={imageUrls[currentImageIndex].trim()} 
            alt={`칼럼 이미지 ${currentImageIndex + 1}`}
            className="w-full h-full object-contain"
            onError={(e) => {
              console.error('이미지 로드 실패:', imageUrls[currentImageIndex]);
              const imgElement = e.currentTarget;
              imgElement.style.display = 'none';
              
              const errorDiv = document.createElement('div');
              errorDiv.className = 'w-full h-full bg-gray-200 flex items-center justify-center text-gray-500';
              errorDiv.textContent = '이미지를 불러올 수 없습니다';
              imgElement.parentNode?.appendChild(errorDiv);
            }}
          />
        </div>
      )}
      
      {/* 네비게이션 버튼들 (여러 이미지일 때만) */}
      {hasMultipleImages && (
        <>
          {/* 이전 버튼 */}
          {currentImageIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => prev - 1);
              }}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* 다음 버튼 */}
          {currentImageIndex < imageUrls.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => prev + 1);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          
          {/* 이미지 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'bg-white' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
              />
            ))}
          </div>
          
          {/* 이미지 카운터 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            {currentImageIndex + 1} / {imageUrls.length}
          </div>
        </>
      )}
    </>
  );
}