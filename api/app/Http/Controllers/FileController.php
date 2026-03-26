<?php

namespace App\Http\Controllers;

use App\Models\PersonFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileController extends Controller
{
    public function index(string $modulo, int $recordId)
    {
        return PersonFile::where('modulo', $modulo)
            ->where('record_id', $recordId)
            ->orderBy('order')
            ->orderBy('id')
            ->get(['id', 'name', 'mime_type', 'size', 'path', 'order', 'active', 'created_at'])
            ->map(fn ($f) => array_merge($f->toArray(), [
                'url' => asset('storage/' . $f->path),
            ]));
    }

    public function store(Request $request, string $modulo, int $recordId)
    {
        $request->validate([
            'file' => ['required', 'file', 'max:51200'], // 50 MB
        ]);

        $tenant = $request->attributes->get('tenant');
        $slug   = $tenant->slug;

        $uploaded = $request->file('file');
        $ext      = $uploaded->getClientOriginalExtension();
        $safeName = Str::slug(pathinfo($uploaded->getClientOriginalName(), PATHINFO_FILENAME));
        $filename = "{$safeName}-" . Str::random(8) . ".{$ext}";
        $dir      = "{$slug}/files/{$modulo}/{$recordId}";

        Storage::disk('public')->putFileAs($dir, $uploaded, $filename);

        $maxOrder = PersonFile::where('modulo', $modulo)->where('record_id', $recordId)->max('order') ?? 0;

        $record = PersonFile::create([
            'modulo'    => $modulo,
            'record_id' => $recordId,
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

    public function download(string $modulo, int $recordId, int $fileId)
    {
        $file = PersonFile::where('modulo', $modulo)
            ->where('record_id', $recordId)
            ->findOrFail($fileId);

        $fullPath = storage_path('app/public/' . $file->path);

        return response()->download($fullPath, $file->name);
    }

    public function destroy(string $modulo, int $recordId, int $fileId)
    {
        $file = PersonFile::where('modulo', $modulo)
            ->where('record_id', $recordId)
            ->findOrFail($fileId);

        Storage::disk('public')->delete($file->path);
        $file->delete();

        return response()->json(null, 204);
    }
}
