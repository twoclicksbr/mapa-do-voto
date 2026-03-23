<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinAccountRequest;
use App\Models\FinAccount;
use Illuminate\Http\Request;

class FinAccountController extends Controller
{
    /**
     * Retorna o plano de contas em árvore hierárquica.
     * Raízes (parent_id null) na ordem definida; filhos aninhados recursivamente.
     */
    public function index()
    {
        $all = FinAccount::orderBy('order')->orderBy('id')->get();

        $tree = $this->buildTree($all, null);

        return response()->json($tree);
    }

    public function store(FinAccountRequest $request)
    {
        $account = FinAccount::create($request->validated());

        return response()->json($this->format($account), 201);
    }

    public function update(FinAccountRequest $request, int $id)
    {
        $account = FinAccount::findOrFail($id);
        $account->update($request->validated());

        return response()->json($this->format($account));
    }

    public function destroy(int $id)
    {
        $account = FinAccount::findOrFail($id);

        if (FinAccount::where('parent_id', $id)->exists()) {
            return response()->json(['message' => 'Conta possui sub-contas vinculadas.'], 422);
        }

        $account->delete();

        return response()->json(null, 204);
    }

    /**
     * Reordena em lote: [{id, order, parent_id}]
     * Permite mover um nó para outro pai via drag & drop.
     */
    public function reorder(Request $request)
    {
        $request->validate([
            '*.id'        => 'required|integer',
            '*.order'     => 'required|integer|min:1',
            '*.parent_id' => 'nullable|integer',
        ]);

        foreach ($request->all() as $item) {
            FinAccount::where('id', (int) $item['id'])->update([
                'order'     => (int) $item['order'],
                'parent_id' => isset($item['parent_id']) ? (int) $item['parent_id'] : null,
            ]);
        }

        return response()->json(['ok' => true]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function buildTree($all, ?int $parentId): array
    {
        return $all
            ->where('parent_id', $parentId)
            ->values()
            ->map(fn ($account) => array_merge(
                $this->format($account),
                ['children' => $this->buildTree($all, $account->id)]
            ))
            ->toArray();
    }

    private function format(FinAccount $account): array
    {
        return [
            'id'          => $account->id,
            'parent_id'   => $account->parent_id,
            'code'        => $account->code,
            'name'        => $account->name,
            'description' => $account->description,
            'type'        => $account->type,
            'nature'      => $account->nature,
            'order'       => $account->order,
            'active'      => $account->active,
        ];
    }
}
