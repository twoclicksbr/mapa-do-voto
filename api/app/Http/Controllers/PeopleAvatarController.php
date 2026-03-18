<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class PeopleAvatarController extends Controller
{
    /**
     * Upload avatar — gera 3 versões:
     *   original.jpg  → até 5 MB  (qualidade 90, max 2400px)
     *   md.jpg        → ~2.5 MB   (70% das dimensões, qualidade 85)
     *   sm.jpg        → ~1.25 MB  (50% das dimensões, qualidade 80)
     */
    public function store(Request $request, int $personId)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'max:5120'], // 5 MB
        ]);

        $person = People::findOrFail($personId);
        $tenant = Tenant::findOrFail($person->tenant_id);
        $slug   = $tenant->slug;
        $base   = "{$slug}/avatar/{$personId}";

        // Apaga versões anteriores se existirem
        if ($person->photo_path) {
            Storage::disk('public')->deleteDirectory($person->photo_path);
        }

        $file    = $request->file('avatar');
        $manager = new ImageManager(new Driver());

        // ── original (max 2400px, quality 90) ──────────────────────────────
        $original = $manager->read($file->getRealPath());
        if ($original->width() > 2400 || $original->height() > 2400) {
            $original->scaleDown(2400, 2400);
        }
        Storage::disk('public')->put(
            "{$base}/original.jpg",
            $original->toJpeg(90)->toString()
        );

        // ── md (~2.5 MB — 70% das dimensões, quality 85) ───────────────────
        $md = $manager->read($file->getRealPath());
        $md->scale((int) round($md->width() * 0.70));
        Storage::disk('public')->put(
            "{$base}/md.jpg",
            $md->toJpeg(85)->toString()
        );

        // ── sm (~1.25 MB — 50% das dimensões, quality 80) ──────────────────
        $sm = $manager->read($file->getRealPath());
        $sm->scale((int) round($sm->width() * 0.50));
        Storage::disk('public')->put(
            "{$base}/sm.jpg",
            $sm->toJpeg(80)->toString()
        );

        $person->update(['photo_path' => $base]);

        return response()->json($this->avatarUrls($base));
    }

    public function destroy(int $personId)
    {
        $person = People::findOrFail($personId);

        if ($person->photo_path) {
            Storage::disk('public')->deleteDirectory($person->photo_path);
            $person->update(['photo_path' => null]);
        }

        return response()->json(null, 204);
    }

    public static function avatarUrls(?string $photoPath): array
    {
        if (!$photoPath) {
            return ['photo_original' => null, 'photo_md' => null, 'photo_sm' => null];
        }

        $base = asset("storage/{$photoPath}");

        return [
            'photo_original' => "{$base}/original.jpg",
            'photo_md'       => "{$base}/md.jpg",
            'photo_sm'       => "{$base}/sm.jpg",
        ];
    }
}
