import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { getPartyColors } from '@/lib/party-colors';

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
}

export function CandidateSearch({ onSelect }: CandidateSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length === 0
    ? FAKE_CANDIDATES
    : FAKE_CANDIDATES.filter((c) =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.party.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (candidate: Candidate) => {
    setOpen(false);
    setQuery('');
    onSelect(candidate);
  };

  return (
    <div ref={containerRef} className="absolute top-4 left-4 z-[1000] w-64">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
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
                  <span className="text-[10px] text-gray-400 truncate">{candidate.role}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
