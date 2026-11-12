import { IconSearch, IconSparkles } from "@tabler/icons-react";
import { Link } from "react-router-dom";

export function SearchHeader() {
  return (
    <header className="search-header">
      <Link to="/food" className="round purple" aria-label="오늘의 식사 추천">
        <IconSparkles size={28} stroke={1.6} />
      </Link>
      <Link className="search-pill" to="/food">
        오늘의 점심 추천
      </Link>
      <Link to="/search" className="round" aria-label="장소 검색">
        <IconSearch size={28} stroke={1.6} />
      </Link>
    </header>
  );
}
