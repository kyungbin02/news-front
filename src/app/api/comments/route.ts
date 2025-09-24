import { NextRequest, NextResponse } from 'next/server';

// 메모리 기반 댓글 저장 (실제 운영에서는 데이터베이스 사용 권장)
interface Comment {
  id: string;
  newsId: string;
  author: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  dislikes: number;
  replies?: Comment[];
}

// 브라우저 localStorage와 연동하는 댓글 저장소
const comments: { [newsId: string]: Comment[] } = {};

// localStorage에서 댓글 불러오기
function loadCommentsFromStorage() {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('newsComments');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(comments, parsed);
        console.log('💾 localStorage에서 댓글 불러옴:', Object.keys(comments).length, '개 뉴스');
      }
    } catch (error) {
      console.error('댓글 불러오기 실패:', error);
    }
  }
}

// localStorage에 댓글 저장하기
function saveCommentsToStorage() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('newsComments', JSON.stringify(comments));
      console.log('💾 localStorage에 댓글 저장됨');
    } catch (error) {
      console.error('댓글 저장 실패:', error);
    }
  }
}

// 댓글 생성
export async function POST(request: NextRequest) {
  try {
    const { newsId, author, content, parentId } = await request.json();
    
    if (!newsId || !author || !content) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const newComment: Comment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      newsId,
      author: author.trim(),
      content: content.trim(),
      createdAt: new Date(),
      likes: 0,
      dislikes: 0,
      replies: []
    };

    // 뉴스별 댓글 배열 초기화
    if (!comments[newsId]) {
      comments[newsId] = [];
    }

    if (parentId) {
      // 대댓글인 경우
      const parentComment = findCommentById(newsId, parentId);
      if (parentComment) {
        if (!parentComment.replies) {
          parentComment.replies = [];
        }
        parentComment.replies.push(newComment);
      } else {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }
    } else {
      // 일반 댓글인 경우
      comments[newsId].push(newComment);
    }

    return NextResponse.json({ 
      success: true, 
      comment: newComment,
      message: '댓글이 성공적으로 등록되었습니다!'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

// 댓글 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const newsId = searchParams.get('newsId');
    
    if (!newsId) {
      return NextResponse.json({ error: 'News ID is required' }, { status: 400 });
    }

    const newsComments = comments[newsId] || [];
    
    // 최신순으로 정렬
    const sortedComments = newsComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ 
      comments: sortedComments,
      total: countTotalComments(sortedComments)
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// 댓글 수정
export async function PUT(request: NextRequest) {
  try {
    const { commentId, newsId, content } = await request.json();
    
    if (!commentId || !newsId || !content) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    const comment = findCommentById(newsId, commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();

    return NextResponse.json({ 
      success: true, 
      comment,
      message: '댓글이 수정되었습니다!'
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// 댓글 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const newsId = searchParams.get('newsId');
    
    if (!commentId || !newsId) {
      return NextResponse.json({ error: 'Comment ID and News ID are required' }, { status: 400 });
    }

    if (!comments[newsId]) {
      return NextResponse.json({ error: 'News not found' }, { status: 404 });
    }

    // 댓글 삭제 (일반 댓글과 대댓글 모두 처리)
    const deleted = deleteCommentById(newsId, commentId);
    
    if (!deleted) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: '댓글이 삭제되었습니다!'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}

// 유틸리티 함수들
function findCommentById(newsId: string, commentId: string): Comment | null {
  if (!comments[newsId]) return null;
  
  for (const comment of comments[newsId]) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.replies) {
      for (const reply of comment.replies) {
        if (reply.id === commentId) {
          return reply;
        }
      }
    }
  }
  return null;
}

function deleteCommentById(newsId: string, commentId: string): boolean {
  if (!comments[newsId]) return false;
  
  // 일반 댓글에서 찾기
  const commentIndex = comments[newsId].findIndex(c => c.id === commentId);
  if (commentIndex !== -1) {
    comments[newsId].splice(commentIndex, 1);
    return true;
  }
  
  // 대댓글에서 찾기
  for (const comment of comments[newsId]) {
    if (comment.replies) {
      const replyIndex = comment.replies.findIndex(r => r.id === commentId);
      if (replyIndex !== -1) {
        comment.replies.splice(replyIndex, 1);
        return true;
      }
    }
  }
  
  return false;
}

function countTotalComments(comments: Comment[]): number {
  let total = comments.length;
  for (const comment of comments) {
    if (comment.replies) {
      total += comment.replies.length;
    }
  }
  return total;
}