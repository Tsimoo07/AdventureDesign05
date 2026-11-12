import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconSearch,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
} from "@tabler/icons-react";
import { fetchCategories, isDemo } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const { data, loading, error, refetch } = useFetch(fetchCategories);
  const matches = data?.filter(
    (category) =>
      category.label.replace(/\s/g, "").includes(query.replace(/\s/g, "")) ||
      category.items.some((item) => item.label.includes(query)),
  );
  return (
    <section>
      <header className="search-header">
        <Link className="round purple" to="/" aria-label="홈으로">
          <IconChevronLeft />
        </Link>
        <label className="search-input">
          <span className="sr-only">장소 검색</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="검색 · 학생회관, 식사구역"
          />
          <IconSearch size={22} />
        </label>
      </header>
      <div className="page-heading">
        <h1>어디로 갈까요?</h1>
        <p>교내 식사 공간의 혼잡도를 확인하세요</p>
      </div>
      {isDemo && <p className="eyebrow">예시 데이터</p>}
      {loading && <p role="status">불러오는 중...</p>}
      {error && (
        <p role="alert">
          불러오지 못했어요. <button onClick={refetch}>다시 시도</button>
        </p>
      )}
      <div className="place-list">
        {matches?.map((category) => (
          <Link
            key={category.id}
            className="place-card"
            to={`/category/${category.id}`}
          >
            <IconMapPin />
            <span>
              <strong>{category.label}</strong>
              <small>{category.items.length}개 구역 · 혼잡도 보기</small>
            </span>
            <IconChevronRight size={20} />
          </Link>
        ))}
      </div>
      {matches?.length === 0 && (
        <p className="empty">검색 결과가 없어요. 다른 장소를 입력해 주세요.</p>
      )}
    </section>
  );
}
