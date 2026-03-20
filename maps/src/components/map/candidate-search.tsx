import { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import api from '@/lib/api';
import { getPartyColors } from '@/lib/party-colors';
import { useLoginModal } from '@/components/auth/login-modal-context';

export interface Candidate {
  id: string;
  name: string;
  ballot_name: string | null;
  ballot_number: string | null;
  party: string;
  role: string;
  year: number | null;
  state_id: number | null;
  state_uf: string | null;
  city_id?: number | null;
  city: string | null;
  city_ibge_code?: string | null;
  photo_url?: string | null;
  // kept for sidebar /candidates compat
  avatar?: string;
}

interface ApiResult {
  id: number;
  sq_candidato: string;
  name: string;
  ballot_name: string | null;
  ballot_number: string | null;
  role: string;
  year: number;
  state_id: number | null;
  state_uf: string | null;
  city_id: number | null;
  city: string | null;
  city_ibge_code: string | null;
  party: string;
  photo_url: string | null;
}

interface CandidateSearchProps {
  onSelect: (candidate: Candidate) => void;
  onClear?: () => void;
  variant?: 'map' | 'sidebar' | 'modal';
}

function displayName(c: Candidate): string {
  return c.ballot_name ?? c.name;
}

const roleMap: Record<string, string> = {
  'DEPUTADO ESTADUAL': 'DEP. ESTADUAL',
  'DEPUTADO FEDERAL': 'DEP. FEDERAL',
  'DEPUTADA ESTADUAL': 'DEP. ESTADUAL',
  'DEPUTADA FEDERAL': 'DEP. FEDERAL',
};

function formatRole(role: string | undefined | null): string {
  if (!role) return '';
  return roleMap[role.toUpperCase()] ?? role;
}

const municipalRoles = ['PREFEITO', 'PREFEITA', 'VICE-PREFEITO', 'VICE-PREFEITA', 'VEREADOR', 'VEREADORA'];
const nationalRoles  = ['PRESIDENTE', 'PRESIDENTA'];


function PartyBadge({ party }: { party: string }) {
  const colors = getPartyColors(party);
  if (colors.gradient) {
    return (
      <span
        className="text-[10px] px-1 py-0.5 rounded font-bold text-white flex-shrink-0"
        style={{ background: colors.gradient }}
      >
        {party}
      </span>
    );
  }
  return (
    <span className={`text-[10px] px-1 py-0.5 rounded font-bold flex-shrink-0 ${colors.bg} ${colors.text}`}>
      {party}
    </span>
  );
}

function PartyBadgeAbsolute({ party }: { party: string }) {
  const colors = getPartyColors(party);
  if (colors.gradient) {
    return (
      <span
        className="absolute top-0 right-3 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
        style={{ background: colors.gradient }}
      >
        {party}
      </span>
    );
  }
  return (
    <span className={`absolute top-0 right-3 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded font-bold ${colors.bg} ${colors.text}`}>
      {party}
    </span>
  );
}

function CandidateInfo({ c, hideBadge, hideDetails }: { c: Candidate; hideBadge?: boolean; hideDetails?: boolean }) {
  if (hideDetails) {
    return (
      <div className="min-w-0 overflow-hidden flex-1 w-0">
        <span className="font-bold text-sm text-gray-900 truncate block">{displayName(c)}</span>
      </div>
    );
  }

  const r = c.role?.toUpperCase() ?? '';
  const isNational  = nationalRoles.includes(r);
  const isMunicipal = municipalRoles.includes(r);

  const num = c.ballot_number ? `Nº ${c.ballot_number}` : null;
  let line2: string;
  let line3: string | null = null;

  if (isNational) {
    line2 = [formatRole(c.role), c.year, num].filter(Boolean).join(' · ');
  } else if (isMunicipal) {
    line2 = [formatRole(c.role), c.year, num].filter(Boolean).join(' · ');
    line3 = [c.city, c.state_uf].filter(Boolean).join(' · ') || null;
  } else {
    line2 = [formatRole(c.role), c.state_uf, c.year, num].filter(Boolean).join(' · ');
  }

  return (
    <div className="min-w-0 overflow-hidden flex-1 w-0">
      <div className="flex items-center gap-1 overflow-hidden">
        <span className="font-bold text-sm text-gray-900 truncate block">{displayName(c)}</span>
        {!hideBadge && c.party && <PartyBadge party={c.party} />}
      </div>
      <div className="text-xs text-gray-600 truncate">{line2}</div>
      {line3 && <div className="text-xs text-gray-400 truncate">{line3}</div>}
    </div>
  );
}

function CandidateAvatar({ candidate, size = 48 }: { candidate: Candidate; size?: number }) {
  const photoUrl = candidate.photo_url ?? candidate.avatar;
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  const initial = (displayName(candidate)?.[0] ?? '?').toUpperCase();
  const colors = candidate.party ? getPartyColors(candidate.party) : { gradient: null, hex: '#6b7280' };
  const bgStyle = colors.gradient
    ? { background: colors.gradient }
    : { backgroundColor: colors.hex };
  return (
    <div
      style={{ width: size, height: size, ...bgStyle }}
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
    >
      {initial}
    </div>
  );
}


export function CandidateSearch({ onSelect, onClear, variant }: CandidateSearchProps) {
  const { loggedIn } = useLoginModal();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sidebar: load user's own candidates — only when logged in
  useEffect(() => {
    if (variant !== 'sidebar') return;
    if (!loggedIn) { setSelected(null); return; }
    api.get('/candidates').then((res) => {
      const mapped: Candidate[] = res.data.map((c: {
        id: number;
        name: string;
        ballot_name: string | null;
        party: { abbreviation: string };
        role: string;
        year: number;
        state_id: number | null;
        state_uf: string | null;
        city_id: number | null;
        city_name: string | null;
        city_ibge_code: string | null;
        avatar_url: string | null;
      }) => ({
        id: String(c.id),
        name: c.name,
        ballot_name: c.ballot_name,
        party: c.party.abbreviation,
        role: c.role,
        year: c.year,
        state_id: c.state_id,
        state_uf: c.state_uf,
        city_id: c.city_id,
        city: c.city_name ?? null,
        city_ibge_code: c.city_ibge_code,
        photo_url: null,
        avatar: c.avatar_url ?? '',
      }));
      if (mapped.length === 1) {
        setSelected(mapped[0]);
        onSelect(mapped[0]);
      }
    });
  }, [variant, loggedIn]);

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
          ballot_number: c.ballot_number,
          party: c.party,
          role: c.role,
          year: c.year,
          state_id: c.state_id,
          state_uf: c.state_uf,
          city_id: c.city_id,
          city: c.city,
          city_ibge_code: c.city_ibge_code,
          photo_url: c.photo_url,
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
    if (variant === 'sidebar' || variant === 'modal') {
      setSelected(candidate);
      setIsEditing(false);
    }
    onSelect(candidate);
  };

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className={(variant === 'sidebar' || variant === 'modal') ? 'relative w-full' : 'absolute top-4 left-4 z-[1000] w-64'}>
      {(variant === 'sidebar' || variant === 'modal') && selected && !isEditing ? (
        <div className="relative w-full" style={{ overflow: 'visible' }}>
          {selected.party && <PartyBadgeAbsolute party={selected.party} />}
          <div
            className="border border-gray-200 rounded-lg px-3 py-2 bg-white cursor-pointer w-full overflow-hidden"
            onClick={() => { setQuery(displayName(selected)); setOpen(false); setIsEditing(true); }}
          >
            <div className="flex gap-3 items-center w-full overflow-hidden">
              <CandidateAvatar candidate={selected} size={48} />
              <CandidateInfo c={selected} hideBadge hideDetails={variant === 'modal'} />
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(null); onClear?.(); }}
            className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 w-5 h-5 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors z-10"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <>
          <div className="border border-gray-200 rounded-lg px-3 py-2 bg-white cursor-text" onClick={() => inputRef.current?.focus()}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => { if (query.length >= 2) setOpen(true); }}
              placeholder="Buscar candidato..."
              className="w-full font-semibold text-sm outline-none placeholder:text-gray-400 placeholder:font-semibold bg-transparent uppercase"
            />
            <div className="text-sm text-gray-500">Digite nome, cargo, ano, cidade, UF ou partido</div>
          </div>

          {showDropdown && (
            <div className={`bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden ${variant === 'modal' ? 'absolute top-full left-0 right-0 z-50 mt-1' : 'mt-1'}`}>
              {loading ? (
                <div className="px-3 py-2 text-xs text-gray-400">Buscando...</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">Nenhum candidato encontrado</div>
              ) : (
                results.map((candidate) => (
                  <button
                    key={candidate.id}
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(candidate); }}
                    className="w-full flex gap-3 items-start px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <CandidateAvatar candidate={candidate} size={40} />
                    <CandidateInfo c={candidate} hideDetails={variant === 'modal'} />
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
