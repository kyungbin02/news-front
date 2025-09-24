"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function ColumnWritePage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 기존 칼럼 데이터 불러오기 (localStorage 활용)
    const columns = JSON.parse(localStorage.getItem("columns") || "[]");
    // 새 칼럼 추가
    const newColumn = {
      id: Date.now(),
      title,
      author,
      date: new Date().toISOString().slice(0, 10),
      views: 0,
      comments: 0,
      likes: 0,
      content,
    };
    // 저장
    localStorage.setItem("columns", JSON.stringify([...columns, newColumn]));
    // 칼럼 리스트 페이지로 이동
    router.push("/column");
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">칼럼 글쓰기</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full border p-2"
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full border p-2"
          placeholder="작성자"
          value={author}
          onChange={e => setAuthor(e.target.value)}
          required
        />
        <textarea
          className="w-full border p-2 h-40"
          placeholder="내용"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          등록
        </button>
      </form>
    </div>
  );
} 