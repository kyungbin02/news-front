import { NextRequest, NextResponse } from 'next/server';

// 댓글 좋아요/싫어요 처리 API

// 외부에서 comments 데이터에 접근하기 위한 임시 저장소
// 실제로는 동일한 데이터베이스를 사용해야 함
const commentReactions: { [commentId: string]: { likes: number; dislikes: number; userReactions: { [userId: string]: 'like' | 'dislike' | null } } } = {};

export async function POST(request: NextRequest) {
  try {
    const { commentId, reaction, userId = 'anonymous' } = await request.json();
    
    if (!commentId || !reaction) {
      return NextResponse.json({ error: 'Comment ID and reaction are required' }, { status: 400 });
    }

    if (!['like', 'dislike', 'remove'].includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
    }

    // 댓글 반응 데이터 초기화
    if (!commentReactions[commentId]) {
      commentReactions[commentId] = {
        likes: 0,
        dislikes: 0,
        userReactions: {}
      };
    }

    const reactionData = commentReactions[commentId];
    const currentUserReaction = reactionData.userReactions[userId];

    // 기존 반응 제거
    if (currentUserReaction === 'like') {
      reactionData.likes = Math.max(0, reactionData.likes - 1);
    } else if (currentUserReaction === 'dislike') {
      reactionData.dislikes = Math.max(0, reactionData.dislikes - 1);
    }

    // 새로운 반응 추가
    if (reaction === 'like' && currentUserReaction !== 'like') {
      reactionData.likes += 1;
      reactionData.userReactions[userId] = 'like';
    } else if (reaction === 'dislike' && currentUserReaction !== 'dislike') {
      reactionData.dislikes += 1;
      reactionData.userReactions[userId] = 'dislike';
    } else if (reaction === 'remove') {
      reactionData.userReactions[userId] = null;
    } else {
      // 같은 반응을 다시 클릭한 경우 제거
      reactionData.userReactions[userId] = null;
    }

    return NextResponse.json({
      success: true,
      likes: reactionData.likes,
      dislikes: reactionData.dislikes,
      userReaction: reactionData.userReactions[userId]
    });
  } catch (error) {
    console.error('Error handling comment reaction:', error);
    return NextResponse.json({ error: 'Failed to handle reaction' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('commentId');
    const userId = searchParams.get('userId') || 'anonymous';
    
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    const reactionData = commentReactions[commentId] || {
      likes: 0,
      dislikes: 0,
      userReactions: {}
    };

    return NextResponse.json({
      likes: reactionData.likes,
      dislikes: reactionData.dislikes,
      userReaction: reactionData.userReactions[userId] || null
    });
  } catch (error) {
    console.error('Error fetching comment reactions:', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}