"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";

import { getBrowserSuggestions } from "@/lib/api/browser";
import type { SearchSuggestion } from "@/lib/api/types";

const searchTypes = [
  { value: "all", label: "Everything" },
  { value: "tutorials", label: "Tutorials" },
  { value: "chapters", label: "Chapters" },
  { value: "categories", label: "Categories" },
];

export function SearchForm({
  initialQuery = "",
  initialType = "all",
}: {
  initialQuery?: string;
  initialType?: string;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await getBrowserSuggestions(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(data.suggestions);
          setOpen(data.suggestions.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setOpen(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        event.preventDefault();
        window.location.assign(suggestion.url);
      }
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const showSuggestions = open && query.trim().length >= 2 && suggestions.length > 0;

  return (
    <div onBlur={handleBlur}>
      <form action="/search" method="get" role="search" className="relative">
        <label htmlFor="site-search" className="sr-only">
          Search tutorials, chapters, and categories
        </label>
        <div className="flex flex-col gap-2 border-2 border-ink bg-paper-raised p-2 shadow-[4px_4px_0_0_var(--ink)] sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                className="size-4"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
            </span>
            <input
              ref={inputRef}
              id="site-search"
              name="q"
              type="search"
              value={query}
              onChange={(event) => {
                const nextQuery = event.target.value;
                setQuery(nextQuery);
                if (nextQuery.trim().length < 2) {
                  setSuggestions([]);
                  setOpen(false);
                  setActiveIndex(-1);
                }
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.trim().length >= 2 && suggestions.length > 0) {
                  setOpen(true);
                }
              }}
              placeholder="Search a topic, language, or chapter"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
              }
              className="w-full border-0 bg-transparent py-2 pl-10 pr-3 text-ink outline-none placeholder:text-muted/80"
            />
          </div>

          <label htmlFor="search-type" className="sr-only">
            Search type
          </label>
          <select
            id="search-type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="border border-line-strong bg-paper px-2.5 py-2 text-sm text-ink"
          >
            {searchTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button type="submit" className="button-primary text-sm">
            Search
          </button>
        </div>

        {showSuggestions ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.55rem)] z-30 border-2 border-ink bg-paper-raised shadow-[5px_5px_0_0_var(--ink)]">
            <p className="border-b border-line px-3 py-2 font-mono text-[0.68rem] text-muted">
              Suggestions
            </p>
            <ul id={listboxId} role="listbox" aria-label="Search suggestions">
              {suggestions.map((suggestion, index) => (
                <li
                  key={`${suggestion.type}-${suggestion.url}`}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <Link
                    href={suggestion.url}
                    onClick={() => setOpen(false)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center justify-between gap-3 border-b border-line/60 px-3 py-2.5 text-sm no-underline last:border-b-0 ${
                      index === activeIndex ? "bg-lime text-ink" : "text-ink hover:bg-paper"
                    }`}
                  >
                    <span>{suggestion.title}</span>
                    <span className="font-mono text-[0.65rem] text-muted">{suggestion.type}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>
    </div>
  );
}
