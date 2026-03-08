import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getPartyColors } from '@/lib/party-colors';
import api from '@/lib/api';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  role: string;
  avatar: string;
}

const FAKE_CANDIDATES: Candidate[] = [
  { id: '1', name: 'Lula da Silva',     party: 'PT',    role: 'Presidente',       avatar: 'https://randomuser.me/api/portraits/men/10.jpg' },
  { id: '2', name: 'Jair Bolsonaro',    party: 'PL',    role: 'Ex-Presidente',    avatar: 'https://randomuser.me/api/portraits/men/20.jpg' },
  { id: '3', name: 'Geraldo Alckmin',   party: 'PSB',   role: 'Vice-Presidente',  avatar: 'https://randomuser.me/api/portraits/men/30.jpg' },
  { id: '4', name: 'Simone Tebet',      party: 'MDB',   role: 'Senadora',         avatar: 'https://randomuser.me/api/portraits/women/40.jpg' },
  { id: '5', name: 'Ciro Gomes',        party: 'PDT',   role: 'Ex-Governador',    avatar: 'https://randomuser.me/api/portraits/men/50.jpg' },
];

interface CandidateSearchProps {
  onSelect: (candidate: Candidate) => void;
  variant?: 'map' | 'sidebar';
}

export function CandidateSearch({ onSelect, variant }: CandidateSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>(FAKE_CANDIDATES);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        name: c.ballot_name ?? c.name,
        party: c.party.abbreviation,
        role: c.role,
        avatar: c.avatar_url ?? '',
      }));
      setCandidates(mapped);
      if (mapped.length === 1) {
        setSelected(mapped[0]);
        onSelect(mapped[0]);
      }
    });
  }, [variant]);

  const filtered = query.trim().length === 0
    ? candidates
    : candidates.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.party.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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
    if (variant === 'sidebar') {
      setSelected(candidate);
      setIsEditing(false);
    }
    onSelect(candidate);
  };

  return (
    <div ref={containerRef} className={variant === 'sidebar' ? 'relative w-full' : 'absolute top-4 left-4 z-[1000] w-64'}>
      {variant === 'sidebar' && selected && !isEditing ? (
        <div
          className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-pointer"
          onClick={() => { setQuery(selected?.name ?? ''); setOpen(true); setIsEditing(true); }}
        >
          {selected.avatar
            ? <img src={selected.avatar} alt={selected.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
            : <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs shrink-0">{selected.name[0]}</div>
          }
          <span className="text-sm font-medium truncate">{selected.name}</span>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Buscar candidato para comparar..."
              className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 placeholder:text-gray-400"
            />
          </div>

          {open && filtered.length > 0 && (
            <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
              {filtered.map((candidate) => {
                const colors = getPartyColors(candidate.party);
                return (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelect(candidate)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                  >
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-900 truncate">{candidate.name}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${colors.gradient ? '' : `${colors.bg} ${colors.text}`}`}
                          style={colors.gradient ? { background: colors.gradient, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.5)' } : undefined}
                        >
                          {candidate.party}
                        </span>
                      </div>
                      {variant !== 'sidebar' && (
                        <span className="text-[10px] text-gray-400 truncate">{candidate.role}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
