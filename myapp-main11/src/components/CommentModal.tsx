"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnInfo?: {
    title: string;
    author: string;
    date: string;
    content: string;
    likes: number;
    commentsCount: number;
  };
  comments?: Array<{
    id: number;
    author: string;
    content: string;
    timestamp: string;
    likes: number;
    profileImage?: string;
  }>;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  isOpen, 
  onClose, 
  columnInfo = {
    title: '',
    author: '',
    date: '',
    content: '',
    likes: 0,
    commentsCount: 0
  }, 
  comments = [] 
}) => {
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
      <div className={`bg-white/95 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden transform transition-all duration-500 ease-in-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
        {/* 왼쪽: 검정 배경 */}
        <div className="w-1/2 bg-black">
        </div>

        {/* 오른쪽: 댓글 섹션 */}
        <div className="w-1/2 flex flex-col">
          {/* 작성자 정보 */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden transform transition-transform duration-300 hover:scale-110">
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                    {columnInfo.author ? columnInfo.author[0] : '?'}
                  </div>
                </div>
                <div>
                  <div className="font-semibold">{columnInfo.author || '작성자'}</div>
                  <div className="text-sm text-gray-500">{columnInfo.date || '날짜'}</div>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 transform transition-transform duration-300 hover:scale-110"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 제목 */}
            <h2 className="text-xl font-semibold mt-4 mb-2 transform transition-all duration-300 hover:translate-x-2">{columnInfo.title || '제목'}</h2>

            {/* 작성 내용 */}
            <p className="text-gray-700 whitespace-pre-wrap mb-4 transform transition-all duration-300 hover:translate-x-2">{columnInfo.content || '내용'}</p>

            {/* 통계 정보 */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 transform transition-transform duration-300 hover:scale-110">
                <svg className="w-5 h-5 text-[#e53e3e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm font-medium">{columnInfo.likes}</span>
              </div>
              <div className="flex items-center space-x-2 transform transition-transform duration-300 hover:scale-110">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">{columnInfo.commentsCount}</span>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {comments.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                아직 댓글이 없습니다.
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-4 transform transition-all duration-300 hover:translate-x-2">
                  {/* 프로필 이미지 */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden transform transition-transform duration-300 hover:scale-110">
                      {comment.profileImage ? (
                        <img 
                          src={comment.profileImage} 
                          alt={comment.author} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600">
                          {comment.author[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 댓글 내용 */}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-2xl px-4 py-2 transform transition-all duration-300 hover:translate-x-2">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-sm">{comment.author}</span>
                        <span className="text-gray-500 text-xs">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-800 text-sm">{comment.content}</p>
                    </div>
                    
                    {/* 댓글 액션 버튼 */}
                    <div className="flex items-center space-x-4 mt-2 ml-2">
                      <button className="text-gray-500 hover:text-[#e53e3e] text-sm flex items-center transform transition-transform duration-300 hover:scale-110">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {comment.likes}
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm transform transition-transform duration-300 hover:scale-110">답글</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 댓글 입력 */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#e53e3e] focus:border-transparent transform transition-all duration-300 hover:translate-x-2"
                />
              </div>
              <button
                className={`px-6 py-2 rounded-full font-medium transform transition-all duration-300 hover:scale-110 ${
                  newComment.trim() 
                    ? 'bg-[#e53e3e] text-white hover:bg-[#c53030]' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!newComment.trim()}
              >
                작성
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal; 