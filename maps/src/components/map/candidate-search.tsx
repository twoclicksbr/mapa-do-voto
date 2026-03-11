import { useState, useRef, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Candidate {
  id: string;
  name: string;
  ballot_name: string | null;
  party: string;
  role: string;
  year: number | null;
  state: string | null;
  // kept for sidebar /candidates compat
  avatar?: string;
}

interface ApiResult {
  id: number;
  name: string;
  ballot_name: string | null;
  role: string;
  year: number;
  state: string | null;
  city_ibge_code: string | null;
  party: { abbreviation: string };
}

interface CandidateSearchProps {
  onSelect: (candidate: Candidate) => void;
  variant?: 'map' | 'sidebar';
}

function displayName(c: Candidate): string {
  return c.ballot_name ?? c.name;
}

function subtitle(c: Candidate): string {
  return [c.party, c.role, c.state].filter(Boolean).join(' · ');
}

export function CandidateSearch({ onSelect, variant }: CandidateSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sidebar: load user's own candidates on mount
  useEffect(() => {
    if (variant !== 'sidebar') return;
    api.get('/candidates').then((res) => {
      const mapped: Candidate[] = res.data.map((c: {
        id: number;
        name: string;
        ballot_name: string | null;
        party: { abbreviation: string };
        role: string;
        avatar_url: string | null;
      }) => ({
        id: String(c.id),
        name: c.name,
        ballot_name: c.ballot_name,
        party: c.party.abbreviation,
        role: c.role,
        year: null,
        state: null,
        avatar: c.avatar_url ?? '',
      }));
      if (mapped.length === 1) {
        setSelected(mapped[0]);
        onSelect(mapped[0]);
      }
    });
  }, [variant]);

  // Search with debounce
  const search = useCallback((q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setOpen(true);
    api.get('/candidates/search', { params: { q } })
      .then((res) => {
        const mapped: Candidate[] = (res.data as ApiResult[]).map((c) => ({
          id: String(c.id),
          name: c.name,
          ballot_name: c.ballot_name,
          party: c.party.abbreviation,
          role: c.role,
          year: c.year,
          state: c.state,
        }));
        setResults(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (candidate: Candidate) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    if (variant === 'sidebar') {
      setSelected(candidate);
      setIsEditing(false);
    }
    onSelect(candidate);
  };

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className={variant === 'sidebar' ? 'relative w-full' : 'absolute top-4 left-4 z-[1000] w-64'}>
      {variant === 'sidebar' && selected && !isEditing ? (
        <div
          className="border border-gray-200 rounded-lg px-3 py-2 bg-white cursor-pointer"
          onClick={() => { setQuery(displayName(selected)); setOpen(false); setIsEditing(true); }}
        >
          <div className="font-semibold text-sm truncate">{displayName(selected)}</div>
          <div className="text-sm text-gray-500">{subtitle(selected)}</div>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => { if (query.length >= 2) setOpen(true); }}
              placeholder="Buscar candidato..."
              className="w-full font-semibold text-sm outline-none placeholder:text-gray-400 placeholder:font-semibold bg-transparent"
            />
            <div className="text-sm text-gray-500">Digite nome ou partido</div>
          </div>

          {showDropdown && (
            <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              {loading ? (
                <div className="px-3 py-2 text-xs text-gray-400">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">Nenhum candidato encontrado</div>
              ) : (
                results.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelect(candidate)}
                    className="w-full flex flex-col px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-gray-900 truncate">{displayName(candidate)}</span>
                    <span className="text-xs text-gray-500 truncate">{subtitle(candidate)}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
