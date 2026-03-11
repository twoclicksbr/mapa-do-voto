<?php

namespace App\Http\Controllers\Map;

use App\Http\Controllers\Controller;
use App\Models\People;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MapStatsController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        // 1. Candidato principal do usuário (order=1, active=true)
        $candidate = DB::selectOne(
            'SELECT c.id, c.name, c.sq_candidato, c.role, c.year, c.state, c.cd_municipio
             FROM user_candidates uc
             JOIN candidates c ON c.id = uc.candidate_id
             WHERE uc.user_id = ?
               AND uc.order = 1
               AND uc.active = true
               AND c.deleted_at IS NULL
             LIMIT 1',
            [$user->id]
        );

        if (! $candidate || ! $candidate->sq_candidato) {
            return response()->json(['error' => 'Candidato não encontrado.'], 404);
        }

        // 2. Último turno disponível
        $turno = DB::selectOne(
            'SELECT MAX(nr_turno) AS nr_turno
             FROM tse_votacao_secao
             WHERE sq_candidato = ?',
            [$candidate->sq_candidato]
        );

        $nrTurno = $turno->nr_turno ?? 1;

        // 3. Total de votos do candidato
        $totalCandidato = DB::selectOne(
            'SELECT COALESCE(SUM(qt_votos), 0) AS total
             FROM tse_votacao_secao
             WHERE sq_candidato = ? AND nr_turno = ?',
            [$candidate->sq_candidato, $nrTurno]
        );

        // 4. Total válidos — todos os votos do cargo/município/turno (aproximação)
        $totalValidos = DB::selectOne(
            'SELECT COALESCE(SUM(qt_votos), 0) AS total
             FROM tse_votacao_secao
             WHERE cd_municipio = ?
               AND ano_eleicao  = ?
               AND nr_turno     = ?',
            [$candidate->cd_municipio, $candidate->year, $nrTurno]
        );

        $votos   = (int) $totalCandidato->total;
        $validos = (int) $totalValidos->total;
        $pct     = $validos > 0 ? round($votos / $validos * 100, 2) : 0;

        // 5. Permissões do people logado
        $people = People::find($user->people_id);
        $permissions = $people
            ? $people->permissions()->pluck('permission')->all()
            : [];

        return response()->json([
            'candidate' => [
                'id'           => $candidate->id,
                'name'         => $candidate->name,
                'sq_candidato' => (int) $candidate->sq_candidato,
                'role'         => $candidate->role,
                'year'         => (int) $candidate->year,
                'state'        => trim($candidate->state),
                'cd_municipio' => $candidate->cd_municipio,
            ],
            'stats' => [
                'nr_turno'      => (int) $nrTurno,
                'total_votos'   => $votos,
                'total_validos' => $validos,
                'percentual'    => $pct,
            ],
            'permissions' => $permissions,
        ]);
    }
}
