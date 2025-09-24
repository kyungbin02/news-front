"use client";

import { usePathname } from 'next/navigation';
import SpecialHeader from './SpecialHeader';
import StandardHeader from './StandardHeader';

export default function DynamicHeader() {
  const pathname = usePathname();
  
  // 특별한 헤더를 사용할 페이지들
  const specialHeaderPages = ['/', '/economy', '/sports', '/it'];
  
  // 현재 경로가 특별한 헤더를 사용해야 하는지 확인
  const shouldUseSpecialHeader = specialHeaderPages.includes(pathname);
  
  return shouldUseSpecialHeader ? <SpecialHeader /> : <StandardHeader />;
}

