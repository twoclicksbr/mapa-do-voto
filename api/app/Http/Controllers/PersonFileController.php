<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\PersonFile;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PersonFileController extends Controller
{
    public function index(int $personId)
    {
        return PersonFile::where('modulo', 'people')
            ->where('record_id', $personId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'name', 'mime_type', 'size', 'path', 'order', 'active', 'created_at'])
            ->map(fn ($f) => array_merge($f->toArray(), [
                'url' => asset('storage/' . $f->path),
            ]));
    }

    public function store(Request $request, int $personId)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50 MB
        ]);

        $person = People::findOrFail($personId);
        $tenant = Tenant::findOrFail($person->tenant_id);
        $slug   = $tenant->slug;

        $uploaded = $request->file('file');
        $ext      = $uploaded->getClientOriginalExtension();
        $safeName = Str::slug(pathinfo($uploaded->getClientOriginalName(), PATHINFO_FILENAME));
        $filename = "{$safeName}-" . Str::random(8) . ".{$ext}";
        $dir      = "{$slug}/files/{$personId}";

        Storage::disk('public')->putFileAs($dir, $uploaded, $filename);

        $maxOrder = PersonFile::where('modulo', 'people')->where('record_id', $personId)->max('order') ?? 0;

        $record = PersonFile::create([
            'modulo'    => 'people',
            'record_id' => $personId,
            'name'      => $uploaded->getClientOriginalName(),
            'path'      => "{$dir}/{$filename}",
            'mime_type' => $uploaded->getMimeType(),
            'size'      => $uploaded->getSize(),
            'order'     => $maxOrder + 1,
            'active'    => true,
        ]);

        return response()->json(array_merge($record->toArray(), [
            'url' => asset('storage/' . $record->path),
        ]), 201);
    }

    public function download(int $personId, int $id)
    {
        $file = PersonFile::where('modulo', 'people')
            ->where('record_id', $personId)
            ->findOrFail($id);

        $fullPath = storage_path('app/public/' . $file->path);

        return response()->download($fullPath, $file->name);
    }

    public function destroy(int $personId, int $id)
    {
        $file = PersonFile::where('modulo', 'people')
            ->where('record_id', $personId)
            ->findOrFail($id);

        Storage::disk('public')->delete($file->path);
        $file->delete();

        return response()->json(null, 204);
    }
}
